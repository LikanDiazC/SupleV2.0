import { Injectable, Inject } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';

@Injectable()
export class GetOrdersUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(tenantId: string) {
    const orders = await this.orderRepository.findAll(tenantId);
    
    // Transformamos las entidades complejas en objetos simples para la respuesta HTTP
    return orders.map(order => ({
      id: order.id.value,
      externalReference: order.externalReference,
      customerName: order.customerName,
      status: order.status,
      items: order.items.map(item => ({
        productId: item.productId.value,
        quantity: item.quantity
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));
  }
}