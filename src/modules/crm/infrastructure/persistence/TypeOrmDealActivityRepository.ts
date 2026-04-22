import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IDealActivityRepository } from '../../domain/repositories/IDealActivityRepository';
import { DealActivity } from '../../domain/entities/DealActivity';
import { DealActivityOrmEntity } from './orm-entities/DealActivityOrmEntity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class TypeOrmDealActivityRepository implements IDealActivityRepository {
  constructor(
    @InjectRepository(DealActivityOrmEntity)
    private readonly ormRepo: Repository<DealActivityOrmEntity>,
  ) {}

  async save(activity: DealActivity): Promise<void> {
    const ormEntity = this.ormRepo.create({
      id: activity.id.value,
      tenantId: activity.tenantId.value,
      dealId: activity.dealId.value,
      userId: activity.userId.value,
      type: activity.type,
      content: activity.content,
      createdAt: activity.createdAt,
    });
    await this.ormRepo.save(ormEntity);
  }

  async findByDealId(dealId: string, tenantId: string): Promise<DealActivity[]> {
    const orms = await this.ormRepo.find({ 
      where: { dealId, tenantId },
      order: { createdAt: 'DESC' } // De lo más reciente a lo más antiguo
    });
    
    return orms.map(orm => DealActivity.load({
      tenantId: new TenantId(orm.tenantId),
      dealId: new UniqueId(orm.dealId),
      userId: new UniqueId(orm.userId),
      type: orm.type as any,
      content: orm.content,
      createdAt: orm.createdAt,
    }, new UniqueId(orm.id)));
  }
}