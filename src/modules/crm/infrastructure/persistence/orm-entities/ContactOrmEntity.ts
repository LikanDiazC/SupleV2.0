import { Entity, PrimaryColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CompanyOrmEntity } from './CompanyOrmEntity';

@Entity('crm_contacts')
export class ContactOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid', { nullable: true })
  companyId!: string | null;

  @Column()
  email!: string;

  @Column()
  name!: string;

  @Column('varchar', { length: 100, nullable: true }) // 👈 NUEVA COLUMNA
  personality!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  // Relación opcional en base de datos para poder traer la empresa fácilmente luego
  @ManyToOne(() => CompanyOrmEntity, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company!: CompanyOrmEntity;
}