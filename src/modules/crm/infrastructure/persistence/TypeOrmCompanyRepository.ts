import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyOrmEntity } from './orm-entities/CompanyOrmEntity';
import { Company } from '../../domain/entities/Company';
import type { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class TypeOrmCompanyRepository implements ICompanyRepository {
  constructor(
    @InjectRepository(CompanyOrmEntity)
    private readonly ormRepo: Repository<CompanyOrmEntity>,
  ) {}

  async save(company: Company): Promise<void> {
    const ormEntity = this.ormRepo.create({
      id: company.id.value,
      tenantId: company.tenantId.value,
      domain: company.domain,
      name: company.name,
      createdAt: company['createdAt'] || new Date(),
    });
    await this.ormRepo.save(ormEntity);
  }

  async findById(id: string, tenantId: string): Promise<Company | null> {
    const orm = await this.ormRepo.findOne({ where: { id, tenantId } });
    if (!orm) return null;
    return Company.create({
      tenantId: new TenantId(orm.tenantId),
      domain: orm.domain,
      name: orm.name,
    }, new UniqueId(orm.id));
  }

  async findByDomain(domain: string, tenantId: string): Promise<Company | null> {
    const ormEntity = await this.ormRepo.findOne({ where: { domain, tenantId } });
    if (!ormEntity) return null;

    return Company.create({
      tenantId: new TenantId(ormEntity.tenantId),
      domain: ormEntity.domain,
      name: ormEntity.name,
    }, new UniqueId(ormEntity.id));
  }

  async findAll(tenantId: string): Promise<Company[]> {
    const ormEntities = await this.ormRepo.find({ where: { tenantId } });
    return ormEntities.map(orm => Company.create({
      tenantId: new TenantId(orm.tenantId),
      domain: orm.domain,
      name: orm.name,
    }, new UniqueId(orm.id)));
  }
}