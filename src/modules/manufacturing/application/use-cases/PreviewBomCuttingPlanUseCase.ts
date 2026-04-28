import { Injectable, Inject } from '@nestjs/common';
import type { IBomComponentRepository } from '../../domain/repositories/IBomComponentRepository';
import type { IMaterialRepository } from '../../../inventory/domain/repositories/IMaterialRepository';
import { CuttingEngine } from '../../domain/services/CuttingEngine';

export interface MaterialCuttingPreview {
  materialId: string;
  materialName: string;
  sheetWidthMm: number;
  sheetHeightMm: number;
  sheetsUsed: number;
  wastePercent: number;
  layouts: { sheetIndex: number; pieces: { label: string; x: number; y: number; width: number; height: number; rotated: boolean }[] }[];
  remnants: { widthMm: number; heightMm: number }[];
}

@Injectable()
export class PreviewBomCuttingPlanUseCase {
  constructor(
    @Inject('IBomComponentRepository')
    private readonly componentRepo: IBomComponentRepository,
    @Inject('IMaterialRepository')
    private readonly materialRepo: IMaterialRepository,
  ) {}

  async execute(tenantId: string, bomId: string, quantity = 1): Promise<MaterialCuttingPreview[]> {
    const components = await this.componentRepo.findByBomId(bomId, tenantId);

    const byMaterial = new Map<string, typeof components>();
    for (const comp of components) {
      if (!comp.hasDimensions()) continue;
      const mid = comp.materialId.value;
      if (!byMaterial.has(mid)) byMaterial.set(mid, []);
      byMaterial.get(mid)!.push(comp);
    }

    const results: MaterialCuttingPreview[] = [];

    for (const [materialId, comps] of byMaterial) {
      const material = await this.materialRepo.findById(materialId, tenantId);
      if (!material || !material.isSheet() || !material.sheetWidthMm || !material.sheetHeightMm) continue;

      const pieces = comps
        .filter(c => c.pieceWidthMm !== undefined && c.pieceHeightMm !== undefined)
        .map(c => ({
          label:            c.pieceLabel ?? `${c.pieceWidthMm}×${c.pieceHeightMm}`,
          widthMm:          c.pieceWidthMm!,
          heightMm:         c.pieceHeightMm!,
          grainRequirement: (c.grainRequirement ?? 'ANY') as 'FOLLOW' | 'CROSS' | 'ANY',
          quantity:         c.quantity * quantity,
        }));

      if (pieces.length === 0) continue;

      const result = CuttingEngine.optimize(pieces, {
        widthMm:           material.sheetWidthMm,
        heightMm:          material.sheetHeightMm,
        grainDirection:    material.grainDirection ?? 'NONE',
        kerfMm:            material.kerfMm ?? 3.2,
        minRemnantAreaMm2: material.minRemnantAreaMm2 ?? 60000,
      });

      results.push({
        materialId,
        materialName:  material.name,
        sheetWidthMm:  material.sheetWidthMm,
        sheetHeightMm: material.sheetHeightMm,
        sheetsUsed:    result.sheetsUsed,
        wastePercent:  result.wastePercent,
        layouts:       result.layouts,
        remnants:      result.remnants,
      });
    }

    return results;
  }
}
