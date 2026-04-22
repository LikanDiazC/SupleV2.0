import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BillOfMaterialsOrmEntity } from './infrastructure/persistence/BillOfMaterialsOrmEntity';
import { TypeOrmBillOfMaterialsRepository } from './infrastructure/persistence/TypeOrmBillOfMaterialsRepository';
import { CreateBillOfMaterialsUseCase } from './application/use-cases/CreateBillOfMaterialsUseCase';
import { ManufacturingController } from './presentation/ManufacturingController';
import { InventoryModule } from '../inventory/inventory.module';
import { ManufactureProductUseCase } from './application/use-cases/ManufactureProductUseCase';

@Module({
  imports: [
    // Registramos la entidad para que TypeORM cree la tabla
    TypeOrmModule.forFeature([BillOfMaterialsOrmEntity]),
    InventoryModule, // Importamos el módulo de inventario para poder usar su repositorio dentro de nuestros casos de uso
  ],
  providers: [
    {
      provide: 'IBillOfMaterialsRepository',
      useClass: TypeOrmBillOfMaterialsRepository,
    },
    CreateBillOfMaterialsUseCase,
    ManufactureProductUseCase,
  ],
  controllers: [ManufacturingController],
  exports: ['IBillOfMaterialsRepository'],
})
export class ManufacturingModule {}