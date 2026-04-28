import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProductRepository } from '../../domain/repositories/IProductRepository';
import { Product } from '../../domain/entities/Product';
import { ProductOrmEntity } from '../persistence/ProductOrmEntity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class TypeOrmProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductOrmEntity)
    private readonly orm: Repository<ProductOrmEntity>,
  ) {}

  async save(product: Product): Promise<void> {
    await this.orm.save(
      this.orm.create({
        id:          product.id.value,
        tenantId:    product.tenantId.value,
        name:        product.name,
        sku:         product.sku,
        description: product.description,
        salePrice:   product.salePrice,
        stock:       product.stock,
      }),
    );
  }

  async findAll(tenantId: string): Promise<Product[]> {
    const rows = await this.orm.find({ where: { tenantId }, order: { name: 'ASC' } });
    return rows.map((r) => this.toDomain(r));
  }

  async findById(id: string, tenantId: string): Promise<Product | null> {
    const row = await this.orm.findOne({ where: { id, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  async findBySku(sku: string, tenantId: string): Promise<Product | null> {
    const row = await this.orm.findOne({ where: { sku, tenantId } });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(r: ProductOrmEntity): Product {
    return Product.load(
      {
        tenantId:    new TenantId(r.tenantId),
        name:        r.name,
        sku:         r.sku,
        description: r.description,
        salePrice:   r.salePrice ? Number(r.salePrice) : undefined,
        stock:       Number(r.stock),
      },
      new UniqueId(r.id),
    );
  }
}
