import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import type { IMaterialRepository } from '../../../inventory/domain/repositories/IMaterialRepository';
import type { IBomComponentRepository } from '../../../manufacturing/domain/repositories/IBomComponentRepository';
import type { IBillOfMaterialsRepository } from '../../../manufacturing/domain/repositories/IBillOfMaterialsRepository';
import type { IInventoryMovementRepository } from '../../../inventory/domain/repositories/IInventoryMovementRepository';
import type { Material } from '../../../inventory/domain/entities/Material';
import { InventoryMovement } from '../../../inventory/domain/entities/InventoryMovement';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';
import { CuttingEngine, PieceInput } from '../../../manufacturing/domain/services/CuttingEngine';

interface MaterialAccumulator {
  material: Material;
  materialId: UniqueId;
  pieces: PieceInput[];   // SHEET with known piece dimensions
  totalQuantity: number;  // non-SHEET or missing dimensions
}

@Injectable()
export class StartOrderProductionUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IMaterialRepository')
    private readonly materialRepository: IMaterialRepository,
    @Inject('IBomComponentRepository')
    private readonly bomComponentRepository: IBomComponentRepository,
    @Inject('IBillOfMaterialsRepository')
    private readonly bomRepository: IBillOfMaterialsRepository,
    @Inject('IInventoryMovementRepository')
    private readonly movementRepository: IInventoryMovementRepository,
  ) {}

  async execute(tenantId: string, orderId: string, userId: string): Promise<string> {
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) throw new NotFoundException('Orden no encontrada.');

    try {
      order.startProduction();

      // First pass: accumulate pieces per material across all order items
      const materialMap = new Map<string, MaterialAccumulator>();

      for (const orderItem of order.items) {
        const bom = await this.bomRepository.findByProductId(orderItem.productId.value, tenantId);
        if (!bom) throw new NotFoundException('Falta receta para un producto.');

        const components = await this.bomComponentRepository.findByBomId(bom.id.value, tenantId);
        if (components.length === 0) throw new NotFoundException('La receta no tiene componentes.');

        for (const component of components) {
          const matKey = component.materialId.value;

          if (!materialMap.has(matKey)) {
            const material = await this.materialRepository.findById(matKey, tenantId);
            if (!material) throw new NotFoundException(`Material ${matKey} no encontrado.`);
            materialMap.set(matKey, { material, materialId: component.materialId, pieces: [], totalQuantity: 0 });
          }

          const acc = materialMap.get(matKey)!;
          const piecesNeeded = component.quantity * orderItem.quantity;

          if (
            acc.material.materialType === 'SHEET' &&
            acc.material.sheetWidthMm && acc.material.sheetHeightMm &&
            component.pieceWidthMm && component.pieceHeightMm
          ) {
            acc.pieces.push({
              label:            matKey,
              widthMm:          component.pieceWidthMm,
              heightMm:         component.pieceHeightMm,
              grainRequirement: 'ANY',
              quantity:         piecesNeeded,
            });
          } else {
            acc.totalQuantity += piecesNeeded;
          }
        }
      }

      // Second pass: consume stock once per material
      for (const [, acc] of materialMap) {
        let qtyToRemove: number;

        if (acc.pieces.length > 0) {
          const result = CuttingEngine.optimize(acc.pieces, {
            widthMm:           acc.material.sheetWidthMm!,
            heightMm:          acc.material.sheetHeightMm!,
            grainDirection:    'NONE',
            kerfMm:            3,
            minRemnantAreaMm2: 0,
          });
          qtyToRemove = result.sheetsUsed + acc.totalQuantity;
        } else {
          qtyToRemove = acc.totalQuantity;
        }

        acc.material.removeStock(qtyToRemove);
        await this.materialRepository.save(acc.material);

        await this.movementRepository.save(
          InventoryMovement.create({
            tenantId:   new TenantId(tenantId),
            itemId:     acc.materialId,
            userId:     new UniqueId(userId),
            type:       'OUT',
            quantity:   qtyToRemove,
            reason:     `Consumo en taller para Orden: ${order.externalReference}`,
            entityType: 'MATERIAL',
          }),
        );
      }

      await this.orderRepository.updateStatus(order.id.value, tenantId, order.status);
      return order.status;

    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
