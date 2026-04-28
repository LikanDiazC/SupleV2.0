import { Entity, PrimaryColumn, Column, CreateDateColumn , Index } from 'typeorm';

@Entity('inventory_movements')
export class InventoryMovementOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  itemId!: string; // UUID de la entidad movida (material, product o remnant)

  @Column('uuid')
  userId!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: string; // IN | OUT

  @Column('numeric', { precision: 10, scale: 2 })
  quantity!: number;

  @Column('varchar')
  reason!: string;

  // Discriminador: qué tabla referencia itemId
  @Column({ type: 'varchar', length: 20, nullable: true, default: 'ITEM' })
  entityType?: string; // MATERIAL | PRODUCT | REMNANT | ITEM (legacy)

  @CreateDateColumn()
  createdAt!: Date;
}
