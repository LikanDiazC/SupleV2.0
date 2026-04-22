import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';

@Injectable()
export class GetOrderByIdUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(tenantId: string, orderId: string) {
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) throw new NotFoundException('Orden no encontrada');

    return {
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
    };
  }
}