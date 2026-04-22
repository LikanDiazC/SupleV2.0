import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemOrmEntity } from './infrastructure/persistence/ItemOrmEntity';
import { TypeOrmItemRepository } from './infrastructure/persistence/TypeOrmItemRepository';
import { InventoryController } from './presentation/InventoryController';
import { CreateItemUseCase } from './application/use-cases/CreateItemUseCase';
import { GetItemsUseCase } from './application/use-cases/GetItemsUseCase';
import { ConsumeItemStockUseCase } from './application/use-cases/ConsumeItemStockUseCase';
import { ReceiveItemStockUseCase } from './application/use-cases/ReceiveItemStockUseCase';
import { InventoryMovementOrmEntity } from './infrastructure/persistence/InventoryMovementOrmEntity';
import { TypeOrmInventoryMovementRepository } from './infrastructure/persistence/TypeOrmInventoryMovementRepository';
import { GetItemMovementsUseCase } from './application/use-cases/GetItemMovementsUseCase';

@Module({
  // 1. Le presentamos nuestra tabla a TypeORM
  imports: [TypeOrmModule.forFeature([ItemOrmEntity, InventoryMovementOrmEntity])],
  
  // 2. Registramos nuestros Traductores y Casos de Uso (Proveedores)
  providers: [
    {
      provide: 'IItemRepository',
      useClass: TypeOrmItemRepository,
    },
    {
      provide: 'IInventoryMovementRepository',
      useClass: TypeOrmInventoryMovementRepository,
    },
    CreateItemUseCase,
    GetItemsUseCase,
    ConsumeItemStockUseCase,
    ReceiveItemStockUseCase,
    GetItemMovementsUseCase,
  ],
  
  // 3. (Opcional por ahora) Controladores que reciban peticiones HTTP
  controllers: [InventoryController], 
  exports: ['IItemRepository', 'IInventoryMovementRepository'], // Exportamos los repositorios para que otros módulos puedan usarlos
})
export class InventoryModule {}