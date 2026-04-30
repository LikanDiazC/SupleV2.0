import { Injectable, Inject } from '@nestjs/common';
import type { ITenantRepository } from '../../domain/repositories/ITenantRepository';

@Injectable()
export class SaveShopifyTokenUseCase {
  constructor(
    @Inject('ITenantRepository') private readonly tenantRepo: ITenantRepository,
  ) {}

  async execute(tenantId: string, accessToken: string): Promise<void> {
    await this.tenantRepo.updateShopifyToken(tenantId, accessToken);
  }
}
