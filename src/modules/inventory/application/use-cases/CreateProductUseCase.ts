import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IProductRepository } from '../../domain/repositories/IProductRepository';
import { Product } from '../../domain/entities/Product';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export class CreateProductDto {
  name!:        string;
  sku!:         string;
  description?: string;
  salePrice?:   number;
  stock!:       number;
}

export interface ProductResponseDto {
  id:          string;
  tenantId:    string;
  name:        string;
  sku:         string;
  description?: string;
  salePrice?:  number;
  stock:       number;
}

@Injectable()
export class CreateProductUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(dto: CreateProductDto, tenantId: string): Promise<ProductResponseDto> {
    try {
      const product = Product.create({ ...dto, tenantId: new TenantId(tenantId) });
      await this.productRepository.save(product);
      return {
        id:          product.id.value,
        tenantId:    product.tenantId.value,
        name:        product.name,
        sku:         product.sku,
        description: product.description,
        salePrice:   product.salePrice,
        stock:       product.stock,
      };
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
