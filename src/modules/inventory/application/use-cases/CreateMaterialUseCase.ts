import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IMaterialRepository } from '../../domain/repositories/IMaterialRepository';
import { Material, MaterialType, GrainDirection } from '../../domain/entities/Material';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export class CreateMaterialDto {
  name!:         string;
  sku!:          string;
  materialType!: MaterialType;
  unitOfMeasure!: string;
  unitCost!:     number;
  stock!:        number;

  // Solo para SHEET:
  sheetWidthMm?:      number;
  sheetHeightMm?:     number;
  thicknessMm?:       number;
  grainDirection?:    GrainDirection;
  kerfMm?:            number;
  minRemnantAreaMm2?: number;
}

export interface MaterialResponseDto {
  id:           string;
  tenantId:     string;
  name:         string;
  sku:          string;
  materialType: string;
  unitOfMeasure: string;
  unitCost:     number;
  stock:        number;
  sheetWidthMm?:      number;
  sheetHeightMm?:     number;
  thicknessMm?:       number;
  grainDirection?:    string;
  kerfMm?:            number;
  minRemnantAreaMm2?: number;
}

@Injectable()
export class CreateMaterialUseCase {
  constructor(
    @Inject('IMaterialRepository')
    private readonly materialRepository: IMaterialRepository,
  ) {}

  async execute(dto: CreateMaterialDto, tenantId: string): Promise<MaterialResponseDto> {
    try {
      const material = Material.create({ ...dto, tenantId: new TenantId(tenantId) });
      await this.materialRepository.save(material);

      return {
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
      };
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
