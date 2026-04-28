import { Injectable, Inject } from '@nestjs/common';
import type { IMaterialRepository } from '../../domain/repositories/IMaterialRepository';
import { Material } from '../../domain/entities/Material';
import { MaterialResponseDto } from './CreateMaterialUseCase';

@Injectable()
export class GetMaterialsUseCase {
  constructor(
    @Inject('IMaterialRepository')
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(tenantId: string, type?: string, limit?: number, offset?: number): Promise<MaterialResponseDto[]> {
    const materials = await this.materialRepository.findAll(tenantId, type, limit, offset);
    return materials.map((m) => GetMaterialsUseCase.toDto(m));
  }

  static toDto(m: Material): MaterialResponseDto {
    return {
      id:               m.id.value,
      tenantId:         m.tenantId.value,
      name:             m.name,
      sku:              m.sku,
      materialType:     m.materialType,
      unitOfMeasure:    m.unitOfMeasure,
      unitCost:         m.unitCost,
      stock:            m.stock,
      sheetWidthMm:     m.sheetWidthMm,
      sheetHeightMm:    m.sheetHeightMm,
      thicknessMm:      m.thicknessMm,
      grainDirection:   m.grainDirection,
      kerfMm:           m.kerfMm,
      minRemnantAreaMm2: m.minRemnantAreaMm2,
    };
  }
}
