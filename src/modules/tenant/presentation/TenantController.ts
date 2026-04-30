import { Controller, Post, Get, Body, Query, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { CreateTenantUseCase } from '../application/use-cases/CreateTenantUseCase';
import { ShopifyOAuthCallbackUseCase } from '../application/use-cases/ShopifyOAuthCallbackUseCase';
import { CreateTenantDto } from '../application/dtos/CreateTenantDto';

@Controller('tenants')
export class TenantController {
  constructor(
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly shopifyOAuthCallback: ShopifyOAuthCallbackUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createTenant(@Body() dto: CreateTenantDto) {
    return await this.createTenantUseCase.execute(dto);
  }

  @Get('shopify/callback')
  async shopifyCallback(
    @Query('shop') shop: string,
    @Query('code') code: string,
    @Query('state') state: string,
  ) {
    if (!shop || !code || !state) {
      throw new BadRequestException('Missing required parameters: shop, code, state');
    }

    let tenantId: string;
    try {
      const decodedState = Buffer.from(state, 'base64').toString('utf-8');
      tenantId = JSON.parse(decodedState).tenantId;
    } catch {
      throw new BadRequestException('Invalid or corrupted state parameter');
    }

    await this.shopifyOAuthCallback.execute(shop, code, tenantId);
    return { ok: true };
  }
}