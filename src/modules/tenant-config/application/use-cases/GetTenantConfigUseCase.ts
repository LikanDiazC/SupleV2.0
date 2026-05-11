import { Injectable, Inject } from '@nestjs/common';
import type { ITenantConfigRepository } from '../../domain/repositories/ITenantConfigRepository';
import { TenantConfig } from '../../domain/entities/TenantConfig';

@Injectable()
export class GetTenantConfigUseCase {
  constructor(
    @Inject('ITenantConfigRepository')
    private readonly repo: ITenantConfigRepository,
  ) {}

  async execute(tenantId: string): Promise<TenantConfig> {
    const config = await this.repo.findByTenantId(tenantId);
    return config ?? TenantConfig.empty(tenantId);
  }
}
