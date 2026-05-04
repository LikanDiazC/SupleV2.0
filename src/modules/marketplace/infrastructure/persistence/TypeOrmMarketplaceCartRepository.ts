import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketplaceCartOrmEntity } from './MarketplaceCartOrmEntity';
import { MarketplaceCartItemOrmEntity } from './MarketplaceCartItemOrmEntity';

export interface IMarketplaceCartRepository {
  findByUser(userId: string): Promise<MarketplaceCartOrmEntity | null>;
  createCart(userId: string, tenantId: string): Promise<MarketplaceCartOrmEntity>;
  findItemInCart(cartId: string, productId: string): Promise<MarketplaceCartItemOrmEntity | null>;
  findItemByIdAndUser(itemId: string, userId: string): Promise<MarketplaceCartItemOrmEntity | null>;
  addItem(cartId: string, productId: string, quantity: number): Promise<MarketplaceCartItemOrmEntity>;
  incrementItem(itemId: string, by: number): Promise<MarketplaceCartItemOrmEntity>;
  updateItemQuantity(itemId: string, quantity: number): Promise<void>;
  removeItem(itemId: string): Promise<void>;
  clearByStore(cartId: string, tienda: string): Promise<void>;
  clearAll(cartId: string): Promise<void>;
}

@Injectable()
export class TypeOrmMarketplaceCartRepository implements IMarketplaceCartRepository {
  private readonly logger = new Logger(TypeOrmMarketplaceCartRepository.name);

  constructor(
    @InjectRepository(MarketplaceCartOrmEntity)
    private readonly carts: Repository<MarketplaceCartOrmEntity>,
    @InjectRepository(MarketplaceCartItemOrmEntity)
    private readonly cartItems: Repository<MarketplaceCartItemOrmEntity>,
  ) {}

  findByUser(userId: string) {
    return this.carts.findOne({ where: { userId } });
  }

  async createCart(userId: string, tenantId: string) {
    const cart = this.carts.create({ userId, tenantId, items: [] });
    return this.carts.save(cart);
  }

  findItemInCart(cartId: string, productId: string) {
    return this.cartItems.findOne({ where: { cartId, productId } });
  }

  async findItemByIdAndUser(itemId: string, userId: string): Promise<MarketplaceCartItemOrmEntity | null> {
    return this.cartItems
      .createQueryBuilder('ci')
      .innerJoin('ci.cart', 'cart')
      .where('ci.id = :itemId AND cart.userId = :userId', { itemId, userId })
      .getOne();
  }

  async addItem(cartId: string, productId: string, quantity: number) {
    const item = this.cartItems.create({ cartId, productId, quantity });
    return this.cartItems.save(item);
  }

  async incrementItem(itemId: string, by: number): Promise<MarketplaceCartItemOrmEntity> {
    await this.cartItems
      .createQueryBuilder()
      .update()
      .set({ quantity: () => `quantity + ${by}` })
      .where('id = :id', { id: itemId })
      .execute();
    return this.cartItems.findOneOrFail({ where: { id: itemId } });
  }

  async updateItemQuantity(itemId: string, quantity: number) {
    await this.cartItems.update(itemId, { quantity });
  }

  async removeItem(itemId: string) {
    await this.cartItems.delete(itemId);
  }

  async clearByStore(cartId: string, tienda: string) {
    try {
      await this.cartItems
        .createQueryBuilder()
        .delete()
        .where(
          `"cartId" = :cartId AND "productId" IN (
            SELECT id FROM marketplace_products WHERE tienda = :tienda
          )`,
          { cartId, tienda },
        )
        .execute();
    } catch (err) {
      this.logger.error('clearByStore failed', err);
      throw new InternalServerErrorException('Error al vaciar carrito por tienda');
    }
  }

  async clearAll(cartId: string) {
    await this.cartItems.delete({ cartId });
  }
}
