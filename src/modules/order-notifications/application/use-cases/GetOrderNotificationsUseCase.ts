import { Injectable, Inject } from '@nestjs/common';
import type {
  IOrderNotificationRepository,
  OrderNotificationRecord,
} from '../../domain/repositories/IOrderNotificationRepository';

@Injectable()
export class GetOrderNotificationsUseCase {
  constructor(
    @Inject('IOrderNotificationRepository')
    private readonly repo: IOrderNotificationRepository,
  ) {}

  async executeForOrder(orderId: string, tenantId: string): Promise<OrderNotificationRecord[]> {
    return this.repo.findByOrderId(orderId, tenantId);
  }

  async executeForOrders(
    orderIds: string[],
    tenantId: string,
  ): Promise<Record<string, OrderNotificationRecord[]>> {
    return this.repo.findByOrderIds(orderIds, tenantId);
  }
}
