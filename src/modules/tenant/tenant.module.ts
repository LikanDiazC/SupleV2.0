import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantOrmEntity } from './infrastructure/persistence/TenantOrmEntity';
import { TenantController } from './presentation/TenantController';
import { CreateTenantUseCase } from './application/use-cases/CreateTenantUseCase';
import { SaveShopifyTokenUseCase } from './application/use-cases/SaveShopifyTokenUseCase';
import { TypeOrmTenantRepository } from './infrastructure/persistence/TypeOrmTenantRepository';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantOrmEntity]), // Le damos permiso para usar la tabla
  ],
  controllers: [
    TenantController,
  ],
  providers: [
    CreateTenantUseCase,
    SaveShopifyTokenUseCase,
    {
      provide: 'ITenantRepository',
      useClass: TypeOrmTenantRepository,
    },
  ],
})
export class TenantModule {}