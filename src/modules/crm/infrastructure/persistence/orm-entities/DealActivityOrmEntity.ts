import { Entity, PrimaryColumn, Column, CreateDateColumn , Index } from 'typeorm';

@Entity('crm_deal_activities')
export class DealActivityOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  dealId!: string;

  @Column('uuid')
  userId!: string; // Quién hizo la nota (Humano o IA)

  @Column('varchar', { length: 50 })
  type!: string;

  @Column('text')
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;
}