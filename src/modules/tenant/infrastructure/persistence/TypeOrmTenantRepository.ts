import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import { Tenant } from '../../domain/entities/Tenant';
import { TenantOrmEntity } from './TenantOrmEntity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';

@Injectable()
export class TypeOrmTenantRepository implements ITenantRepository {
  constructor(
    @InjectRepository(TenantOrmEntity)
    private readonly ormRepository: Repository<TenantOrmEntity>,
  ) {}

  async save(tenant: Tenant): Promise<void> {
    const ormEntity = this.ormRepository.create({
      id: tenant.id.value,
      name: tenant.name,
      isActive: tenant.isActive,
    });
    await this.ormRepository.save(ormEntity);
  }
}