import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { CheckOrderStockUseCase } from './CheckOrderStockUseCase';
import { OrderStatusAutoNotifier } from '../services/OrderStatusAutoNotifier';

@Injectable()
export class ConfirmOrderDesignUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly checkStockUseCase: CheckOrderStockUseCase,
    private readonly autoNotifier: OrderStatusAutoNotifier,
  ) {}

  async execute(tenantId: string, orderId: string, userId: string): Promise<string> {
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) throw new NotFoundException('Orden no encontrada.');

    try {
      order.confirmDesign();
      await this.orderRepository.updateStatus(order.id.value, tenantId, order.status);
      await this.autoNotifier.markFor(tenantId, orderId, 'DESIGN_CONFIRMED', userId);

      const finalStatus = await this.checkStockUseCase.execute(tenantId, orderId);
      return finalStatus;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
