import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IDealRepository } from '../../domain/repositories/IDealRepository';
import type { IDealActivityRepository } from '../../domain/repositories/IDealActivityRepository';
import type { IOrderRepository } from '../../../orders/domain/repositories/IOrderRepository';
import type { IBillOfMaterialsRepository } from '../../../manufacturing/domain/repositories/IBillOfMaterialsRepository';
import type { IContactRepository } from '../../domain/repositories/IContactRepository';
import type { ICompanyRepository } from '../../domain/repositories/ICompanyRepository';
import type { ITenantConfigRepository } from '../../../tenant-config/domain/repositories/ITenantConfigRepository';
import { CheckOrderStockUseCase } from '../../../orders/application/use-cases/CheckOrderStockUseCase';
import { OrderStatusAutoNotifier } from '../../../orders/application/services/OrderStatusAutoNotifier';
import { Order } from '../../../orders/domain/entities/Order';
import { DealActivity } from '../../domain/entities/DealActivity';
import type { DealStage } from '../../domain/entities/Deal';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class MoveDealStageUseCase {
  constructor(
    @Inject('IDealRepository')             private readonly dealRepo: IDealRepository,
    @Inject('IDealActivityRepository')     private readonly activityRepo: IDealActivityRepository,
    @Inject('IOrderRepository')            private readonly orderRepo: IOrderRepository,
    @Inject('IBillOfMaterialsRepository')  private readonly bomRepo: IBillOfMaterialsRepository,
    @Inject('IContactRepository')          private readonly contactRepo: IContactRepository,
    @Inject('ICompanyRepository')          private readonly companyRepo: ICompanyRepository,
    @Inject('ITenantConfigRepository')     private readonly configRepo: ITenantConfigRepository,
    private readonly checkStockUseCase: CheckOrderStockUseCase,
    private readonly autoNotifier: OrderStatusAutoNotifier,
  ) {}

  async execute(tenantId: string, userId: string, dealId: string, newStage: DealStage): Promise<void> {
    const deal = await this.dealRepo.findById(dealId, tenantId);
    if (!deal) throw new NotFoundException('Negocio no encontrado');

    const oldStage   = deal.stage;
    const isJustWon  = newStage === 'GANADO' && oldStage !== 'GANADO';

    deal.changeStage(newStage);

    const activity = DealActivity.create({
      tenantId: new TenantId(tenantId),
      dealId:   new UniqueId(dealId),
      userId:   new UniqueId(userId),
      type:     'CAMBIO_ESTADO',
      content:  `El negocio se movió de ${oldStage} a ${newStage}`,
    });

    await this.dealRepo.save(deal);
    await this.activityRepo.save(activity);

    if (isJustWon && deal.items.length > 0) {
      const orderItems: { productId: UniqueId; quantity: number }[] = [];

      for (const item of deal.items) {
        const bom = await this.bomRepo.findById(item.bomId.value, tenantId);
        if (bom) {
          orderItems.push({ productId: bom.productId, quantity: item.quantity });
        }
      }

      if (orderItems.length === 0) return;

      let customerName = deal.name;
      if (deal.contactId) {
        const contact = await this.contactRepo.findById(deal.contactId.value, tenantId);
        if (contact) {
          customerName = contact.name;
          if (deal.companyId) {
            const company = await this.companyRepo.findById(deal.companyId.value, tenantId);
            if (company) customerName = `${contact.name} — ${company.name}`;
          }
        }
      }

      const order = Order.create({
        tenantId:          new TenantId(tenantId),
        externalReference: `DEAL-${dealId.substring(0, 8).toUpperCase()}`,
        customerName,
        items:             orderItems,
      });

      (order as any).orderType = (deal as any).dealType ?? null;

      await this.orderRepo.save(order);

      await this.autoNotifier.markFor(tenantId, order.id.value, 'ORDER_RECEIVED', userId);

      const config = await this.configRepo.findByTenantId(tenantId);
      const requireDesign = config?.requireDesignConfirmation ?? false;

      if (requireDesign) {
        await this.activityRepo.save(
          DealActivity.create({
            tenantId: new TenantId(tenantId),
            dealId:   new UniqueId(dealId),
            userId:   new UniqueId(userId),
            type:     'SISTEMA',
            content:  `🎉 ¡Venta ganada! Orden ${order.externalReference} generada. Pendiente de confirmación de diseño.`,
          }),
        );
        return;
      }

      const finalStatus = await this.checkStockUseCase.execute(tenantId, order.id.value);

      const statusMsg =
        finalStatus === 'READY_TO_START'
          ? '✅ Stock verificado. Lista para iniciar producción.'
          : '⚠️ Stock insuficiente. Se requiere confirmación de compra.';

      await this.activityRepo.save(
        DealActivity.create({
          tenantId: new TenantId(tenantId),
          dealId:   new UniqueId(dealId),
          userId:   new UniqueId(userId),
          type:     'SISTEMA',
          content:  `🎉 ¡Venta ganada! Orden ${order.externalReference} generada. ${statusMsg}`,
        }),
      );
    }
  }
}
