import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('tenant_config')
export class TenantConfigOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column('uuid', { unique: true })
  tenantId!: string;

  @Column('jsonb', { default: [] })
  orderTypes!: string[];

  @Column('jsonb', { default: [] })
  orderStatuses!: any[];

  @Column('jsonb', { default: [] })
  extraFields!: any[];

  @Column('jsonb', { default: [] })
  notifSteps!: any[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
