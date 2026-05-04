import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { MarketplaceCartOrmEntity } from './MarketplaceCartOrmEntity';
import { MarketplaceProductOrmEntity } from './MarketplaceProductOrmEntity';

@Entity('marketplace_cart_items')
export class MarketplaceCartItemOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid')
  cartId!: string;

  @ManyToOne(() => MarketplaceCartOrmEntity, (cart) => cart.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cartId' })
  cart!: MarketplaceCartOrmEntity;

  @Column('uuid')
  productId!: string;

  @ManyToOne(() => MarketplaceProductOrmEntity, { eager: true })
  @JoinColumn({ name: 'productId' })
  product!: MarketplaceProductOrmEntity;

  @Column('integer')
  quantity!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
