import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IMarketplaceCartRepository } from '../../infrastructure/persistence/TypeOrmMarketplaceCartRepository';
import { MARKETPLACE_CART_REPO } from '../../marketplace.tokens';

@Injectable()
export class RemoveCartItemUseCase {
  constructor(@Inject(MARKETPLACE_CART_REPO) private readonly repo: IMarketplaceCartRepository) {}

  async execute(itemId: string, userId: string) {
    const item = await this.repo.findItemByIdAndUser(itemId, userId);
    if (!item) throw new NotFoundException('Item no encontrado');
    await this.repo.removeItem(itemId);
  }
}
