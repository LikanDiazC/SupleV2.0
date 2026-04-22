import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('orders')
export class OrderOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  // Referencia externa (Shopify ID, Falabella ID, etc.)
  @Column('varchar', { unique: true })
  externalReference!: string;

  @Column('varchar')
  customerName!: string;

  // Nodo actual del flujo (ORDER_RECEIVED, IN_PRODUCTION, etc.)
  @Column('varchar', { length: 50 })
  status!: string;

  // Lista de items: [{ productId: "uuid", quantity: 5 }, ...]
  @Column('jsonb')
  items!: any[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}