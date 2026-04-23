import { Deal } from '../entities/Deal';

export interface IDealRepository {
  save(deal: Deal): Promise<void>;
  findById(id: string, tenantId: string): Promise<Deal | null>;
  findAll(tenantId: string): Promise<Deal[]>;
  findByContact(contactId: string, tenantId: string): Promise<Deal[]>;
}