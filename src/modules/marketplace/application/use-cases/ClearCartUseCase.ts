import { Injectable, Inject } from '@nestjs/common';
import type { IMarketplaceCartRepository } from '../../infrastructure/persistence/TypeOrmMarketplaceCartRepository';
import { MARKETPLACE_CART_REPO } from '../../marketplace.tokens';

@Injectable()
export class ClearCartUseCase {
  constructor(@Inject(MARKETPLACE_CART_REPO) private readonly repo: IMarketplaceCartRepository) {}

  async executeByStore(userId: string, tienda: string) {
    const cart = await this.repo.findByUser(userId);
    if (!cart) return;
    await this.repo.clearByStore(cart.id, tienda);
  }

  async executeAll(userId: string) {
    const cart = await this.repo.findByUser(userId);
    if (!cart) return;
    await this.repo.clearAll(cart.id);
  }
}
