import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IMaterialRepository } from '../../domain/repositories/IMaterialRepository';
import { Material, GrainDirection, MaterialType } from '../../domain/entities/Material';
import { MaterialOrmEntity } from '../persistence/MaterialOrmEntity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class TypeOrmMaterialRepository implements IMaterialRepository {
  constructor(
    @InjectRepository(MaterialOrmEntity)
    private readonly orm: Repository<MaterialOrmEntity>,
  ) {}

  async save(material: Material): Promise<void> {
    await this.orm.save(
      this.orm.create({
        id:               material.id.value,
        tenantId:         material.tenantId.value,
        name:             material.name,
        sku:              material.sku,
        materialType:     material.materialType,
        unitOfMeasure:    material.unitOfMeasure,
        unitCost:         material.unitCost,
        stock:            material.stock,
        sheetWidthMm:     material.sheetWidthMm,
        sheetHeightMm:    material.sheetHeightMm,
        thicknessMm:      material.thicknessMm,
        grainDirection:   material.grainDirection,
        kerfMm:           material.kerfMm,
        minRemnantAreaMm2: material.minRemnantAreaMm2,
      }),
    );
  }

  async findAll(tenantId: string, type?: string, limit = 200, offset = 0): Promise<Material[]> {
    const where: any = { tenantId };
    if (type) where.materialType = type;

    const rows = await this.orm.find({ where, order: { name: 'ASC' }, take: limit, skip: offset });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string, tenantId: string): Promise<Material | null> {
    const row = await this.orm.findOne({ where: { id, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(r: MaterialOrmEntity): Material {
    return Material.load(
      {
        tenantId:         new TenantId(r.tenantId),
        name:             r.name,
        sku:              r.sku,
        materialType:     r.materialType as MaterialType,
        unitOfMeasure:    r.unitOfMeasure,
        unitCost:         Number(r.unitCost),
        stock:            Number(r.stock),
        sheetWidthMm:     r.sheetWidthMm  ? Number(r.sheetWidthMm)  : undefined,
        sheetHeightMm:    r.sheetHeightMm ? Number(r.sheetHeightMm) : undefined,
        thicknessMm:      r.thicknessMm   ? Number(r.thicknessMm)   : undefined,
        grainDirection:   r.grainDirection as GrainDirection | undefined,
        kerfMm:           r.kerfMm           ? Number(r.kerfMm)           : 3.2,
        minRemnantAreaMm2: r.minRemnantAreaMm2 ?? 60000,
      },
      new UniqueId(r.id),
    );
  }
}
