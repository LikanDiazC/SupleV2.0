import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IsUUID, IsNumber, IsInt, Min } from 'class-validator';
import type { IBillOfMaterialsRepository } from '../../domain/repositories/IBillOfMaterialsRepository';
import type { IBomComponentRepository } from '../../domain/repositories/IBomComponentRepository';
import type { ICuttingPlanRepository } from '../../domain/repositories/ICuttingPlanRepository';
import type { IProductRepository } from '../../../inventory/domain/repositories/IProductRepository';
import type { IMaterialRepository } from '../../../inventory/domain/repositories/IMaterialRepository';
import type { IRemnantRepository } from '../../../inventory/domain/repositories/IRemnantRepository';
import type { IInventoryMovementRepository } from '../../../inventory/domain/repositories/IInventoryMovementRepository';
import { CuttingEngine } from '../../domain/services/CuttingEngine';
import { CuttingPlan } from '../../domain/entities/CuttingPlan';
import { Remnant } from '../../../inventory/domain/entities/Remnant';
import { InventoryMovement } from '../../../inventory/domain/entities/InventoryMovement';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';
import { BomComponent } from '../../domain/entities/BomComponent';
import { Material } from '../../../inventory/domain/entities/Material';

export class ManufactureRequestDto {
  @IsUUID()
  productId!: string;

  @IsUUID()
  orderId!: string;

  @IsInt() @Min(1)
  quantity!: number;
}

@Injectable()
export class ManufactureProductUseCase {
  constructor(
    @Inject('IBillOfMaterialsRepository')
    private readonly bomRepository: IBillOfMaterialsRepository,
    @Inject('IBomComponentRepository')
    private readonly componentRepository: IBomComponentRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('IMaterialRepository')
    private readonly materialRepository: IMaterialRepository,
    @Inject('IRemnantRepository')
    private readonly remnantRepository: IRemnantRepository,
    @Inject('ICuttingPlanRepository')
    private readonly cuttingPlanRepository: ICuttingPlanRepository,
    @Inject('IInventoryMovementRepository')
    private readonly movementRepository: IInventoryMovementRepository,
  ) {}

  async execute(tenantId: string, userId: string, dto: ManufactureRequestDto): Promise<void> {
    const tenantVo = new TenantId(tenantId);

    // 1. Buscar BOM del producto
    const bom = await this.bomRepository.findByProductId(dto.productId, tenantId);
    if (!bom) {
      throw new NotFoundException('No existe una receta (BOM) para este producto.');
    }

    // 2. Buscar el producto terminado
    const product = await this.productRepository.findById(dto.productId, tenantId);
    if (!product) {
      throw new NotFoundException('El producto a fabricar no existe en el inventario.');
    }

    // 3. Cargar componentes detallados (con dimensiones de pieza)
    const components = await this.componentRepository.findByBomId(bom.id.value, tenantId);

    try {
      // 4. Consumir materiales de inventario
      for (const comp of components) {
        const totalQty = comp.quantity * dto.quantity;
        const material = await this.materialRepository.findById(comp.materialId.value, tenantId);
        if (!material) {
          throw new NotFoundException(`Material ${comp.materialId.value} no encontrado.`);
        }
        material.removeStock(totalQty);
        await this.materialRepository.save(material);

        await this.movementRepository.save(
          InventoryMovement.create({
            tenantId:   tenantVo,
            itemId:     comp.materialId,
            userId:     new UniqueId(userId),
            type:       'OUT',
            quantity:   totalQty,
            reason:     `Consumo para fabricación: ${dto.quantity}× ${bom.name}`,
            entityType: 'MATERIAL',
          }),
        );
      }

      // 5. Correr motor de corte para componentes de plancha con dimensiones
      const sheetComponents = components.filter(
        (c) => c.hasDimensions(),
      );
      if (sheetComponents.length > 0) {
        await this.runCuttingEngine(
          tenantVo, dto.orderId, sheetComponents, dto.quantity, tenantId,
        );
      }

      // 6. Sumar stock del producto terminado
      product.addStock(dto.quantity);
      await this.productRepository.save(product);

      await this.movementRepository.save(
        InventoryMovement.create({
          tenantId:   tenantVo,
          itemId:     new UniqueId(dto.productId),
          userId:     new UniqueId(userId),
          type:       'IN',
          quantity:   dto.quantity,
          reason:     `Producción terminada: ${bom.name}`,
          entityType: 'PRODUCT',
        }),
      );

    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }

  private async runCuttingEngine(
    tenantId: TenantId,
    orderId: string,
    components: BomComponent[],
    orderQuantity: number,
    tenantIdStr: string,
  ): Promise<void> {
    // Agrupar componentes por material de plancha
    const byMaterial = new Map<string, BomComponent[]>();
    for (const comp of components) {
      const mid = comp.materialId.value;
      if (!byMaterial.has(mid)) byMaterial.set(mid, []);
      byMaterial.get(mid)!.push(comp);
    }

    for (const [materialId, comps] of byMaterial) {
      const material = await this.materialRepository.findById(materialId, tenantIdStr);
      if (!material || !material.isSheet()) continue;

      const sheetSpec = {
        widthMm:           material.sheetWidthMm!,
        heightMm:          material.sheetHeightMm!,
        grainDirection:    material.grainDirection ?? 'NONE',
        kerfMm:            material.kerfMm ?? 3.2,
        minRemnantAreaMm2: material.minRemnantAreaMm2 ?? 60000,
      };

      const pieces = comps
        .filter((c) => c.pieceWidthMm !== undefined && c.pieceHeightMm !== undefined)
        .map((c) => ({
          label:            c.pieceLabel ?? `${c.pieceWidthMm}×${c.pieceHeightMm}`,
          widthMm:          c.pieceWidthMm!,
          heightMm:         c.pieceHeightMm!,
          grainRequirement: c.grainRequirement,
          quantity:         c.quantity * orderQuantity,
        }));

      if (pieces.length === 0) continue;

      const result = CuttingEngine.optimize(pieces, sheetSpec);

      // Guardar plan de corte
      await this.cuttingPlanRepository.save(
        CuttingPlan.create({
          tenantId:     tenantId,
          orderId:      new UniqueId(orderId),
          materialId:   new UniqueId(materialId),
          sheetsUsed:   result.sheetsUsed,
          wastePercent: result.wastePercent,
          layouts:      result.layouts,
          remnants:     result.remnants,
        }),
      );

      // Guardar retazos como inventario (upsert por material + dimensiones)
      for (const rem of result.remnants) {
        const existing = await this.remnantRepository.findByDimensions(
          materialId, rem.widthMm, rem.heightMm, tenantIdStr,
        );
        if (existing) {
          existing.addStock(1);
          await this.remnantRepository.save(existing);
        } else {
          await this.remnantRepository.save(
            Remnant.create({
              tenantId:      tenantId,
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
}
