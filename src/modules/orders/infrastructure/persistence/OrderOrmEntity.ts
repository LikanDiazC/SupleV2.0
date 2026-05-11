import {
  Entity, PrimaryColumn, Column,
  CreateDateColumn, UpdateDateColumn, Index, Unique,
} from 'typeorm';

@Unique(['tenantId', 'externalReference'])
@Entity('orders')
export class OrderOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  tenantId!: string;

  @Column('varchar')
  externalReference!: string;

  @Column('varchar')
  customerName!: string;

  @Column('varchar', { length: 50 })
  status!: string;

  @Column('jsonb')
  items!: any[];

  @Column('varchar', { nullable: true })
  orderType!: string | null;

  @Column('text', { nullable: true })
  description!: string | null;

  @Column('date', { nullable: true })
  fechaConfeccion!: string | null;

  @Column('date', { nullable: true })
  fechaEntrega!: string | null;

  @Column('varchar', { nullable: true })
  horario!: string | null;

  @Column('varchar', { nullable: true })
  comuna!: string | null;

  @Column('varchar', { nullable: true })
  color!: string | null;

  @Column('varchar', { nullable: true })
  mesVenta!: string | null;

  @Column('jsonb', { nullable: true })
  extraData!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
