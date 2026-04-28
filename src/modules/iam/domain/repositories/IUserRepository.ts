import { User } from '../entities/User';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../value-objects/TenantId';

export interface GoogleTokens {
  access_token?: string | null;
  refresh_token?: string | null;
  expiry_date?: number | null;
}

export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: UniqueId): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByTenantId(tenantId: TenantId): Promise<User[]>;
  findAll(tenantId?: string): Promise<User[]>;
  saveGoogleTokens(userId: string, tokens: GoogleTokens): Promise<void>;
  getGoogleTokens(userId: string): Promise<GoogleTokens | null>;
  hasGoogleLinked(userId: string): Promise<boolean>;
  changePassword(userId: string, newHash: string): Promise<void>;
}