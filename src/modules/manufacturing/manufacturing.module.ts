import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryModule } from '../inventory/inventory.module';

// ─── BOM ──────────────────────────────────────────────────────────────────────
import { BillOfMaterialsOrmEntity } from './infrastructure/persistence/BillOfMaterialsOrmEntity';
import { TypeOrmBillOfMaterialsRepository } from './infrastructure/persistence/TypeOrmBillOfMaterialsRepository';
import { CreateBillOfMaterialsUseCase } from './application/use-cases/CreateBillOfMaterialsUseCase';
import { GetBomsUseCase } from './application/use-cases/GetBomsUseCase';

// ─── BOM Components ───────────────────────────────────────────────────────────
import { BomComponentOrmEntity } from './infrastructure/persistence/BomComponentOrmEntity';
import { TypeOrmBomComponentRepository } from './infrastructure/persistence/TypeOrmBomComponentRepository';
import { CreateBomWithComponentsUseCase } from './application/use-cases/CreateBomWithComponentsUseCase';
import { DeleteBomUseCase } from './application/use-cases/DeleteBomUseCase';
import { PreviewBomCuttingPlanUseCase } from './application/use-cases/PreviewBomCuttingPlanUseCase';

// ─── Cutting Plans ────────────────────────────────────────────────────────────
import { CuttingPlanOrmEntity } from './infrastructure/persistence/CuttingPlanOrmEntity';
import { TypeOrmCuttingPlanRepository } from './infrastructure/persistence/TypeOrmCuttingPlanRepository';

// ─── Manufacturing ────────────────────────────────────────────────────────────
import { ManufactureProductUseCase } from './application/use-cases/ManufactureProductUseCase';
import { ManufacturingController } from './presentation/ManufacturingController';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BillOfMaterialsOrmEntity,
      BomComponentOrmEntity,
      CuttingPlanOrmEntity,
    ]),
    InventoryModule,
  ],
  providers: [
    { provide: 'IBillOfMaterialsRepository', useClass: TypeOrmBillOfMaterialsRepository },
    { provide: 'IBomComponentRepository',    useClass: TypeOrmBomComponentRepository },
    { provide: 'ICuttingPlanRepository',     useClass: TypeOrmCuttingPlanRepository },

    CreateBillOfMaterialsUseCase,
    GetBomsUseCase,
    CreateBomWithComponentsUseCase,
    DeleteBomUseCase,
    ManufactureProductUseCase,
    PreviewBomCuttingPlanUseCase,
  ],
  controllers: [ManufacturingController],
  exports: [
    'IBillOfMaterialsRepository',
    'IBomComponentRepository',
    'ICuttingPlanRepository',
  ],
})
export class ManufacturingModule {}
