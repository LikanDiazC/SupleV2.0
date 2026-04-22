import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyOrmEntity } from './infrastructure/persistence/orm-entities/CompanyOrmEntity';
import { ContactOrmEntity } from './infrastructure/persistence/orm-entities/ContactOrmEntity';
import { TypeOrmCompanyRepository } from './infrastructure/persistence/TypeOrmCompanyRepository';
import { TypeOrmContactRepository } from './infrastructure/persistence/TypeOrmContactRepository';
import { IngestEmailContactUseCase } from './application/use-cases/IngestEmailContactUseCase';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyOrmEntity, ContactOrmEntity]), // 👈 Con esto NestJS crea las tablas
  ],
  providers: [
    { provide: 'ICompanyRepository', useClass: TypeOrmCompanyRepository },
    { provide: 'IContactRepository', useClass: TypeOrmContactRepository },
    IngestEmailContactUseCase,
  ],
  exports: [IngestEmailContactUseCase], // 👈 Lo exportamos para que el módulo de comunicaciones lo pueda usar
})
export class CrmModule {}