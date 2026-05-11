export interface OrderNotificationRecord {
  step: string;
  markedAt: Date;
  markedByUserId: string;
}

export interface IOrderNotificationRepository {
  mark(orderId: string, tenantId: string, step: string, userId: string): Promise<void>;
  unmark(orderId: string, tenantId: string, step: string): Promise<void>;
  findByOrderId(orderId: string, tenantId: string): Promise<OrderNotificationRecord[]>;
  findByOrderIds(orderIds: string[], tenantId: string): Promise<Record<string, OrderNotificationRecord[]>>;
}
