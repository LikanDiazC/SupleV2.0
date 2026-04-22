import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('inventory_movements') // Este será el nombre de la tabla en Postgres
export class InventoryMovementOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  itemId!: string;

  @Column('uuid')
  userId!: string;

  // Guardaremos 'IN' (Entrada) u 'OUT' (Salida)
  @Column({ type: 'varchar', length: 10 })
  type!: string; 

  // Usamos 'numeric' por si en el futuro la madera se mide en metros (ej: 2.5 metros)
  @Column('numeric', { precision: 10, scale: 2 })
  quantity!: number;

  @Column('varchar')
  reason!: string;

  // TypeORM llenará este campo automáticamente con la fecha y hora exacta
  @CreateDateColumn()
  createdAt!: Date;
}