import { Injectable, Inject } from '@nestjs/common';
import type { IBillOfMaterialsRepository } from '../../domain/repositories/IBillOfMaterialsRepository';
import type { IBomComponentRepository } from '../../domain/repositories/IBomComponentRepository';
import type { IMaterialRepository } from '../../../inventory/domain/repositories/IMaterialRepository';

@Injectable()
export class GetBomsUseCase {
  constructor(
    @Inject('IBillOfMaterialsRepository')
    private readonly bomRepo: IBillOfMaterialsRepository,
    @Inject('IBomComponentRepository')
    private readonly componentRepo: IBomComponentRepository,
    @Inject('IMaterialRepository')
    private readonly materialRepo: IMaterialRepository,
  ) {}

  async execute(tenantId: string) {
    const boms = await this.bomRepo.findAll(tenantId);

    return Promise.all(boms.map(async (b) => {
      const components = await this.componentRepo.findByBomId(b.id.value, tenantId);

      const enrichedComponents = await Promise.all(
        components.map(async (c) => {
          const material = await this.materialRepo.findById(c.materialId.value, tenantId);
          return {
            materialId:       c.materialId.value,
            materialName:     material?.name ?? 'Material desconocido',
            quantity:         c.quantity,
            pieceWidthMm:     c.pieceWidthMm,
            pieceHeightMm:    c.pieceHeightMm,
            grainRequirement: c.grainRequirement,
            pieceLabel:       c.pieceLabel,
          };
        }),
      );

      return {
        id:         b.id.value,
        productId:  b.productId.value,
        name:       b.name,
        components: enrichedComponents,
        createdAt:  b.createdAt,
      };
    }));
  }
}