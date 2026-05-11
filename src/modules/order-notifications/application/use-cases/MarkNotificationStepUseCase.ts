import { Injectable, Inject } from '@nestjs/common';
import type { IOrderNotificationRepository } from '../../domain/repositories/IOrderNotificationRepository';

@Injectable()
export class MarkNotificationStepUseCase {
  constructor(
    @Inject('IOrderNotificationRepository')
    private readonly repo: IOrderNotificationRepository,
  ) {}

  async execute(orderId: string, tenantId: string, step: string, userId: string): Promise<void> {
    await this.repo.mark(orderId, tenantId, step, userId);
  }
}
