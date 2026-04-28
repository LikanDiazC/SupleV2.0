import { Entity, PrimaryColumn, Column , Index } from 'typeorm';

@Entity('bom_components')
export class BomComponentOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  bomId!: string;

  @Column('uuid')
  materialId!: string;

  @Column('decimal', { precision: 10, scale: 4 })
  quantity!: number;

  // Dimensiones de pieza — solo para materiales SHEET
  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  pieceWidthMm?: number;

  @Column('decimal', { precision: 8, scale: 2, nullable: true })
  pieceHeightMm?: number;

  @Column({ type: 'varchar', length: 10, nullable: true, default: 'ANY' })
  grainRequirement?: string; // FOLLOW | CROSS | ANY

  @Column({ type: 'varchar', length: 150, nullable: true })
  pieceLabel?: string;
}
