import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn , Index } from 'typeorm';

@Entity('products')
export class ProductOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  tenantId!: string;

  @Column()
  name!: string;

  @Column()
  sku!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  salePrice?: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  stock!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
