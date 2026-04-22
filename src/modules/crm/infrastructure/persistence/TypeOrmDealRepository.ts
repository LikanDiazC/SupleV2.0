import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IDealRepository } from '../../domain/repositories/IDealRepository';
import { Deal } from '../../domain/entities/Deal';
import { DealOrmEntity } from './orm-entities/DealOrmEntity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class TypeOrmDealRepository implements IDealRepository {
  constructor(
    @InjectRepository(DealOrmEntity)
    private readonly ormRepo: Repository<DealOrmEntity>,
  ) {}

  async save(deal: Deal): Promise<void> {
    const ormEntity = this.ormRepo.create({
      id: deal.id.value,
      tenantId: deal.tenantId.value,
      name: deal.name,
      amount: deal.amount,
      stage: deal.stage,
      companyId: deal.companyId ? deal.companyId.value : null,
      contactId: deal.contactId ? deal.contactId.value : null,
      assignedUserId: deal.assignedUserId.value,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
    });
    await this.ormRepo.save(ormEntity);
  }

  async findById(id: string, tenantId: string): Promise<Deal | null> {
    const orm = await this.ormRepo.findOne({ where: { id, tenantId } });
    if (!orm) return null;
    return this.mapToDomain(orm);
  }

  async findAll(tenantId: string): Promise<Deal[]> {
    const orms = await this.ormRepo.find({ where: { tenantId }, order: { updatedAt: 'DESC' } });
    return orms.map(orm => this.mapToDomain(orm));
  }

  private mapToDomain(orm: DealOrmEntity): Deal {
    return Deal.load({
      tenantId: new TenantId(orm.tenantId),
      name: orm.name,
      amount: Number(orm.amount),
      stage: orm.stage as any,
      companyId: orm.companyId ? new UniqueId(orm.companyId) : null,
      contactId: orm.contactId ? new UniqueId(orm.contactId) : null,
      assignedUserId: new UniqueId(orm.assignedUserId),
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    }, new UniqueId(orm.id));
  }
}