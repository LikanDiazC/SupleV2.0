import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn , Index } from 'typeorm';

@Entity('materials')
export class MaterialOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  tenantId!: string;

  @Column()
  name!: string;

  @Column()
  sku!: string;

  @Column({ type: 'varchar', length: 20 })
  materialType!: string; // SHEET | HARDWARE | CONSUMABLE

  @Column()
  unitOfMeasure!: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  unitCost!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  stock!: number;

  // Dimensiones de plancha — solo para materialType = 'SHEET'
  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  sheetWidthMm?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  sheetHeightMm?: number;

  @Column('decimal', { precision: 6, scale: 2, nullable: true })
  thicknessMm?: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  grainDirection?: string; // HORIZONTAL | VERTICAL | NONE

  @Column('decimal', { precision: 4, scale: 2, nullable: true, default: 3.2 })
  kerfMm?: number;

  @Column('integer', { nullable: true, default: 60000 })
  minRemnantAreaMm2?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
