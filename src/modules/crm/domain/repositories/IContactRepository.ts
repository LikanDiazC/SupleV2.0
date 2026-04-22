import { Contact } from '../entities/Contact';

export interface IContactRepository {
  save(contact: Contact): Promise<void>;
  // 👇 Buscamos por correo exacto, pero siempre dentro de nuestro tenantId
  findByEmail(email: string, tenantId: string): Promise<Contact | null>;
  findByCompany(companyId: string, tenantId: string): Promise<Contact[]>;
  findAll(tenantId: string): Promise<Contact[]>;
}