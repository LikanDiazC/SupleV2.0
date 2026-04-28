import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';
import { Order } from '../../domain/entities/Order';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';
import { CheckOrderStockUseCase } from './CheckOrderStockUseCase';

export class ExternalOrderItemDto {
  productId!: string;
  quantity!: number;
}

export class ExternalOrderDto {
  externalReference!: string;
  customerName!: string;
  items!: ExternalOrderItemDto[];
}

@Injectable()
export class ReceiveExternalOrderUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    private readonly checkStockUseCase: CheckOrderStockUseCase,
  ) {}

  async execute(tenantId: string, dto: ExternalOrderDto): Promise<{ id: string; status: string }> {
    try {
      const order = Order.create({
        tenantId: new TenantId(tenantId),
        externalReference: dto.externalReference,
        customerName: dto.customerName,
        items: dto.items.map((i) => ({
          productId: new UniqueId(i.productId),
          quantity:  i.quantity,
        })),
      });

      await this.orderRepository.save(order);

      // Disparar verificación de stock automáticamente
      const finalStatus = await this.checkStockUseCase.execute(tenantId, order.id.value);

      return { id: order.id.value, status: finalStatus };
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
