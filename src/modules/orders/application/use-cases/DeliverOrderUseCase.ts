import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';

@Injectable()
export class DeliverOrderUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(tenantId: string, orderId: string): Promise<string> {
    const order = await this.orderRepository.findById(orderId, tenantId);
    if (!order) throw new NotFoundException('Orden no encontrada.');

    try {
      // Avanzamos el estado final (El dominio verifica que esté en SHIPPED)
      order.deliverOrder();
      
      await this.orderRepository.save(order);
      return order.status;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}