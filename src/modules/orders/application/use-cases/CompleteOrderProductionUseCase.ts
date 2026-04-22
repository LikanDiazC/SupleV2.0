import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import type { IItemRepository } from '../../../inventory/domain/repositories/IItemRepository';
import type { IInventoryMovementRepository } from '../../../inventory/domain/repositories/IInventoryMovementRepository';
import { InventoryMovement } from '../../../inventory/domain/entities/InventoryMovement';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';
import { Item } from '../../../inventory/domain/entities/Item';

@Injectable()
export class CompleteOrderProductionUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IItemRepository')
    private readonly itemRepository: IItemRepository,
    // Aquí no necesitamos las recetas (BOM), porque solo vamos a sumar el producto final
    @Inject('IInventoryMovementRepository')
    private readonly movementRepository: IInventoryMovementRepository,
  ) {}

  async execute(tenantId: string, orderId: string, userId: string): Promise<string> {
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) throw new NotFoundException('Orden no encontrada.');

    try {
      // 1. Avanzamos el estado (El dominio validará que esté obligatoriamente en IN_PRODUCTION)
      order.markAsManufactured();

      const itemsToUpdate: Item[] = [];
      const movementsToSave: InventoryMovement[] = [];

      // 2. Sumamos el stock de cada producto fabricado
      for (const orderItem of order.items) {
        const product = await this.itemRepository.findById(orderItem.productId.value, tenantId);
        
        if (!product) {
          throw new NotFoundException(`El producto con ID ${orderItem.productId.value} no existe en inventario.`);
        }

        // Sumamos las sillas al stock
        product.addStock(orderItem.quantity);
        itemsToUpdate.push(product);

        // Creamos el registro de auditoría (Entrada de producto terminado)
        const inMovement = InventoryMovement.create({
          tenantId: new TenantId(tenantId),
          itemId: orderItem.productId,
          userId: new UniqueId(userId),
          type: 'IN',
          quantity: orderItem.quantity,
          reason: `Producción completada para Orden: ${order.externalReference}`,
        });
        movementsToSave.push(inMovement);
      }

      // 3. Guardamos todo en la base de datos
      for (const item of itemsToUpdate) {
        await this.itemRepository.save(item);
      }
      for (const movement of movementsToSave) {
        await this.movementRepository.save(movement);
      }
      await this.orderRepository.save(order);

      return order.status;

    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}