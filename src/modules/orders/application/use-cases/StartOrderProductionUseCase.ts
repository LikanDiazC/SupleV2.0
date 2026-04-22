import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import type { IItemRepository } from '../../../inventory/domain/repositories/IItemRepository';
import type { IBillOfMaterialsRepository } from '../../../manufacturing/domain/repositories/IBillOfMaterialsRepository';
import type { IInventoryMovementRepository } from '../../../inventory/domain/repositories/IInventoryMovementRepository';
import { InventoryMovement } from '../../../inventory/domain/entities/InventoryMovement';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';
import { Item } from '../../../inventory/domain/entities/Item'; // Importamos el molde para el arreglo

@Injectable()
export class StartOrderProductionUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IItemRepository')
    private readonly itemRepository: IItemRepository,
    @Inject('IBillOfMaterialsRepository')
    private readonly bomRepository: IBillOfMaterialsRepository,
    // 👇 Añadimos al guardián del historial para registrar la salida de la madera
    @Inject('IInventoryMovementRepository')
    private readonly movementRepository: IInventoryMovementRepository,
  ) {}

  async execute(tenantId: string, orderId: string, userId: string): Promise<string> {
    // 1. Buscamos la orden
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) throw new NotFoundException('Orden no encontrada.');

    try {
      // 2. Avanzamos el nodo (El Dominio validará que esté en READY_TO_START)
      order.startProduction();
      
      const itemsToUpdate: Item[] = [];
      const movementsToSave: InventoryMovement[] = [];

      // 3. Vamos producto por producto buscando sus recetas
      for (const orderItem of order.items) {
        const bom = await this.bomRepository.findByProductId(orderItem.productId.value, tenantId);
        if (!bom) throw new NotFoundException('Falta receta para un producto.');

        // 4. Descontamos los materiales exactos
        for (const component of bom.components) {
          const totalRequired = component.quantity * orderItem.quantity;
          const material = await this.itemRepository.findById(component.itemId.value, tenantId);

          if (!material) throw new NotFoundException('Material no encontrado.');

          // Descontamos del molde
          material.removeStock(totalRequired);
          itemsToUpdate.push(material);

          // Creamos la auditoría del movimiento (Razón: Consumo por Orden)
          const outMovement = InventoryMovement.create({
            tenantId: new TenantId(tenantId),
            itemId: component.itemId,
            userId: new UniqueId(userId),
            type: 'OUT',
            quantity: totalRequired,
            reason: `Consumo en taller para Orden: ${order.externalReference}`,
          });
          movementsToSave.push(outMovement);
        }
      }

      // 5. ¡A guardar todo! Actualizamos la base de datos en bloque
      for (const item of itemsToUpdate) {
        await this.itemRepository.save(item);
      }
      for (const movement of movementsToSave) {
        await this.movementRepository.save(movement);
      }
      await this.orderRepository.save(order);

      return order.status;

    } catch (error: any) {
      // Si la máquina de estados o el control de stock fallan, atrapamos el error
      throw new BadRequestException(error.message);
    }
  }
}