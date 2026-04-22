import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';
import { GetContactsUseCase } from '../application/use-cases/GetContactsUseCase';
import { GetCompaniesUseCase } from '../application/use-cases/GetCompaniesUseCase';

@Controller('crm') // Rutas base: http://localhost:3000/crm/...
@UseGuards(JwtAuthGuard) // 🛡️ Protegemos todas las rutas con el Token
export class CrmController {
  constructor(
    private readonly getContactsUseCase: GetContactsUseCase,
    private readonly getCompaniesUseCase: GetCompaniesUseCase,
  ) {}

  @Get('contacts')
  async getContacts(@Req() request: Request) {
    const userPayload = request['user'] as any;
    return await this.getContactsUseCase.execute(userPayload.tenantId);
  }

  @Get('companies')
  async getCompanies(@Req() request: Request) {
    const userPayload = request['user'] as any;
    return await this.getCompaniesUseCase.execute(userPayload.tenantId);
  }
}