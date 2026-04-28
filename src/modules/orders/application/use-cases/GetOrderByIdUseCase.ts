import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import type { IProductRepository } from '../../../inventory/domain/repositories/IProductRepository';

@Injectable()
export class GetOrderByIdUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(tenantId: string, orderId: string) {
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) throw new NotFoundException('Orden no encontrada');

    const firstItem = order.items[0];
    let productName: string | undefined;
    let quantity: number | undefined;

    if (firstItem) {
      const product = await this.productRepository.findById(firstItem.productId.value, tenantId);
      productName = product?.name;
      quantity    = firstItem.quantity;
    }

    return {
      id:         order.id.value,
      reference:  order.externalReference,
      clientName: order.customerName,
      status:     order.status,
      productName,
      quantity,
      items: order.items.map((i) => ({
        productId: i.productId.value,
        quantity:  i.quantity,
      })),
      createdAt:  order.createdAt,
      updatedAt:  order.updatedAt,
    };
  }
}
