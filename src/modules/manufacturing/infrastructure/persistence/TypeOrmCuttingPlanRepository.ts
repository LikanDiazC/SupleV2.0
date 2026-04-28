import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ICuttingPlanRepository } from '../../domain/repositories/ICuttingPlanRepository';
import { CuttingPlan, SheetLayout, RemnantResult } from '../../domain/entities/CuttingPlan';
import { CuttingPlanOrmEntity } from './CuttingPlanOrmEntity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class TypeOrmCuttingPlanRepository implements ICuttingPlanRepository {
  constructor(
    @InjectRepository(CuttingPlanOrmEntity)
    private readonly orm: Repository<CuttingPlanOrmEntity>,
  ) {}

  async save(plan: CuttingPlan): Promise<void> {
    await this.orm.save(
      this.orm.create({
        id:           plan.id.value,
        tenantId:     plan.tenantId.value,
        orderId:      plan.orderId.value,
        materialId:   plan.materialId.value,
        sheetsUsed:   plan.sheetsUsed,
        wastePercent: plan.wastePercent,
        layouts:      plan.layouts,
        remnants:     plan.remnants,
      }),
    );
  }

  async findByOrderId(orderId: string, tenantId: string): Promise<CuttingPlan[]> {
    const rows = await this.orm.find({ where: { orderId, tenantId } });
    return rows.map((r) => this.toDomain(r));
  }

  private toDomain(r: CuttingPlanOrmEntity): CuttingPlan {
    return CuttingPlan.load(
      {
        tenantId:     new TenantId(r.tenantId),
        orderId:      new UniqueId(r.orderId),
        materialId:   new UniqueId(r.materialId),
        sheetsUsed:   r.sheetsUsed,
        wastePercent: Number(r.wastePercent),
        layouts:      r.layouts as SheetLayout[],
        remnants:     r.remnants as RemnantResult[],
        createdAt:    r.createdAt,
      },
      new UniqueId(r.id),
    );
  }
}
