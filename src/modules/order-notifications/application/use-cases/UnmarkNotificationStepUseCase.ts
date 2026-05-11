import { Injectable, Inject } from '@nestjs/common';
import type { IOrderNotificationRepository } from '../../domain/repositories/IOrderNotificationRepository';

@Injectable()
export class UnmarkNotificationStepUseCase {
  constructor(
    @Inject('IOrderNotificationRepository')
    private readonly repo: IOrderNotificationRepository,
  ) {}

  async execute(orderId: string, tenantId: string, step: string): Promise<void> {
    await this.repo.unmark(orderId, tenantId, step);
  }
}
