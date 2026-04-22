import { User } from '../entities/User';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../value-objects/TenantId';

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: UniqueId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByTenantId(tenantId: TenantId): Promise<User[]>;
  findAll(tenantId?: string): Promise<User[]>;
}