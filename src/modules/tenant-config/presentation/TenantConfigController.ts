import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';
import { GetTenantConfigUseCase } from '../application/use-cases/GetTenantConfigUseCase';

@Controller('tenant')
export class TenantConfigController {
  constructor(private readonly getTenantConfigUseCase: GetTenantConfigUseCase) {}

  @UseGuards(JwtAuthGuard)
  @Get('config')
  async getConfig(@Req() req: Request) {
    const { tenantId } = req['user'] as any;
    const config = await this.getTenantConfigUseCase.execute(tenantId);
    return {
      orderTypes:    config.orderTypes,
      orderStatuses: config.orderStatuses,
      extraFields:   config.extraFields,
      notifSteps:    config.notifSteps,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('configs')
  async getAllConfigs() {
    return this.getTenantConfigUseCase.executeAll();
  }
}
