import { Injectable, Inject } from '@nestjs/common';
import type { IProductRepository } from '../../domain/repositories/IProductRepository';
import { ProductResponseDto } from './CreateProductUseCase';

@Injectable()
export class GetProductsUseCase {
  constructor(
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
  ) {}

  async execute(tenantId: string): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.findAll(tenantId);
    return products.map((p) => ({
      id:          p.id.value,
      tenantId:    p.tenantId.value,
      name:        p.name,
      sku:         p.sku,
      description: p.description,
      salePrice:   p.salePrice,
      stock:       p.stock,
    }));
  }
}
