import { Entity, PrimaryColumn, Column, CreateDateColumn , Index } from 'typeorm';

@Entity('remnants')
export class RemnantOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  materialId!: string;

  @Column('decimal', { precision: 8, scale: 2 })
  widthMm!: number;

  @Column('decimal', { precision: 8, scale: 2 })
  heightMm!: number;

  @Column('decimal', { precision: 6, scale: 0, default: 1 })
  stock!: number;

  @Column('uuid')
  sourceOrderId!: string;

  @CreateDateColumn()
  createdAt!: Date;
}
