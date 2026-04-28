import { Entity, PrimaryColumn, Column, CreateDateColumn , Index } from 'typeorm';

@Entity('crm_companies')
export class CompanyOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  tenantId!: string;

  @Column()
  domain!: string;

  @Column()
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;
}