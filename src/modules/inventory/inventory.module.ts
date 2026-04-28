import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// ─── Movements ────────────────────────────────────────────────────────────────
import { InventoryMovementOrmEntity } from './infrastructure/persistence/InventoryMovementOrmEntity';
import { TypeOrmInventoryMovementRepository } from './infrastructure/persistence/TypeOrmInventoryMovementRepository';

// ─── Materials ────────────────────────────────────────────────────────────────
import { MaterialOrmEntity } from './infrastructure/persistence/MaterialOrmEntity';
import { TypeOrmMaterialRepository } from './infrastructure/repositories/TypeOrmMaterialRepository';
import { MaterialController } from './presentation/MaterialController';
import { CreateMaterialUseCase } from './application/use-cases/CreateMaterialUseCase';
import { GetMaterialsUseCase } from './application/use-cases/GetMaterialsUseCase';
import { AddMaterialStockUseCase } from './application/use-cases/AddMaterialStockUseCase';
import { ConsumeMaterialStockUseCase } from './application/use-cases/ConsumeMaterialStockUseCase';
import { GetRemnantsUseCase } from './application/use-cases/GetRemnantsUseCase';

// ─── Products ─────────────────────────────────────────────────────────────────
import { ProductOrmEntity } from './infrastructure/persistence/ProductOrmEntity';
import { TypeOrmProductRepository } from './infrastructure/repositories/TypeOrmProductRepository';
import { ProductController } from './presentation/ProductController';
import { CreateProductUseCase } from './application/use-cases/CreateProductUseCase';
import { GetProductsUseCase } from './application/use-cases/GetProductsUseCase';

// ─── Remnants ─────────────────────────────────────────────────────────────────
import { RemnantOrmEntity } from './infrastructure/persistence/RemnantOrmEntity';
import { TypeOrmRemnantRepository } from './infrastructure/repositories/TypeOrmRemnantRepository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryMovementOrmEntity,
      MaterialOrmEntity,
      ProductOrmEntity,
      RemnantOrmEntity,
    ]),
  ],
  providers: [
    // Repositories
    { provide: 'IInventoryMovementRepository', useClass: TypeOrmInventoryMovementRepository },
    { provide: 'IMaterialRepository',          useClass: TypeOrmMaterialRepository },
    { provide: 'IProductRepository',           useClass: TypeOrmProductRepository },
    { provide: 'IRemnantRepository',           useClass: TypeOrmRemnantRepository },

    // Material use cases
    CreateMaterialUseCase,
    GetMaterialsUseCase,
    AddMaterialStockUseCase,
    ConsumeMaterialStockUseCase,
    GetRemnantsUseCase,

    // Product use cases
    CreateProductUseCase,
    GetProductsUseCase,
  ],
  controllers: [
    MaterialController,
    ProductController,
  ],
  exports: [
    'IInventoryMovementRepository',
    'IMaterialRepository',
    'IProductRepository',
    'IRemnantRepository',
  ],
})
export class InventoryModule {}
