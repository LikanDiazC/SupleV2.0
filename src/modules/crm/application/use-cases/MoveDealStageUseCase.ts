import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IDealRepository } from '../../domain/repositories/IDealRepository';
import type { IDealActivityRepository } from '../../domain/repositories/IDealActivityRepository';
// 👇 Importamos el contrato de Órdenes y el Molde de Orden
import type { IOrderRepository } from '../../../orders/domain/repositories/IOrderRepository'; 
import { Order } from '../../../orders/domain/entities/Order'; 

import { DealActivity } from '../../domain/entities/DealActivity';
import type { DealStage } from '../../domain/entities/Deal';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class MoveDealStageUseCase {
  constructor(
    @Inject('IDealRepository') private readonly dealRepo: IDealRepository,
    @Inject('IDealActivityRepository') private readonly activityRepo: IDealActivityRepository,
    // 👇 Inyectamos al Gerente de Órdenes
    @Inject('IOrderRepository') private readonly orderRepo: IOrderRepository, 
  ) {}

  async execute(tenantId: string, userId: string, dealId: string, newStage: DealStage): Promise<void> {
    const deal = await this.dealRepo.findById(dealId, tenantId);
    if (!deal) throw new NotFoundException('Negocio no encontrado');

    const oldStage = deal.stage;
    
    // 👇 Verificamos si acaba de ganar el negocio en este movimiento exacto
    const isJustWon = newStage === 'GANADO' && oldStage !== 'GANADO';

    deal.changeStage(newStage);

    // 1. Registramos el movimiento en la bitácora
    const activity = DealActivity.create({
      tenantId: new TenantId(tenantId),
      dealId: new UniqueId(dealId),
      userId: new UniqueId(userId),
      type: 'CAMBIO_ESTADO',
      content: `El negocio se movió de ${oldStage} a ${newStage}`,
    });

    await this.dealRepo.save(deal);
    await this.activityRepo.save(activity);

    // 🚀 2. EL GATILLO AUTOMÁTICO HACIA PRODUCCIÓN
    // Si ganamos el trato y tiene productos en el carrito...
    if (isJustWon && deal.items.length > 0) {
      
      // Creamos la Orden de Producción automáticamente
      const order = Order.create({
        tenantId: new TenantId(tenantId),
        externalReference: `DEAL-${dealId.substring(0, 8).toUpperCase()}`, // Ej: DEAL-8B3B90D0
        customerName: deal.name, // Usamos el nombre del trato como referencia
        items: deal.items.map(item => ({
          productId: item.productId, // Pasamos los IDs tal cual
          quantity: item.quantity
        }))
      });

      // Le decimos al módulo de órdenes que guarde su nueva tarea
      await this.orderRepo.save(order);

      // 3. Dejamos un mensajito extra en la bitácora del CRM para el vendedor
      const autoActivity = DealActivity.create({
        tenantId: new TenantId(tenantId),
        dealId: new UniqueId(dealId),
        userId: new UniqueId(userId),
        type: 'SISTEMA',
        content: `🎉 ¡Venta ganada! Orden de producción ${order.externalReference} generada y enviada a la fábrica.`,
      });
      await this.activityRepo.save(autoActivity);
    }
  }
}