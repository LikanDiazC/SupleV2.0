import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateTenantUseCase } from '../application/use-cases/CreateTenantUseCase';
import { SaveShopifyTokenUseCase } from '../application/use-cases/SaveShopifyTokenUseCase';
import { CreateTenantDto } from '../application/dtos/CreateTenantDto';

@Controller('tenants')
export class TenantController {
  constructor(
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly saveShopifyTokenUseCase: SaveShopifyTokenUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTenant(@Body() dto: CreateTenantDto) {
    return await this.createTenantUseCase.execute(dto);
  }

  @Post('shopify/callback')
  @HttpCode(HttpStatus.OK)
  async shopifyCallback(@Body() body: { tenantId: string; accessToken: string }) {
    await this.saveShopifyTokenUseCase.execute(body.tenantId, body.accessToken);
    return { ok: true };
  }
}