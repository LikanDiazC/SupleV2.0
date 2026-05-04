import { Injectable, Inject } from '@nestjs/common';
import type { IMarketplaceCartRepository } from '../../infrastructure/persistence/TypeOrmMarketplaceCartRepository';
import { MARKETPLACE_CART_REPO } from '../../marketplace.tokens';

@Injectable()
export class GetMarketplaceCartUseCase {
  constructor(@Inject(MARKETPLACE_CART_REPO) private readonly repo: IMarketplaceCartRepository) {}

  async execute(userId: string) {
    return this.repo.findByUser(userId);
  }
}
