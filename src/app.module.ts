import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { UserOrmEntity } from './modules/iam/infrastructure/persistence/UserOrmEntity'; // <-- 1. Importar aquí
import { IamModule } from './modules/iam/iam.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { TenantOrmEntity } from './modules/tenant/infrastructure/persistence/TenantOrmEntity';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ManufacturingModule } from './modules/manufacturing/manufacturing.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { CrmModule } from './modules/crm/crm.module';
import { MarketingModule } from './modules/marketing/MarketingModule';
import { HrModule } from './modules/hr/hr.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'default', ttl: 60_000, limit: 100 },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production',
      entities: [UserOrmEntity, TenantOrmEntity],
    }),
    IamModule,
    TenantModule,
    InventoryModule,
    ManufacturingModule,
    OrdersModule,
    CommunicationsModule,
    CrmModule,
    MarketingModule,
    HrModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}