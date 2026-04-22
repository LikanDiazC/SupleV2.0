import { Order } from '../entities/Order';

export interface IOrderRepository {
  save(order: Order): Promise<void>;
  findById(id: string, tenantId: string): Promise<Order | null>;
  findAll(tenantId: string): Promise<Order[]>;
}