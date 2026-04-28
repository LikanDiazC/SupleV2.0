import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import type { IProductRepository } from '../../../inventory/domain/repositories/IProductRepository';
import type { IInventoryMovementRepository } from '../../../inventory/domain/repositories/IInventoryMovementRepository';
import type { IMaterialRepository } from '../../../inventory/domain/repositories/IMaterialRepository';
import type { IBomComponentRepository } from '../../../manufacturing/domain/repositories/IBomComponentRepository';
import type { IBillOfMaterialsRepository } from '../../../manufacturing/domain/repositories/IBillOfMaterialsRepository';
import type { ICuttingPlanRepository } from '../../../manufacturing/domain/repositories/ICuttingPlanRepository';
import type { IRemnantRepository } from '../../../inventory/domain/repositories/IRemnantRepository';
import { InventoryMovement } from '../../../inventory/domain/entities/InventoryMovement';
import { CuttingPlan } from '../../../manufacturing/domain/entities/CuttingPlan';
import { Remnant } from '../../../inventory/domain/entities/Remnant';
import { CuttingEngine } from '../../../manufacturing/domain/services/CuttingEngine';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class CompleteOrderProductionUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('IInventoryMovementRepository')
    private readonly movementRepository: IInventoryMovementRepository,
    @Inject('IMaterialRepository')
    private readonly materialRepository: IMaterialRepository,
    @Inject('IBomComponentRepository')
    private readonly bomComponentRepository: IBomComponentRepository,
    @Inject('IBillOfMaterialsRepository')
    private readonly bomRepository: IBillOfMaterialsRepository,
    @Inject('ICuttingPlanRepository')
    private readonly cuttingPlanRepository: ICuttingPlanRepository,
    @Inject('IRemnantRepository')
    private readonly remnantRepository: IRemnantRepository,
  ) {}

  async execute(tenantId: string, orderId: string, userId: string): Promise<string> {
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) throw new NotFoundException('Orden no encontrada.');

    try {
      order.markAsManufactured();
      const tenantVo = new TenantId(tenantId);

      for (const orderItem of order.items) {
        // Update finished product stock
        const product = await this.productRepository.findById(orderItem.productId.value, tenantId);
        if (product) {
          product.addStock(orderItem.quantity);
          await this.productRepository.save(product);

          await this.movementRepository.save(
            InventoryMovement.create({
              tenantId:   tenantVo,
              itemId:     orderItem.productId,
              userId:     new UniqueId(userId),
              type:       'IN',
              quantity:   orderItem.quantity,
              reason:     `Producción completada para Orden: ${order.externalReference}`,
              entityType: 'PRODUCT',
            }),
          );
        }
        // If product still not found, skip stock update but continue — order still completes

        // Generate cutting plan and commit remnants to inventory
        const bom = await this.bomRepository.findByProductId(orderItem.productId.value, tenantId);
        if (!bom) continue;

        const components = await this.bomComponentRepository.findByBomId(bom.id.value, tenantId);
        const sheetComponents = components.filter(c => c.hasDimensions());
        if (sheetComponents.length === 0) continue;

        const byMaterial = new Map<string, typeof sheetComponents>();
        for (const comp of sheetComponents) {
          const mid = comp.materialId.value;
          if (!byMaterial.has(mid)) byMaterial.set(mid, []);
          byMaterial.get(mid)!.push(comp);
        }

        for (const [materialId, comps] of byMaterial) {
          const material = await this.materialRepository.findById(materialId, tenantId);
          if (!material || !material.isSheet() || !material.sheetWidthMm || !material.sheetHeightMm) continue;

          const pieces = comps
            .filter(c => c.pieceWidthMm !== undefined && c.pieceHeightMm !== undefined)
            .map(c => ({
              label:            c.pieceLabel ?? `${c.pieceWidthMm}×${c.pieceHeightMm}`,
              widthMm:          c.pieceWidthMm!,
              heightMm:         c.pieceHeightMm!,
              grainRequirement: (c.grainRequirement ?? 'ANY') as 'FOLLOW' | 'CROSS' | 'ANY',
              quantity:         c.quantity * orderItem.quantity,
            }));

          if (pieces.length === 0) continue;

          const result = CuttingEngine.optimize(pieces, {
            widthMm:           material.sheetWidthMm,
            heightMm:          material.sheetHeightMm,
            grainDirection:    material.grainDirection ?? 'NONE',
            kerfMm:            material.kerfMm ?? 3.2,
            minRemnantAreaMm2: material.minRemnantAreaMm2 ?? 60000,
          });

          await this.cuttingPlanRepository.save(
            CuttingPlan.create({
              tenantId:     tenantVo,
              orderId:      new UniqueId(orderId),
              materialId:   new UniqueId(materialId),
              sheetsUsed:   result.sheetsUsed,
              wastePercent: result.wastePercent,
              layouts:      result.layouts,
              remnants:     result.remnants,
            }),
          );

          for (const rem of result.remnants) {
            const existing = await this.remnantRepository.findByDimensions(
              materialId, rem.widthMm, rem.heightMm, tenantId,
            );
            if (existing) {
              existing.addStock(1);
              await this.remnantRepository.save(existing);
            } else {
              await this.remnantRepository.save(
                Remnant.create({
                  tenantId:      tenantVo,
                  materialId:    new UniqueId(materialId),
                  widthMm:       rem.widthMm,
                  heightMm:      rem.heightMm,
                  stock:         1,
                  sourceOrderId: new UniqueId(orderId),
                }),
              );
            }
          }
        }
      }

      await this.orderRepository.save(order);
      return order.status;

    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
