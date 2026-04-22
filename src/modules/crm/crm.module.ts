import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CompanyOrmEntity } from './infrastructure/persistence/orm-entities/CompanyOrmEntity';
import { ContactOrmEntity } from './infrastructure/persistence/orm-entities/ContactOrmEntity';
import { DealOrmEntity } from './infrastructure/persistence/orm-entities/DealOrmEntity';
import { DealActivityOrmEntity } from './infrastructure/persistence/orm-entities/DealActivityOrmEntity';

import { TypeOrmCompanyRepository } from './infrastructure/persistence/TypeOrmCompanyRepository';
import { TypeOrmContactRepository } from './infrastructure/persistence/TypeOrmContactRepository';
import { TypeOrmDealRepository } from './infrastructure/persistence/TypeOrmDealRepository';
import { TypeOrmDealActivityRepository } from './infrastructure/persistence/TypeOrmDealActivityRepository';

import { IngestEmailContactUseCase } from './application/use-cases/IngestEmailContactUseCase';
import { GetContactsUseCase } from './application/use-cases/GetContactsUseCase';
import { GetCompaniesUseCase } from './application/use-cases/GetCompaniesUseCase';
import { CreateDealUseCase } from './application/use-cases/CreateDealUseCase';
import { GetDealsUseCase } from './application/use-cases/GetDealsUseCase';
import { MoveDealStageUseCase } from './application/use-cases/MoveDealStageUseCase';
import { AddDealActivityUseCase } from './application/use-cases/AddDealActivityUseCase';

import { CrmController } from './presentation/CrmController';
import { DealsController } from './presentation/DealsController';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CompanyOrmEntity, 
      ContactOrmEntity, 
      DealOrmEntity,          
      DealActivityOrmEntity   
    ]), 
  ],
  controllers: [CrmController, DealsController],
  providers: [
    { provide: 'ICompanyRepository', useClass: TypeOrmCompanyRepository },
    { provide: 'IContactRepository', useClass: TypeOrmContactRepository },
    { provide: 'IDealRepository', useClass: TypeOrmDealRepository },
    { provide: 'IDealActivityRepository', useClass: TypeOrmDealActivityRepository },
    IngestEmailContactUseCase,
    GetContactsUseCase,
    GetCompaniesUseCase,
    CreateDealUseCase,
    GetDealsUseCase,
    MoveDealStageUseCase,
    AddDealActivityUseCase,
  ],
  exports: [IngestEmailContactUseCase], 
})
export class CrmModule {}