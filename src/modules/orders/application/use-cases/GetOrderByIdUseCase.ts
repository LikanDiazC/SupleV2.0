import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import type { IProductRepository } from '../../../inventory/domain/repositories/IProductRepository';
import { GetOrderNotificationsUseCase } from '../../../order-notifications/application/use-cases/GetOrderNotificationsUseCase';

@Injectable()
export class GetOrderByIdUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    private readonly getNotificationsUseCase: GetOrderNotificationsUseCase,
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

    const notifications = await this.getNotificationsUseCase.executeForOrder(orderId, tenantId);

    return {
      id:               order.id.value,
      reference:        order.externalReference,
      externalReference: order.externalReference,
      clientName:       order.customerName,
      customerName:     order.customerName,
      status:           order.status,
      productName,
      quantity,
      items: order.items.map((i) => ({
        productId: i.productId.value,
        quantity:  i.quantity,
      })),
      orderType:        (order as any).orderType       ?? null,
      description:      (order as any).description     ?? null,
      fechaConfeccion:  (order as any).fechaConfeccion ?? null,
      fechaEntrega:     (order as any).fechaEntrega    ?? null,
      horario:          (order as any).horario         ?? null,
      comuna:           (order as any).comuna          ?? null,
      color:            (order as any).color           ?? null,
      mesVenta:         (order as any).mesVenta        ?? null,
      extraData:        (order as any).extraData       ?? null,
      notifications,
      createdAt:        order.createdAt,
      updatedAt:        order.updatedAt,
    };
  }
}
