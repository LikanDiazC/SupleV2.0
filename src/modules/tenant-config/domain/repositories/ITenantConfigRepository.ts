import { TenantConfig } from '../entities/TenantConfig';

export interface ITenantConfigRepository {
  findByTenantId(tenantId: string): Promise<TenantConfig | null>;
}
