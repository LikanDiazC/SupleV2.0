import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, UpdateDateColumn, Index, Unique,
} from 'typeorm';
import { MarketplaceCartItemOrmEntity } from './MarketplaceCartItemOrmEntity';

@Unique(['userId'])
@Entity('marketplace_carts')
export class MarketplaceCartOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  userId!: string;

  @Index()
  @Column('uuid')
  tenantId!: string;

  @OneToMany(() => MarketplaceCartItemOrmEntity, (item) => item.cart, {
    cascade: true,
    eager: true,
  })
  items!: MarketplaceCartItemOrmEntity[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
