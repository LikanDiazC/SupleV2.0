import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import type { IItemRepository } from '../../../inventory/domain/repositories/IItemRepository';
import type { IBillOfMaterialsRepository } from '../../../manufacturing/domain/repositories/IBillOfMaterialsRepository';

@Injectable()
export class CheckOrderStockUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IItemRepository')
    private readonly itemRepository: IItemRepository,
    @Inject('IBillOfMaterialsRepository')
    private readonly bomRepository: IBillOfMaterialsRepository,
  ) {}

  async execute(tenantId: string, orderId: string): Promise<string> {
    // 1. Buscamos la orden
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) throw new NotFoundException('Orden no encontrada.');

    // 2. Avanzamos la máquina de estados al nodo de evaluación
    order.markAsCheckingStock();

    let hasAllMaterials = true;

    // 3. Revisamos cada producto que pidieron (Ej: La silla)
    for (const item of order.items) {
      const bom = await this.bomRepository.findByProductId(item.productId.value, tenantId);
      
      if (!bom) {
        hasAllMaterials = false; 
        break; // Si no hay receta, es imposible fabricarla
      }

      // 4. Revisamos los ingredientes (Ej: La madera)
      for (const component of bom.components) {
        const totalRequired = component.quantity * item.quantity; // Ej: 2 maderas x 2 sillas = 4 maderas necesarias
        const material = await this.itemRepository.findById(component.itemId.value, tenantId);

        if (!material || material.stock < totalRequired) {
          hasAllMaterials = false;
          break; // Nos quedamos sin madera
        }
      }
    }

    // 5. Resolución de la Máquina de Estados
    if (hasAllMaterials) {
      order.markAsReadyToStart();
    } else {
      order.putOnHoldForMaterials();
    }

    // 6. Guardamos el nuevo estado en la base de datos
    await this.orderRepository.save(order);

    return order.status;
  }
}