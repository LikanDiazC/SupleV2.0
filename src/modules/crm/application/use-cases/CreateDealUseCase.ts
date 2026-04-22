import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IDealRepository } from '../../domain/repositories/IDealRepository';
import type { IDealActivityRepository } from '../../domain/repositories/IDealActivityRepository';
import { Deal } from '../../domain/entities/Deal';
import { DealActivity } from '../../domain/entities/DealActivity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export class CreateDealDto {
  name!: string;
  amount!: number;
  companyId?: string;
  contactId?: string;
}

@Injectable()
export class CreateDealUseCase {
  constructor(
    @Inject('IDealRepository') private readonly dealRepo: IDealRepository,
    @Inject('IDealActivityRepository') private readonly activityRepo: IDealActivityRepository,
  ) {}

  async execute(tenantId: string, userId: string, dto: CreateDealDto): Promise<string> {
    try {
      // 1. Creamos la carpeta del negocio (Nace en estado NUEVO)
      const deal = Deal.create({
        tenantId: new TenantId(tenantId),
        name: dto.name,
        amount: dto.amount,
        companyId: dto.companyId ? new UniqueId(dto.companyId) : null,
        contactId: dto.contactId ? new UniqueId(dto.contactId) : null,
        assignedUserId: new UniqueId(userId), // Se asigna automáticamente al que lo crea
      });

      // 2. Creamos la primera actividad (El registro de que alguien lo creó)
      const initialActivity = DealActivity.create({
        tenantId: new TenantId(tenantId),
        dealId: deal.id,
        userId: new UniqueId(userId),
        type: 'SISTEMA',
        content: `Negocio creado y asignado. Monto inicial: $${dto.amount}`,
      });

      // 3. Guardamos ambos en la base de datos
      await this.dealRepo.save(deal);
      await this.activityRepo.save(initialActivity);

      return deal.id.value;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}