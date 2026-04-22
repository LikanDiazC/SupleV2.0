import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantOrmEntity } from './infrastructure/persistence/TenantOrmEntity';
import { TenantController } from './presentation/TenantController';
import { CreateTenantUseCase } from './application/use-cases/CreateTenantUseCase';
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
    {
      provide: 'ITenantRepository',
      useClass: TypeOrmTenantRepository,
    },
  ],
})
export class TenantModule {}