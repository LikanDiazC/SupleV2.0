import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('crm_deals')
export class DealOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column()
  name!: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  amount!: number;

  @Column('varchar', { length: 50 })
  stage!: string;

  @Column('uuid', { nullable: true })
  companyId!: string | null;

  @Column('uuid', { nullable: true })
  contactId!: string | null;

  @Column('uuid')
  assignedUserId!: string;

  @Column('jsonb', { default: [] })
  items!: any[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}