import { Contact } from '../entities/Contact';

export interface IContactRepository {
  save(contact: Contact): Promise<void>;
  findById(id: string, tenantId: string): Promise<Contact | null>;
  findByEmail(email: string, tenantId: string): Promise<Contact | null>;
  findByCompany(companyId: string, tenantId: string): Promise<Contact[]>;
  findAll(tenantId: string): Promise<Contact[]>;
}