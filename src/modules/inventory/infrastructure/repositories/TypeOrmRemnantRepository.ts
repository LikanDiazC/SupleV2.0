import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IRemnantRepository } from '../../domain/repositories/IRemnantRepository';
import { Remnant } from '../../domain/entities/Remnant';
import { RemnantOrmEntity } from '../persistence/RemnantOrmEntity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class TypeOrmRemnantRepository implements IRemnantRepository {
  constructor(
    @InjectRepository(RemnantOrmEntity)
    private readonly orm: Repository<RemnantOrmEntity>,
  ) {}

  async save(remnant: Remnant): Promise<void> {
    await this.orm.save(
      this.orm.create({
        id:            remnant.id.value,
        tenantId:      remnant.tenantId.value,
        materialId:    remnant.materialId.value,
        widthMm:       remnant.widthMm,
        heightMm:      remnant.heightMm,
        stock:         remnant.stock,
        sourceOrderId: remnant.sourceOrderId.value,
        createdAt:     remnant.createdAt,
      }),
    );
  }

  async findAll(tenantId: string): Promise<Remnant[]> {
    const rows = await this.orm.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async findByMaterialId(materialId: string, tenantId: string): Promise<Remnant[]> {
    const rows = await this.orm.find({ where: { materialId, tenantId } });
    return rows.map((r) => this.toDomain(r));
  }

  async findByDimensions(
    materialId: string,
    widthMm: number,
    heightMm: number,
    tenantId: string,
  ): Promise<Remnant | null> {
    const row = await this.orm.findOne({ where: { materialId, widthMm, heightMm, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(r: RemnantOrmEntity): Remnant {
    return Remnant.load(
      {
        tenantId:      new TenantId(r.tenantId),
        materialId:    new UniqueId(r.materialId),
        widthMm:       Number(r.widthMm),
        heightMm:      Number(r.heightMm),
        stock:         Number(r.stock),
        sourceOrderId: new UniqueId(r.sourceOrderId),
        createdAt:     r.createdAt,
      },
      new UniqueId(r.id),
    );
  }
}
