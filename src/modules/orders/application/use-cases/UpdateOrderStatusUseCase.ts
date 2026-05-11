import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';

export class UpdateOrderStatusDto {
  status!: string;
}

@Injectable()
export class UpdateOrderStatusUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepo: IOrderRepository,
  ) {}

  async execute(tenantId: string, orderId: string, status: string): Promise<string> {
    const order = await this.orderRepo.findById(orderId, tenantId);
    if (!order) throw new NotFoundException('Orden no encontrada');
    await this.orderRepo.updateStatus(orderId, tenantId, status);
    return status;
  }
}
