import { Injectable, Inject } from '@nestjs/common';
import type { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';

@Injectable()
export class GetCompaniesUseCase {
  constructor(
    @Inject('ICompanyRepository')
    private readonly companyRepository: ICompanyRepository,
  ) {}

  async execute(tenantId: string) {
    const companies = await this.companyRepository.findAll(tenantId);
    
    // Mapeamos a un JSON limpio y fácil de leer para el Frontend
    return companies.map(c => ({
      id: c.id.value,
      name: c.name,
      domain: c.domain
    }));
  }
}