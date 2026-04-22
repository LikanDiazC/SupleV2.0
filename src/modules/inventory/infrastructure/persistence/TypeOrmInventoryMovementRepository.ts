import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IInventoryMovementRepository } from '../../domain/repositories/IInventoryMovementRepository';
import { InventoryMovement } from '../../domain/entities/InventoryMovement';
import { InventoryMovementOrmEntity } from './InventoryMovementOrmEntity';
import { UniqueId } from 'src/shared/kernel/UniqueId';
import { TenantId } from 'src/modules/iam/domain/value-objects/TenantId';

@Injectable()
export class TypeOrmInventoryMovementRepository implements IInventoryMovementRepository {
  constructor(
    @InjectRepository(InventoryMovementOrmEntity)
    private readonly ormRepository: Repository<InventoryMovementOrmEntity>,
  ) {}

  async save(movement: InventoryMovement): Promise<void> {
    // Traducimos del molde del Dominio a la Entidad de la Base de Datos
    const ormEntity = this.ormRepository.create({
      id: movement.id.value,
      tenantId: movement.tenantId.value,
      itemId: movement.itemId.value,
      userId: movement.userId.value,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      createdAt: movement.createdAt,
    });

    // Guardamos en PostgreSQL
    await this.ormRepository.save(ormEntity);
  }
  async findByItemId(itemId: string, tenantId: string): Promise<InventoryMovement[]> {
    const ormEntities = await this.ormRepository.find({
      where: { itemId: itemId, tenantId: tenantId },
      order: { createdAt: 'DESC' }, // Ordenados del más reciente al más antiguo
    });

    return ormEntities.map(orm => InventoryMovement.load({
      tenantId: new TenantId(orm.tenantId),
      itemId: new UniqueId(orm.itemId),
      userId: new UniqueId(orm.userId),
      type: orm.type as 'IN' | 'OUT',
      quantity: Number(orm.quantity),
      reason: orm.reason,
      createdAt: orm.createdAt,
    }, new UniqueId(orm.id)));
  }
}