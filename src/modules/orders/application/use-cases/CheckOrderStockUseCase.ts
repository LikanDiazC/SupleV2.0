import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import type { IMaterialRepository } from '../../../inventory/domain/repositories/IMaterialRepository';
import type { IBomComponentRepository } from '../../../manufacturing/domain/repositories/IBomComponentRepository';
import type { IBillOfMaterialsRepository } from '../../../manufacturing/domain/repositories/IBillOfMaterialsRepository';
import type { Material } from '../../../inventory/domain/entities/Material';

interface MaterialNeed {
  material: Material;
  totalPieceAreaMm2: number;  // for SHEET: accumulated piece area
  totalQuantity: number;      // for non-SHEET: accumulated units
}

@Injectable()
export class CheckOrderStockUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IMaterialRepository')
    private readonly materialRepository: IMaterialRepository,
    @Inject('IBomComponentRepository')
    private readonly bomComponentRepository: IBomComponentRepository,
    @Inject('IBillOfMaterialsRepository')
    private readonly bomRepository: IBillOfMaterialsRepository,
  ) {}

  async execute(tenantId: string, orderId: string): Promise<string> {
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) throw new NotFoundException('Orden no encontrada.');

    order.markAsCheckingStock();

    // Accumulate needs per material across all order items
    const needs = new Map<string, MaterialNeed>();

    for (const item of order.items) {
      const itemQty = Number(item.quantity) || 1;

      const bom = await this.bomRepository.findByProductId(item.productId.value, tenantId);
      if (!bom) {
        order.putOnHoldForMaterials();
        await this.orderRepository.save(order);
        return order.status;
      }

      const components = await this.bomComponentRepository.findByBomId(bom.id.value, tenantId);

      // Fallback: if bom_components is empty, use JSONB components from bill_of_materials
      const effectiveComponents = components.length > 0
        ? components.map(c => ({
            materialId: c.materialId.value,
            quantity:   c.quantity,
            pieceWidthMm:  c.pieceWidthMm,
            pieceHeightMm: c.pieceHeightMm,
          }))
        : bom.components.map(c => ({
            materialId: c.itemId.value,
            quantity:   c.quantity,
            pieceWidthMm:  undefined as number | undefined,
            pieceHeightMm: undefined as number | undefined,
          }));

      if (effectiveComponents.length === 0) {
        order.putOnHoldForMaterials();
        await this.orderRepository.save(order);
        return order.status;
      }

      for (const comp of effectiveComponents) {
        if (!needs.has(comp.materialId)) {
          const material = await this.materialRepository.findById(comp.materialId, tenantId);
          if (!material) {
            order.putOnHoldForMaterials();
            await this.orderRepository.save(order);
            return order.status;
          }
          needs.set(comp.materialId, { material, totalPieceAreaMm2: 0, totalQuantity: 0 });
        }

        const need = needs.get(comp.materialId)!;
        const piecesNeeded = Number(comp.quantity) * itemQty;

        if (
          need.material.materialType === 'SHEET' &&
          comp.pieceWidthMm && comp.pieceHeightMm
        ) {
          need.totalPieceAreaMm2 += comp.pieceWidthMm * comp.pieceHeightMm * piecesNeeded;
        } else {
          need.totalQuantity += piecesNeeded;
        }
      }
    }

    // Verify stock for each accumulated material
    for (const [, { material, totalPieceAreaMm2, totalQuantity }] of needs) {
      if (material.materialType === 'SHEET' && material.sheetWidthMm && material.sheetHeightMm) {
        const sheetArea = material.sheetWidthMm * material.sheetHeightMm;
        const sheetsNeeded = totalPieceAreaMm2 > 0
          ? Math.ceil(totalPieceAreaMm2 / sheetArea)
          : totalQuantity; // fallback if no dimensions
        if (material.stock < sheetsNeeded) {
          order.putOnHoldForMaterials();
          await this.orderRepository.save(order);
          return order.status;
        }
      } else {
        if (material.stock < totalQuantity) {
          order.putOnHoldForMaterials();
          await this.orderRepository.save(order);
          return order.status;
        }
      }
    }

    order.markAsReadyToStart();
    await this.orderRepository.save(order);
    return order.status;
  }
}
