import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('marketplace_products')
export class MarketplaceProductOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ length: 20 })
  tienda!: string;

  @Index()
  @Column({ length: 100 })
  sku!: string;

  @Column({ length: 200, nullable: true })
  marca?: string;

  @Column('text')
  titulo!: string;

  @Column('text')
  urlProducto!: string;

  @Column({ type: 'text', nullable: true })
  urlImagen?: string;

  @Column({ type: 'integer', nullable: true })
  precioCLP?: number;

  @Column({ type: 'integer', nullable: true })
  precioNormalCLP?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  descuentoPct?: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating?: number;

  @Column({ type: 'jsonb', nullable: true })
  categorias?: { cat1?: string; cat2?: string; cat3?: string; cat4?: string };

  @Column({ type: 'jsonb', nullable: true })
  atributos?: Record<string, unknown>;

  @Column({ length: 20, nullable: true })
  disponibilidad?: string;

  @CreateDateColumn()
  createdAt!: Date;
}
