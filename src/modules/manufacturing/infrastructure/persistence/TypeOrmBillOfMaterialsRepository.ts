import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBillOfMaterialsRepository } from '../../domain/repositories/IBillOfMaterialsRepository';
import { BillOfMaterials } from '../../domain/entities/BillOfMaterials';
import { BillOfMaterialsOrmEntity } from './BillOfMaterialsOrmEntity';
import { UniqueId } from 'src/shared/kernel/UniqueId';
import { TenantId } from 'src/modules/iam/domain/value-objects/TenantId';

@Injectable()
export class TypeOrmBillOfMaterialsRepository implements IBillOfMaterialsRepository {
  constructor(
    @InjectRepository(BillOfMaterialsOrmEntity)
    private readonly ormRepository: Repository<BillOfMaterialsOrmEntity>,
  ) {}

  async save(bom: BillOfMaterials): Promise<void> {
    // Convertimos el molde de negocio a un formato que la DB entienda
    const ormEntity = this.ormRepository.create({
      id: bom.id.value,
      tenantId: bom.tenantId.value,
      productId: bom.productId.value,
      name: bom.name,
      // Mapeamos los componentes extrayendo el string del UniqueId
      components: bom.components.map(c => ({
        itemId: c.itemId.value,
        quantity: c.quantity,
      })),
      createdAt: bom.createdAt,
      updatedAt: bom.updatedAt,
    });
    

    await this.ormRepository.save(ormEntity);
  }
  // ... (debajo del método save)

  async findByProductId(productId: string, tenantId: string): Promise<BillOfMaterials | null> {
    const ormEntity = await this.ormRepository.findOne({
      where: { productId: productId, tenantId: tenantId },
    });

    if (!ormEntity) {
      return null;
    }

    // Usamos el molde del dominio para reconstruir la receta
    return BillOfMaterials.load({
      tenantId: new TenantId(ormEntity.tenantId),
      productId: new UniqueId(ormEntity.productId),
      name: ormEntity.name,
      components: ormEntity.components.map((c: any) => ({
        itemId: new UniqueId(c.itemId),
        quantity: c.quantity,
      })),
      createdAt: ormEntity.createdAt,
      updatedAt: ormEntity.updatedAt,
    }, new UniqueId(ormEntity.id));
  }
}
