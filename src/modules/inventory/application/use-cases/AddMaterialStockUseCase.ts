import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IMaterialRepository } from '../../domain/repositories/IMaterialRepository';
import type { IInventoryMovementRepository } from '../../domain/repositories/IInventoryMovementRepository';
import { InventoryMovement } from '../../domain/entities/InventoryMovement';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export class AddMaterialStockDto {
  quantity!: number;
  reason!:   string;
}

@Injectable()
export class AddMaterialStockUseCase {
  constructor(
    @Inject('IMaterialRepository')
    private readonly materialRepository: IMaterialRepository,
    @Inject('IInventoryMovementRepository')
    private readonly movementRepository: IInventoryMovementRepository,
  ) {}

  async execute(
    materialId: string,
    tenantId:   string,
    userId:     string,
    dto:        AddMaterialStockDto,
  ): Promise<void> {
    const material = await this.materialRepository.findById(materialId, tenantId);
    if (!material) throw new NotFoundException('Material no encontrado.');

    try {
      material.addStock(dto.quantity);

      const movement = InventoryMovement.create({
        tenantId:   new TenantId(tenantId),
        itemId:     new UniqueId(materialId),
        userId:     new UniqueId(userId),
        type:       'IN',
        quantity:   dto.quantity,
        reason:     dto.reason,
        entityType: 'MATERIAL',
      });

      await this.materialRepository.save(material);
      await this.movementRepository.save(movement);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
