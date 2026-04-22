import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IDealRepository } from '../../domain/repositories/IDealRepository';
import type { IDealActivityRepository } from '../../domain/repositories/IDealActivityRepository';
import { DealActivity } from '../../domain/entities/DealActivity';
import type { DealStage } from '../../domain/entities/Deal';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class MoveDealStageUseCase {
  constructor(
    @Inject('IDealRepository') private readonly dealRepo: IDealRepository,
    @Inject('IDealActivityRepository') private readonly activityRepo: IDealActivityRepository,
  ) {}

  async execute(tenantId: string, userId: string, dealId: string, newStage: DealStage): Promise<void> {
    const deal = await this.dealRepo.findById(dealId, tenantId);
    if (!deal) throw new NotFoundException('Negocio no encontrado');

    const oldStage = deal.stage;
    deal.changeStage(newStage);

    // 🤖 ¡Magia automática! Al mover la tarjeta, dejamos registro en la bitácora
    const activity = DealActivity.create({
      tenantId: new TenantId(tenantId),
      dealId: new UniqueId(dealId),
      userId: new UniqueId(userId),
      type: 'CAMBIO_ESTADO',
      content: `El negocio se movió de ${oldStage} a ${newStage}`,
    });

    await this.dealRepo.save(deal);
    await this.activityRepo.save(activity);
  }
}