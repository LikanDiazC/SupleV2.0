import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantConfigOrmEntity } from './infrastructure/persistence/TenantConfigOrmEntity';
import { TypeOrmTenantConfigRepository } from './infrastructure/persistence/TypeOrmTenantConfigRepository';
import { GetTenantConfigUseCase } from './application/use-cases/GetTenantConfigUseCase';
import { TenantConfigController } from './presentation/TenantConfigController';

@Module({
  imports: [TypeOrmModule.forFeature([TenantConfigOrmEntity])],
  providers: [
    { provide: 'ITenantConfigRepository', useClass: TypeOrmTenantConfigRepository },
    GetTenantConfigUseCase,
  ],
  controllers: [TenantConfigController],
  exports: [GetTenantConfigUseCase],
})
export class TenantConfigModule {}
