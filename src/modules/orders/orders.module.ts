import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderOrmEntity } from './infrastructure/persistence/OrderOrmEntity';
import { TypeOrmOrderRepository } from './infrastructure/persistence/TypeOrmOrderRepository';
import { ReceiveExternalOrderUseCase } from './application/use-cases/ReceiveExternalOrderUseCase';
import { OrdersController } from './presentation/OrdersController';
import { InventoryModule } from '../inventory/inventory.module';
import { ManufacturingModule } from '../manufacturing/manufacturing.module';
import { CheckOrderStockUseCase } from './application/use-cases/CheckOrderStockUseCase';
import { StartOrderProductionUseCase } from './application/use-cases/StartOrderProductionUseCase';
import { CompleteOrderProductionUseCase } from './application/use-cases/CompleteOrderProductionUseCase';
import { DeliverOrderUseCase } from './application/use-cases/DeliverOrderUseCase';
import { ShipOrderUseCase } from './application/use-cases/ShipOrderUseCase';
import { GetOrdersUseCase } from './application/use-cases/GetOrdersUseCase';
import { GetOrderByIdUseCase } from './application/use-cases/GetOrderByIdUseCase';

@Module({
  // 👇 Aquí van los módulos
  imports: [
    TypeOrmModule.forFeature([OrderOrmEntity]),
    InventoryModule,
    ManufacturingModule
  ],
  // 👇 Aquí van los Casos de Uso y Repositorios
  providers: [
    {
      provide: 'IOrderRepository',
      useClass: TypeOrmOrderRepository,
    },
    ReceiveExternalOrderUseCase,
    CheckOrderStockUseCase,
    StartOrderProductionUseCase,
    CompleteOrderProductionUseCase,
    ShipOrderUseCase,
    DeliverOrderUseCase,
    GetOrdersUseCase,
    GetOrderByIdUseCase,
  ],
  controllers: [OrdersController],
  exports: ['IOrderRepository'],
})
export class OrdersModule {}