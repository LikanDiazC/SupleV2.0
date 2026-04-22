import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateTenantUseCase } from '../application/use-cases/CreateTenantUseCase';
import { CreateTenantDto } from '../application/dtos/CreateTenantDto';

@Controller('tenants') // Escuchará en http://localhost:3000/tenants
export class TenantController {
  constructor(
    private readonly createTenantUseCase: CreateTenantUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTenant(@Body() dto: CreateTenantDto) {
    return await this.createTenantUseCase.execute(dto);
  }
}