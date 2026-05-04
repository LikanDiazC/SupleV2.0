import { Injectable, Inject } from '@nestjs/common';
import type { IMarketplaceCartRepository } from '../../infrastructure/persistence/TypeOrmMarketplaceCartRepository';
import { MARKETPLACE_CART_REPO } from '../../marketplace.tokens';

@Injectable()
export class AddToCartUseCase {
  constructor(@Inject(MARKETPLACE_CART_REPO) private readonly repo: IMarketplaceCartRepository) {}

  async execute(userId: string, tenantId: string, productId: string, quantity: number) {
    let cart = await this.repo.findByUser(userId);
    if (!cart) {
      cart = await this.repo.createCart(userId, tenantId);
    }

    const existing = await this.repo.findItemInCart(cart.id, productId);
    if (existing) {
      return this.repo.incrementItem(existing.id, quantity);
    }
    return this.repo.addItem(cart.id, productId, quantity);
  }
}
