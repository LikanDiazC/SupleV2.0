import { Product } from '../entities/Product';

export interface IProductRepository {
  save(product: Product): Promise<void>;
  findAll(tenantId: string): Promise<Product[]>;
  findById(id: string, tenantId: string): Promise<Product | null>;
  findByIds(ids: string[], tenantId: string): Promise<Product[]>;
  findBySku(sku: string, tenantId: string): Promise<Product | null>;
}
