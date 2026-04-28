import { Company } from '../entities/Company';

export interface ICompanyRepository {
  save(company: Company): Promise<void>;
  findById(id: string, tenantId: string): Promise<Company | null>;
  findByDomain(domain: string, tenantId: string): Promise<Company | null>;
  findAll(tenantId: string): Promise<Company[]>;
}