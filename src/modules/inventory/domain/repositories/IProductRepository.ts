import { Product } from '../entities/Product';

export interface IProductRepository {
  save(product: Product): Promise<void>;
  findAll(tenantId: string): Promise<Product[]>;
  findById(id: string, tenantId: string): Promise<Product | null>;
  findBySku(sku: string, tenantId: string): Promise<Product | null>;
}
