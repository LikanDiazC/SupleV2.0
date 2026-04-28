import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IDealRepository } from '../../domain/repositories/IDealRepository';
import type { IDealActivityRepository } from '../../domain/repositories/IDealActivityRepository';
import { Deal } from '../../domain/entities/Deal';
import { DealActivity } from '../../domain/entities/DealActivity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

// 👇 NUEVO DTO
export class CreateDealItemDto {
  bomId!:    string;
  quantity!: number;
}

export class CreateDealDto {
  name!: string;
  amount!: number;
  companyId?: string;
  contactId?: string;
  items?: CreateDealItemDto[]; // 👈 Puede venir con o sin carrito
}

@Injectable()
export class CreateDealUseCase {
  constructor(
    @Inject('IDealRepository') private readonly dealRepo: IDealRepository,
    @Inject('IDealActivityRepository') private readonly activityRepo: IDealActivityRepository,
  ) {}

  async execute(tenantId: string, userId: string, dto: CreateDealDto): Promise<string> {
    try {
      const deal = Deal.create({
        tenantId: new TenantId(tenantId),
        name: dto.name,
        amount: dto.amount,
        companyId: dto.companyId ? new UniqueId(dto.companyId) : null,
        contactId: dto.contactId ? new UniqueId(dto.contactId) : null,
        assignedUserId: new UniqueId(userId),
        // 👇 Mapeamos el carrito si lo enviaron
        items: dto.items ? dto.items.map(i => ({
          bomId:    new UniqueId(i.bomId),
          quantity: i.quantity,
        })) : [],
      });

      const initialActivity = DealActivity.create({
        tenantId: new TenantId(tenantId),
        dealId: deal.id,
        userId: new UniqueId(userId),
        type: 'SISTEMA',
        content: `Negocio creado y asignado. Monto inicial: $${dto.amount}`,
      });

      await this.dealRepo.save(deal);
      await this.activityRepo.save(initialActivity);

      return deal.id.value;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}