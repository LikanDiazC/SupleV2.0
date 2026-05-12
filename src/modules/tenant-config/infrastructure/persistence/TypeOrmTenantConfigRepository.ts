import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantConfigOrmEntity } from './TenantConfigOrmEntity';
import type { ITenantConfigRepository, TenantConfigWithName } from '../../domain/repositories/ITenantConfigRepository';
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
      row.requireDesignConfirmation ?? false,
      row.notifAutoTriggers ?? {},
    );
  }

  async findAll(): Promise<TenantConfigWithName[]> {
    const rows: any[] = await this.repo.query(`
      SELECT
        t.id            AS "tenantId",
        t.name          AS "tenantName",
        COALESCE(tc."orderTypes",    '[]'::jsonb) AS "orderTypes",
        COALESCE(tc."orderStatuses", '[]'::jsonb) AS "orderStatuses",
        COALESCE(tc."extraFields",   '[]'::jsonb) AS "extraFields",
        COALESCE(tc."notifSteps",    '[]'::jsonb) AS "notifSteps",
        COALESCE(tc."requireDesignConfirmation", false) AS "requireDesignConfirmation",
        COALESCE(tc."notifAutoTriggers", '{}'::jsonb) AS "notifAutoTriggers"
      FROM tenants t
      LEFT JOIN tenant_config tc ON tc."tenantId" = t.id
      ORDER BY t.name
    `);
    return rows;
  }
}
