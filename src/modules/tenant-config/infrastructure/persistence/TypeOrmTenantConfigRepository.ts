import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantConfigOrmEntity } from './TenantConfigOrmEntity';
import { ITenantConfigRepository } from '../../domain/repositories/ITenantConfigRepository';
import { TenantConfig } from '../../domain/entities/TenantConfig';

@Injectable()
export class TypeOrmTenantConfigRepository implements ITenantConfigRepository {
  constructor(
    @InjectRepository(TenantConfigOrmEntity)
    private readonly repo: Repository<TenantConfigOrmEntity>,
  ) {}

  async findByTenantId(tenantId: string): Promise<TenantConfig | null> {
    const row = await this.repo.findOne({ where: { tenantId } });
    if (!row) return null;
    return new TenantConfig(
      row.tenantId,
      row.orderTypes,
      row.orderStatuses,
      row.extraFields,
      row.notifSteps,
    );
  }
}
