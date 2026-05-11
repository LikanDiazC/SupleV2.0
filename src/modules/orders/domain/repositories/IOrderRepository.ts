import { Order } from '../entities/Order';

export interface IOrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string, tenantId: string): Promise<Order | null>;
  findAll(tenantId: string, limit?: number, offset?: number): Promise<Order[]>;
  updateStatus(id: string, tenantId: string, status: string): Promise<void>;
}