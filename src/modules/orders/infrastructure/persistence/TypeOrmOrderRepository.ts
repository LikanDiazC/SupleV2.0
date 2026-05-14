import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IOrderRepository, OrderFields } from '../../domain/repositories/IOrderRepository';
import { Order } from '../../domain/entities/Order';
import { OrderOrmEntity } from './OrderOrmEntity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class TypeOrmOrderRepository implements IOrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly ormRepository: Repository<OrderOrmEntity>,
  ) {}

  async save(order: Order): Promise<void> {
    const ormEntity = this.ormRepository.create({
      id: order.id.value,
      tenantId: order.tenantId.value,
      externalReference: order.externalReference,
      customerName: order.customerName,
      status: order.status,
      orderType: (order as any).orderType ?? null,
      items: order.items.map(i => ({
        productId: i.productId.value,
        quantity: i.quantity,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    });

    await this.ormRepository.save(ormEntity);
  }

  async findById(id: string, tenantId: string): Promise<Order | null> {
    const orm = await this.ormRepository.findOne({ where: { id, tenantId } });
    if (!orm) return null;

    const order = Order.load({
      tenantId: new TenantId(orm.tenantId),
      externalReference: orm.externalReference,
      customerName: orm.customerName,
      status: orm.status as any,
      items: orm.items.map((i: any) => ({
        productId: new UniqueId(i.productId),
        quantity: i.quantity,
      })),
      createdAt: orm.createdAt,
      updatedAt: orm.updatedAt,
    }, new UniqueId(orm.id));

    Object.assign(order, {
      orderType:       orm.orderType,
      description:     orm.description,
      fechaConfeccion: orm.fechaConfeccion,
      fechaEntrega:    orm.fechaEntrega,
      horario:         orm.horario,
      comuna:          orm.comuna,
      color:           orm.color,
      mesVenta:        orm.mesVenta,
      extraData:       orm.extraData,
    });

    return order;
  }

  async findAll(tenantId: string, limit = 200, offset = 0): Promise<Order[]> {
    const ormEntities = await this.ormRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    return ormEntities.map(orm => {
      const order = Order.load({
        tenantId: new TenantId(orm.tenantId),
        externalReference: orm.externalReference,
        customerName: orm.customerName,
        status: orm.status as any,
        items: orm.items.map((i: any) => ({
          productId: new UniqueId(i.productId),
          quantity: i.quantity,
        })),
        createdAt: orm.createdAt,
        updatedAt: orm.updatedAt,
      }, new UniqueId(orm.id));

      // Attach extra fields for projection in use cases
      Object.assign(order, {
        orderType:       orm.orderType,
        description:     orm.description,
        fechaConfeccion: orm.fechaConfeccion,
        fechaEntrega:    orm.fechaEntrega,
        horario:         orm.horario,
        comuna:          orm.comuna,
        color:           orm.color,
        mesVenta:        orm.mesVenta,
        extraData:       orm.extraData,
      });

      return order;
    });
  }

  async updateStatus(id: string, tenantId: string, status: string): Promise<void> {
    await this.ormRepository.update({ id, tenantId }, { status });
  }

  async updateFields(id: string, tenantId: string, fields: OrderFields): Promise<void> {
    const update: Partial<OrderOrmEntity> = {};
    if ('orderType'       in fields) update.orderType       = fields.orderType       ?? null;
    if ('description'     in fields) update.description     = fields.description     ?? null;
    if ('fechaConfeccion' in fields) update.fechaConfeccion = fields.fechaConfeccion ?? null;
    if ('fechaEntrega'    in fields) update.fechaEntrega    = fields.fechaEntrega    ?? null;
    if ('horario'         in fields) update.horario         = fields.horario         ?? null;
    if ('comuna'          in fields) update.comuna          = fields.comuna          ?? null;
    if ('color'           in fields) update.color           = fields.color           ?? null;
    if ('mesVenta'        in fields) update.mesVenta        = fields.mesVenta        ?? null;
    if ('extraData'       in fields) update.extraData       = fields.extraData       ?? null;
    if (Object.keys(update).length > 0) {
      await this.ormRepository.update({ id, tenantId }, update as any);
    }
  }
}
