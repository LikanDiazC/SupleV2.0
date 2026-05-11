import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { OrderNotificationOrmEntity } from './OrderNotificationOrmEntity';
import {
  IOrderNotificationRepository,
  OrderNotificationRecord,
} from '../../domain/repositories/IOrderNotificationRepository';

@Injectable()
export class TypeOrmOrderNotificationRepository implements IOrderNotificationRepository {
  constructor(
    @InjectRepository(OrderNotificationOrmEntity)
    private readonly repo: Repository<OrderNotificationOrmEntity>,
  ) {}

  async mark(orderId: string, tenantId: string, step: string, userId: string): Promise<void> {
    await this.repo.upsert(
      { orderId, tenantId, step, markedAt: new Date(), markedByUserId: userId },
      ['orderId', 'step'],
    );
  }

  async unmark(orderId: string, tenantId: string, step: string): Promise<void> {
    await this.repo.delete({ orderId, tenantId, step });
  }

  async findByOrderId(orderId: string, tenantId: string): Promise<OrderNotificationRecord[]> {
    const rows = await this.repo.find({ where: { orderId, tenantId } });
    return rows.map(r => ({ step: r.step, markedAt: r.markedAt, markedByUserId: r.markedByUserId }));
  }

  async findByOrderIds(orderIds: string[], tenantId: string): Promise<Record<string, OrderNotificationRecord[]>> {
    if (orderIds.length === 0) return {};
    const rows = await this.repo.find({ where: { orderId: In(orderIds), tenantId } });
    const result: Record<string, OrderNotificationRecord[]> = {};
    for (const r of rows) {
      if (!result[r.orderId]) result[r.orderId] = [];
      result[r.orderId].push({ step: r.step, markedAt: r.markedAt, markedByUserId: r.markedByUserId });
    }
    return result;
  }
}
