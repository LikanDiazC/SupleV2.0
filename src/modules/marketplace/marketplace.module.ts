import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketplaceProductOrmEntity } from './infrastructure/persistence/MarketplaceProductOrmEntity';
import { MarketplaceCartOrmEntity } from './infrastructure/persistence/MarketplaceCartOrmEntity';
import { MarketplaceCartItemOrmEntity } from './infrastructure/persistence/MarketplaceCartItemOrmEntity';
import { TypeOrmMarketplaceProductRepository } from './infrastructure/persistence/TypeOrmMarketplaceProductRepository';
import { TypeOrmMarketplaceCartRepository } from './infrastructure/persistence/TypeOrmMarketplaceCartRepository';
import { GetMarketplaceProductsUseCase } from './application/use-cases/GetMarketplaceProductsUseCase';
import { GetMarketplaceCartUseCase } from './application/use-cases/GetMarketplaceCartUseCase';
import { AddToCartUseCase } from './application/use-cases/AddToCartUseCase';
import { UpdateCartItemUseCase } from './application/use-cases/UpdateCartItemUseCase';
import { RemoveCartItemUseCase } from './application/use-cases/RemoveCartItemUseCase';
import { ClearCartUseCase } from './application/use-cases/ClearCartUseCase';
import { MarketplaceController } from './presentation/MarketplaceController';
import { MARKETPLACE_PRODUCT_REPO, MARKETPLACE_CART_REPO } from './marketplace.tokens';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MarketplaceProductOrmEntity,
      MarketplaceCartOrmEntity,
      MarketplaceCartItemOrmEntity,
    ]),
  ],
  providers: [
    { provide: MARKETPLACE_PRODUCT_REPO, useClass: TypeOrmMarketplaceProductRepository },
    { provide: MARKETPLACE_CART_REPO, useClass: TypeOrmMarketplaceCartRepository },
    GetMarketplaceProductsUseCase,
    GetMarketplaceCartUseCase,
    AddToCartUseCase,
    UpdateCartItemUseCase,
    RemoveCartItemUseCase,
    ClearCartUseCase,
  ],
  controllers: [MarketplaceController],
})
export class MarketplaceModule {}
