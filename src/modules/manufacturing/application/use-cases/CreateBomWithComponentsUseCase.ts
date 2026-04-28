import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IBillOfMaterialsRepository } from '../../domain/repositories/IBillOfMaterialsRepository';
import type { IBomComponentRepository } from '../../domain/repositories/IBomComponentRepository';
import type { IProductRepository } from '../../../inventory/domain/repositories/IProductRepository';
import { BillOfMaterials } from '../../domain/entities/BillOfMaterials';
import { BomComponent, GrainRequirement } from '../../domain/entities/BomComponent';
import { Product } from '../../../inventory/domain/entities/Product';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export class CreateBomComponentDto {
  materialId!:       string;
  quantity!:         number;
  pieceWidthMm?:     number;
  pieceHeightMm?:    number;
  grainRequirement?: GrainRequirement;
  pieceLabel?:       string;
}

export class CreateBomWithComponentsDto {
  name!:         string;
  productName!:  string;
  productSku?:   string;
  components!:   CreateBomComponentDto[];
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
