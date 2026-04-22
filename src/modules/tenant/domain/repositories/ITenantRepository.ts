import { Tenant } from '../entities/Tenant';

export interface ITenantRepository {
  save(tenant: Tenant): Promise<void>;
}