import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('crm_companies')
export class CompanyOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column()
  domain!: string;

  @Column()
  name!: string;

  @CreateDateColumn()
  createdAt!: Date;
}