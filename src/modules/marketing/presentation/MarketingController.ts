import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { GetCampaignsMetricsUseCase } from '../application/GetCampaignsMetricsUseCase';
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';

@Controller('marketing')
@UseGuards(JwtAuthGuard)
export class MarketingController {
  constructor(
    private readonly getCampaignsMetrics: GetCampaignsMetricsUseCase
  ) {}

  @Get('dashboard')
  async getDashboard(@Req() request: Request) {
    const user = request['user'] as any;
    const tenantId = user.tenantId;

    // Aquí llamamos al caso de uso que consolida Google Ads (Y en el futuro Meta)
    const result = await this.getCampaignsMetrics.execute(tenantId);

    return {
      success: true,
      data: result
    };
  }
}
