import { Injectable, Inject } from '@nestjs/common';
import type { IDealRepository } from '../../domain/repositories/IDealRepository';

@Injectable()
export class GetDealsUseCase {
  constructor(
    @Inject('IDealRepository') private readonly dealRepo: IDealRepository,
  ) {}

  async execute(tenantId: string, limit?: number, offset?: number) {
    const deals = await this.dealRepo.findAll(tenantId, limit, offset);
    
    // Devolvemos la data lista para que el Frontend dibuje las tarjetas
    return deals.map(d => ({
      id: d.id.value,
      name: d.name,
      amount: d.amount,
      stage: d.stage,
      companyId: d.companyId ? d.companyId.value : null,
      contactId: d.contactId ? d.contactId.value : null,
      assignedUserId: d.assignedUserId.value,
      updatedAt: d.updatedAt,
    }));
  }
}