import { Injectable, Inject } from '@nestjs/common';
import { MARKETPLACE_PRODUCT_REPO } from '../../marketplace.tokens';

export interface GetProductsQuery {
  search?: string;
  tienda?: string;
  categoria?: string;
  page?: number;
  limit?: number;
}

export interface MarketplaceProductData {
  id: string;
  tienda: string;
  sku: string;
  marca?: string;
  titulo: string;
  urlProducto: string;
  urlImagen?: string;
  precioCLP?: number;
  precioNormalCLP?: number;
  descuentoPct?: number;
  rating?: number;
  categorias?: { cat1?: string; cat2?: string; cat3?: string; cat4?: string };
  atributos?: Record<string, unknown>;
  disponibilidad?: string;
  createdAt?: Date;
}

export interface IMarketplaceProductRepository {
  findAll(opts: {
    search?: string;
    tienda?: string;
    categoria?: string;
    skip: number;
    take: number;
  }): Promise<{ items: MarketplaceProductData[]; total: number }>;
}

@Injectable()
export class GetMarketplaceProductsUseCase {
  constructor(
    @Inject(MARKETPLACE_PRODUCT_REPO)
    private readonly repo: IMarketplaceProductRepository,
  ) {}

  async execute(query: GetProductsQuery) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 50, 200);
    const skip = (page - 1) * limit;

    const { items, total } = await this.repo.findAll({
      search: query.search,
      tienda: query.tienda,
      categoria: query.categoria,
      skip,
      take: limit,
    });

    return { items, total, page };
  }
}
