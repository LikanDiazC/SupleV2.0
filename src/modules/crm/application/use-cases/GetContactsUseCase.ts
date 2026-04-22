import { Injectable, Inject } from '@nestjs/common';
import type { IContactRepository } from '../../domain/repositories/IContactRepository';

@Injectable()
export class GetContactsUseCase {
  constructor(
    @Inject('IContactRepository') 
    private readonly contactRepository: IContactRepository,
  ) {}

  async execute(tenantId: string) {
    const contacts = await this.contactRepository.findAll(tenantId);
    
    // JSON limpio para el Frontend
    return contacts.map(c => ({
      id: c.id.value,
      name: c.name,
      email: c.email,
      companyId: c.companyId ? c.companyId.value : null
    }));
  }
}