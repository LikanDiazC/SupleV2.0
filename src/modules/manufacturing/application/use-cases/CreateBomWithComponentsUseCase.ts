import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import {
  IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, IsUUID,
  IsIn, ArrayMinSize, ValidateNested, Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { IBillOfMaterialsRepository } from '../../domain/repositories/IBillOfMaterialsRepository';
import type { IBomComponentRepository } from '../../domain/repositories/IBomComponentRepository';
import type { IProductRepository } from '../../../inventory/domain/repositories/IProductRepository';
import { BillOfMaterials } from '../../domain/entities/BillOfMaterials';
import { BomComponent } from '../../domain/entities/BomComponent';
import type { GrainRequirement } from '../../domain/entities/BomComponent';
import { Product } from '../../../inventory/domain/entities/Product';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export class CreateBomComponentDto {
  @IsUUID()
  materialId!: string;

  @IsNumber() @Min(0.0001)
  quantity!: number;

  @IsOptional() @IsNumber() @Min(0)
  pieceWidthMm?: number;

  @IsOptional() @IsNumber() @Min(0)
  pieceHeightMm?: number;

  @IsOptional() @IsIn(['FOLLOW', 'CROSS', 'ANY'])
  grainRequirement?: GrainRequirement;

  @IsOptional() @IsString()
  pieceLabel?: string;
}

export class CreateBomWithComponentsDto {
  @IsString() @IsNotEmpty()
  name!: string;

  @IsString() @IsNotEmpty()
  productName!: string;

  @IsOptional() @IsString()
  productSku?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBomComponentDto)
  components!: CreateBomComponentDto[];
}

@Injectable()
export class CreateBomWithComponentsUseCase {
  constructor(
    @Inject('IBillOfMaterialsRepository')
    private readonly bomRepository: IBillOfMaterialsRepository,
    @Inject('IBomComponentRepository')
    private readonly componentRepository: IBomComponentRepository,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(tenantId: string, dto: CreateBomWithComponentsDto): Promise<void> {
    if (!dto.components || dto.components.length === 0) {
      throw new BadRequestException('El BOM debe tener al menos un componente.');
    }

    try {
      const tenantVo = new TenantId(tenantId);
      const sku      = dto.productSku?.trim() || this.generateSku(dto.productName);

      // Buscar producto existente por SKU; si no existe, crearlo automáticamente
      let product = await this.productRepository.findBySku(sku, tenantId);
      if (!product) {
        product = Product.create({
          tenantId: tenantVo,
          name:     dto.productName.trim(),
          sku,
          stock:    0,
        });
        await this.productRepository.save(product);
      }

      const bomId = new UniqueId();

      const bom = BillOfMaterials.create({
        tenantId:  tenantVo,
        productId: product.id,
        name:      dto.name,
        components: dto.components.map((c) => ({
          itemId:   new UniqueId(c.materialId),
          quantity: c.quantity,
        })),
      }, bomId);

      const components = dto.components.map((c) =>
        BomComponent.create({
          tenantId:         tenantVo,
          bomId,
          materialId:       new UniqueId(c.materialId),
          quantity:         c.quantity,
          pieceWidthMm:     c.pieceWidthMm,
          pieceHeightMm:    c.pieceHeightMm,
          grainRequirement: c.grainRequirement,
          pieceLabel:       c.pieceLabel,
        }),
      );

      await this.bomRepository.save(bom);
      await this.componentRepository.saveMany(components);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }

  private generateSku(name: string): string {
    return name.trim().toUpperCase().replace(/\s+/g, '-').substring(0, 20);
  }
}
