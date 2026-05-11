import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { IsString, IsNotEmpty, IsNumber, IsIn, IsOptional, Min } from 'class-validator';
import type { IMaterialRepository } from '../../domain/repositories/IMaterialRepository';
import { Material, MaterialType, GrainDirection } from '../../domain/entities/Material';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export class CreateMaterialDto {
  @IsString() @IsNotEmpty()
  name!: string;

  @IsString() @IsNotEmpty()
  sku!: string;

  @IsIn(['SHEET', 'HARDWARE', 'CONSUMABLE'])
  materialType!: MaterialType;

  @IsString() @IsNotEmpty()
  unitOfMeasure!: string;

  @IsNumber() @Min(0)
  unitCost!: number;

  @IsNumber() @Min(0)
  stock!: number;

  @IsOptional() @IsNumber() @Min(0)
  sheetWidthMm?: number;

  @IsOptional() @IsNumber() @Min(0)
  sheetHeightMm?: number;

  @IsOptional() @IsNumber() @Min(0)
  thicknessMm?: number;

  @IsOptional() @IsIn(['HORIZONTAL', 'VERTICAL', 'NONE'])
  grainDirection?: GrainDirection;

  @IsOptional() @IsNumber() @Min(0)
  kerfMm?: number;

  @IsOptional() @IsNumber() @Min(0)
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
