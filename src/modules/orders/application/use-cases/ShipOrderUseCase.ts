import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { OrderStatusAutoNotifier } from '../services/OrderStatusAutoNotifier';

@Injectable()
export class ShipOrderUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly autoNotifier: OrderStatusAutoNotifier,
  ) {}

  async execute(tenantId: string, orderId: string, userId: string): Promise<string> {
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) throw new NotFoundException('Orden no encontrada.');

    try {
      order.shipOrder();
      await this.orderRepository.updateStatus(order.id.value, tenantId, order.status);
      await this.autoNotifier.markFor(tenantId, orderId, 'SHIPPED', userId);
      return order.status;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
