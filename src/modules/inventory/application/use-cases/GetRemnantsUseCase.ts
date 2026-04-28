import { Injectable, Inject } from '@nestjs/common';
import type { IRemnantRepository } from '../../domain/repositories/IRemnantRepository';
import type { IMaterialRepository } from '../../domain/repositories/IMaterialRepository';

@Injectable()
export class GetRemnantsUseCase {
  constructor(
    @Inject('IRemnantRepository')
    private readonly remnantRepo: IRemnantRepository,
    @Inject('IMaterialRepository')
    private readonly materialRepo: IMaterialRepository,
  ) {}

  async execute(tenantId: string) {
    const remnants = await this.remnantRepo.findAll(tenantId);

    const materialCache = new Map<string, string>();

    return Promise.all(
      remnants.map(async (r) => {
        const mid = r.materialId.value;
        if (!materialCache.has(mid)) {
          const mat = await this.materialRepo.findById(mid, tenantId);
          materialCache.set(mid, mat?.name ?? 'Material desconocido');
        }
        return {
          id:            r.id.value,
          materialId:    mid,
          materialName:  materialCache.get(mid)!,
          widthMm:       r.widthMm,
          heightMm:      r.heightMm,
          areaMm2:       r.areaMm2,
          stock:         r.stock,
          sourceOrderId: r.sourceOrderId.value,
          createdAt:     r.createdAt,
        };
      }),
    );
  }
}
