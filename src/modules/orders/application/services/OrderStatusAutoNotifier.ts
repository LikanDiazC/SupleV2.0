import { Injectable, Inject, Logger } from '@nestjs/common';
import type { ITenantConfigRepository } from '../../../tenant-config/domain/repositories/ITenantConfigRepository';
import { MarkNotificationStepUseCase } from '../../../order-notifications/application/use-cases/MarkNotificationStepUseCase';

@Injectable()
export class OrderStatusAutoNotifier {
  private readonly logger = new Logger(OrderStatusAutoNotifier.name);

  constructor(
    @Inject('ITenantConfigRepository')
    private readonly configRepo: ITenantConfigRepository,
    private readonly markNotif: MarkNotificationStepUseCase,
  ) {}

  async markFor(tenantId: string, orderId: string, status: string, userId: string): Promise<void> {
    const config = await this.configRepo.findByTenantId(tenantId);
    const steps = config?.notifAutoTriggers?.[status];
    if (!steps?.length) return;

    for (const step of steps) {
      try {
        await this.markNotif.execute(orderId, tenantId, step, userId);
      } catch (e: any) {
        this.logger.warn(`Auto-notif "${step}" falló para orden ${orderId}: ${e.message}`);
      }
    }
  }
}
