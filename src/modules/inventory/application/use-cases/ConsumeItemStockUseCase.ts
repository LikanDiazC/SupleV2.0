import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IItemRepository } from '../../domain/repositories/IItemRepository';
import type { IInventoryMovementRepository } from '../../domain/repositories/IInventoryMovementRepository';
import { InventoryMovement } from '../../domain/entities/InventoryMovement';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export class ConsumeItemStockDto {
  quantity!: number;
  reason!: string; // 👇 ¡NUEVO! Obligamos al carpintero a decir por qué saca madera
}

@Injectable()
export class ConsumeItemStockUseCase {
  constructor(
    @Inject('IItemRepository')
    private readonly itemRepository: IItemRepository,
    // 👇 Inyectamos la bóveda del historial
    @Inject('IInventoryMovementRepository')
    private readonly movementRepository: IInventoryMovementRepository,
  ) {}

  // 👇 Añadimos userId a los parámetros
  async execute(itemId: string, tenantId: string, userId: string, dto: ConsumeItemStockDto): Promise<void> {
    const item = await this.itemRepository.findById(itemId, tenantId);

    if (!item) {
      throw new NotFoundException('El artículo no existe o no pertenece a tu empresa.');
    }

    try {
      // 1. Descontamos el stock en el Dominio (valida que no quede en negativo)
      item.removeStock(dto.quantity);
      
      // 2. Creamos el registro del movimiento
      const movement = InventoryMovement.create({
        tenantId: new TenantId(tenantId),
        itemId: new UniqueId(itemId),
        userId: new UniqueId(userId),
        type: 'OUT', // Es una salida
        quantity: dto.quantity,
        reason: dto.reason,
      });

      // 3. Guardamos ambos en la base de datos
      await this.itemRepository.save(item);
      await this.movementRepository.save(movement);
      
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}