import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderNotificationOrmEntity } from './infrastructure/persistence/OrderNotificationOrmEntity';
import { TypeOrmOrderNotificationRepository } from './infrastructure/persistence/TypeOrmOrderNotificationRepository';
import { MarkNotificationStepUseCase } from './application/use-cases/MarkNotificationStepUseCase';
import { UnmarkNotificationStepUseCase } from './application/use-cases/UnmarkNotificationStepUseCase';
import { GetOrderNotificationsUseCase } from './application/use-cases/GetOrderNotificationsUseCase';

@Module({
  imports: [TypeOrmModule.forFeature([OrderNotificationOrmEntity])],
  providers: [
    { provide: 'IOrderNotificationRepository', useClass: TypeOrmOrderNotificationRepository },
    MarkNotificationStepUseCase,
    UnmarkNotificationStepUseCase,
    GetOrderNotificationsUseCase,
  ],
  exports: [MarkNotificationStepUseCase, UnmarkNotificationStepUseCase, GetOrderNotificationsUseCase],
})
export class OrderNotificationsModule {}
