import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IItemRepository } from '../../domain/repositories/IItemRepository';
import type { IInventoryMovementRepository } from '../../domain/repositories/IInventoryMovementRepository';
import { InventoryMovement } from '../../domain/entities/InventoryMovement';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export class ReceiveItemStockDto {
  quantity!: number;
  reason!: string; // 👇 Por qué entró (ej: "Compra Fac-123")
}

@Injectable()
export class ReceiveItemStockUseCase {
  constructor(
    @Inject('IItemRepository')
    private readonly itemRepository: IItemRepository,
    @Inject('IInventoryMovementRepository')
    private readonly movementRepository: IInventoryMovementRepository,
  ) {}

  async execute(itemId: string, tenantId: string, userId: string, dto: ReceiveItemStockDto): Promise<void> {
    const item = await this.itemRepository.findById(itemId, tenantId);

    if (!item) {
      throw new NotFoundException('El artículo no existe o no pertenece a tu empresa.');
    }

    try {
      item.addStock(dto.quantity);
      
      const movement = InventoryMovement.create({
        tenantId: new TenantId(tenantId),
        itemId: new UniqueId(itemId),
        userId: new UniqueId(userId),
        type: 'IN', // Es una entrada
        quantity: dto.quantity,
        reason: dto.reason,
      });

      await this.itemRepository.save(item);
      await this.movementRepository.save(movement);
      
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}