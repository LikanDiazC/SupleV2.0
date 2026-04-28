import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IBomComponentRepository } from '../../domain/repositories/IBomComponentRepository';
import { BomComponent, GrainRequirement } from '../../domain/entities/BomComponent';
import { BomComponentOrmEntity } from './BomComponentOrmEntity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class TypeOrmBomComponentRepository implements IBomComponentRepository {
  constructor(
    @InjectRepository(BomComponentOrmEntity)
    private readonly orm: Repository<BomComponentOrmEntity>,
  ) {}

  async save(component: BomComponent): Promise<void> {
    await this.orm.save(this.orm.create(this.toOrm(component)));
  }

  async saveMany(components: BomComponent[]): Promise<void> {
    await this.orm.save(components.map((c) => this.orm.create(this.toOrm(c))));
  }

  async findByBomId(bomId: string, tenantId: string): Promise<BomComponent[]> {
    const rows = await this.orm.find({ where: { bomId, tenantId } });
    return rows.map((r) => this.toDomain(r));
  }

  private toOrm(c: BomComponent) {
    return {
      id:               c.id.value,
      tenantId:         c.tenantId.value,
      bomId:            c.bomId.value,
      materialId:       c.materialId.value,
      quantity:         c.quantity,
      pieceWidthMm:     c.pieceWidthMm,
      pieceHeightMm:    c.pieceHeightMm,
      grainRequirement: c.grainRequirement,
      pieceLabel:       c.pieceLabel,
    };
  }

  private toDomain(r: BomComponentOrmEntity): BomComponent {
    return BomComponent.load(
      {
        tenantId:         new TenantId(r.tenantId),
        bomId:            new UniqueId(r.bomId),
        materialId:       new UniqueId(r.materialId),
        quantity:         Number(r.quantity),
        pieceWidthMm:     r.pieceWidthMm  ? Number(r.pieceWidthMm)  : undefined,
        pieceHeightMm:    r.pieceHeightMm ? Number(r.pieceHeightMm) : undefined,
        grainRequirement: (r.grainRequirement ?? 'ANY') as GrainRequirement,
        pieceLabel:       r.pieceLabel,
      },
      new UniqueId(r.id),
    );
  }
}
