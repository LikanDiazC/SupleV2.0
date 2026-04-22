import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UserOrmEntity } from './modules/iam/infrastructure/persistence/UserOrmEntity'; // <-- 1. Importar aquí
import { IamModule } from './modules/iam/iam.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { TenantOrmEntity } from './modules/tenant/infrastructure/persistence/TenantOrmEntity';
import { InventoryModule } from './modules/inventory/inventory.module';
import { ManufacturingModule } from './modules/manufacturing/manufacturing.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { CrmModule } from './modules/crm/crm.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, // ⚠️ OJO: CAMBIA ESTO TEMPORALMENTE A TRUE
      entities: [UserOrmEntity, TenantOrmEntity], // <-- 2. Agregar la entidad aquí
      
    }),
    IamModule,
    TenantModule,
    InventoryModule,
    ManufacturingModule,
    OrdersModule,
    CommunicationsModule,
    CrmModule,
  ],
})
export class AppModule {}