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
import { UpdateOrderStatusUseCase } from './application/use-cases/UpdateOrderStatusUseCase';
import { UpdateOrderFieldsUseCase } from './application/use-cases/UpdateOrderFieldsUseCase';
import { OrderNotificationsModule } from '../order-notifications/OrderNotificationsModule';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderOrmEntity]),
    InventoryModule,
    ManufacturingModule,
    OrderNotificationsModule,
  ],
  providers: [
    { provide: 'IOrderRepository', useClass: TypeOrmOrderRepository },
    ReceiveExternalOrderUseCase,
    CheckOrderStockUseCase,
    StartOrderProductionUseCase,
    CompleteOrderProductionUseCase,
    ShipOrderUseCase,
    DeliverOrderUseCase,
    GetOrdersUseCase,
    GetOrderByIdUseCase,
    UpdateOrderStatusUseCase,
    UpdateOrderFieldsUseCase,
  ],
  controllers: [OrdersController],
  exports: ['IOrderRepository', CheckOrderStockUseCase],
})
export class OrdersModule {}
