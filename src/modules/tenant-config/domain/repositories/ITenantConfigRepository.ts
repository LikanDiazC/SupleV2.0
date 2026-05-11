import { TenantConfig } from '../entities/TenantConfig';

export interface TenantConfigWithName {
  tenantId: string;
  tenantName: string;
  orderTypes: string[];
  orderStatuses: any[];
  extraFields: any[];
  notifSteps: any[];
}

export interface ITenantConfigRepository {
  findByTenantId(tenantId: string): Promise<TenantConfig | null>;
  findAll(): Promise<TenantConfigWithName[]>;
}
