import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { Order } from '../../domain/entities/Order';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export class ExternalOrderItemDto {
  productId!: string;
  quantity!: number;
}

export class ExternalOrderDto {
  externalReference!: string; // El ID que viene de Shopify/Falabella
  customerName!: string;
  items!: ExternalOrderItemDto[];
}

@Injectable()
export class ReceiveExternalOrderUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
  ) {}

  async execute(tenantId: string, dto: ExternalOrderDto): Promise<void> {
    try {
      const order = Order.create({
        tenantId: new TenantId(tenantId),
        externalReference: dto.externalReference,
        customerName: dto.customerName,
        items: dto.items.map(i => ({
          productId: new UniqueId(i.productId),
          quantity: i.quantity,
        })),
      });

      await this.orderRepository.save(order);
      
      // TODO: Aquí dispararemos el siguiente nodo del BPMS (Revisión de Stock)
      
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}