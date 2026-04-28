import { Entity, PrimaryColumn, Column, CreateDateColumn , Index } from 'typeorm';

@Entity('cutting_plans')
export class CuttingPlanOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  orderId!: string;

  @Column('uuid')
  materialId!: string;

  @Column('integer')
  sheetsUsed!: number;

  @Column('decimal', { precision: 5, scale: 2 })
  wastePercent!: number;

  // Layouts y retazos para visualización futura
  @Column({ type: 'jsonb', default: [] })
  layouts!: any[];

  @Column({ type: 'jsonb', default: [] })
  remnants!: any[];

  @CreateDateColumn()
  createdAt!: Date;
}
