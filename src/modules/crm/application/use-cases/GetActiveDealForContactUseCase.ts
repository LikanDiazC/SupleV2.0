import { Injectable, Inject } from '@nestjs/common';
import type { IDealRepository } from '../../domain/repositories/IDealRepository';

@Injectable()
export class GetActiveDealForContactUseCase {
  constructor(
    @Inject('IDealRepository') private readonly dealRepo: IDealRepository,
  ) {}

  async execute(tenantId: string, contactId: string) {
    const deals = await this.dealRepo.findByContact(contactId, tenantId);

    // Buscamos el primer negocio que ESTÉ VIVO (Que no esté ganado ni perdido)
    const activeDeal = deals.find(d => d.stage !== 'GANADO' && d.stage !== 'PERDIDO');

    return activeDeal ? { id: activeDeal.id.value, name: activeDeal.name } : null;
  }
}