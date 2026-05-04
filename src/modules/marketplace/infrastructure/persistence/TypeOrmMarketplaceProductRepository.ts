import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceProductOrmEntity } from './MarketplaceProductOrmEntity';
import { IMarketplaceProductRepository, MarketplaceProductData } from '../../application/use-cases/GetMarketplaceProductsUseCase';

@Injectable()
export class TypeOrmMarketplaceProductRepository implements IMarketplaceProductRepository {
  private readonly logger = new Logger(TypeOrmMarketplaceProductRepository.name);

  constructor(
    @InjectRepository(MarketplaceProductOrmEntity)
    private readonly orm: Repository<MarketplaceProductOrmEntity>,
  ) {}

  async findAll(opts: {
    search?: string;
    tienda?: string;
    categoria?: string;
    skip: number;
    take: number;
  }): Promise<{ items: MarketplaceProductData[]; total: number }> {
    const qb = this.orm.createQueryBuilder('p');

    if (opts.tienda && opts.tienda !== 'all') {
      qb.andWhere('p.tienda = :tienda', { tienda: opts.tienda });
    }

    if (opts.search) {
      qb.andWhere(
        '(p.titulo ILIKE :search OR p.marca ILIKE :search)',
        { search: `%${opts.search}%` },
      );
    }

    if (opts.categoria) {
      qb.andWhere(
        "(p.categorias->>'cat1' ILIKE :cat OR p.categorias->>'cat2' ILIKE :cat OR p.categorias->>'cat3' ILIKE :cat)",
        { cat: `%${opts.categoria}%` },
      );
    }

    qb.orderBy('p.titulo', 'ASC').skip(opts.skip).take(opts.take);

    try {
      const [items, total] = await qb.getManyAndCount();
      return { items, total };
    } catch (err) {
      this.logger.error('findAll failed', err);
      throw new InternalServerErrorException('Error al cargar productos');
    }
  }
}
