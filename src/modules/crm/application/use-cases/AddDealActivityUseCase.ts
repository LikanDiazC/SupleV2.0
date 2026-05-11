import { Injectable, Inject } from '@nestjs/common';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import type { IDealActivityRepository } from '../../domain/repositories/IDealActivityRepository';
import { DealActivity } from '../../domain/entities/DealActivity';
import type { ActivityType } from '../../domain/entities/DealActivity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export class CreateActivityDto {
  @IsString() @IsNotEmpty()
  content!: string;

  @IsOptional() @IsString()
  type?: ActivityType;
}

@Injectable()
export class AddDealActivityUseCase {
  constructor(
    @Inject('IDealActivityRepository') private readonly activityRepo: IDealActivityRepository,
  ) {}

  async execute(tenantId: string, userId: string, dealId: string, dto: CreateActivityDto): Promise<void> {
    const activity = DealActivity.create({
      tenantId: new TenantId(tenantId),
      dealId: new UniqueId(dealId),
      userId: new UniqueId(userId),
      type: dto.type ?? 'NOTA_MANUAL',
      content: dto.content,
    });

    await this.activityRepo.save(activity);
  }
}