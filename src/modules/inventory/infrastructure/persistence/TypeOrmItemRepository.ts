import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IItemRepository } from '../../domain/repositories/IItemRepository';
import { Item } from '../../domain/entities/Item';
import { ItemOrmEntity } from './ItemOrmEntity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
// ⚠️ Nota: Verifica que la ruta al TenantId sea la correcta
import { TenantId } from '../../../iam/domain/value-objects/TenantId'

@Injectable()
export class TypeOrmItemRepository implements IItemRepository {
  constructor(
    @InjectRepository(ItemOrmEntity)
    private readonly ormRepository: Repository<ItemOrmEntity>,
  ) {}

  async save(item: Item): Promise<void> {
    // 1. Desarmamos el molde del Dominio para dárselo a TypeORM
    const ormEntity = this.ormRepository.create({
      id: item.id.value,
      tenantId: item.tenantId.value,
      name: item.name,
      sku: item.sku,
      type: item.type,
      unitOfMeasure: item.unitOfMeasure,
      stock: item.stock,
      unitCost: item.unitCost,
      price: item.price,
      attributes: item.attributes, // ¡Magia! TypeORM guardará este objeto como JSONB automáticamente
    });

    // 2. Lo guardamos en PostgreSQL
    await this.ormRepository.save(ormEntity);
  }

  async findAll(tenantId: string, type?: string): Promise<Item[]> {
    // Creamos la condición base: siempre filtrar por tenantId
    const whereCondition: any = { tenantId };

    if (type) {
      whereCondition.type = type;
    }

    // Buscamos en PostgreSQL
    const ormEntities = await this.ormRepository.find({
      where: whereCondition,
      order: { name: 'ASC' }, // Los devolvemos ordenados alfabéticamente
    });

    // Convertimos cada resultado de la DB al formato de nuestro Dominio
    return ormEntities.map((entity) => this.mapToDomain(entity));
  }

  // Añade este método debajo de findAll
  async findById(id: string, tenantId: string): Promise<Item | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { id: id, tenantId: tenantId },
    });

    if (!ormEntity) return null; // Si no existe o es de otra empresa, devolvemos null

    return this.mapToDomain(ormEntity);
  }

  // 👇 Aunque todavía no lo usamos, dejamos listo el traductor inverso para las futuras búsquedas
  private mapToDomain(ormEntity: ItemOrmEntity): Item {
    return Item.create({
      tenantId: new TenantId(ormEntity.tenantId),
      name: ormEntity.name,
      sku: ormEntity.sku,
      type: ormEntity.type,
      unitOfMeasure: ormEntity.unitOfMeasure,
      // 💡 Dato de Arquitecto: TypeORM devuelve las columnas 'decimal' como texto (strings) 
      // para no perder precisión. Por eso usamos Number() al regresarlo al Dominio.
      stock: Number(ormEntity.stock),
      unitCost: Number(ormEntity.unitCost),
      price: ormEntity.price ? Number(ormEntity.price) : undefined,
      attributes: ormEntity.attributes,
    }, new UniqueId(ormEntity.id));
  }
}