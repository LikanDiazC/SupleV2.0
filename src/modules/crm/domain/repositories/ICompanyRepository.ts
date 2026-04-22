import { Company } from '../entities/Company';

export interface ICompanyRepository {
  save(company: Company): Promise<void>;
  // 👇 Fíjate cómo siempre pedimos el tenantId para no mezclar clientes de otras empresas
  findByDomain(domain: string, tenantId: string): Promise<Company | null>;
  findAll(tenantId: string): Promise<Company[]>;
}