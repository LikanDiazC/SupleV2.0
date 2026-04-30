import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import type { ITenantRepository } from '../../domain/repositories/ITenantRepository';
import type { ShopifyTokenResponseDto } from '../dtos/ShopifyTokenResponseDto';

@Injectable()
export class ShopifyOAuthCallbackUseCase {
  constructor(
    @Inject('ITenantRepository') private readonly tenantRepo: ITenantRepository,
  ) {}

  async execute(shop: string, code: string, tenantId: string): Promise<{ ok: boolean }> {
    const clientId = process.env.SHOPIFY_CLIENT_ID;
    const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Shopify credentials not configured');
    }

    try {
      const response = await axios.post<ShopifyTokenResponseDto>(
        `https://${shop}/admin/oauth/access_token`,
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
      );

      const accessToken = response.data.access_token;
      if (!accessToken) {
        throw new BadRequestException('No access token received from Shopify');
      }

      await this.tenantRepo.updateShopifyToken(tenantId, accessToken);
      return { ok: true };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new BadRequestException(`Shopify OAuth failed: ${error.response?.data?.error_description || error.message}`);
      }
      throw error;
    }
  }
}
