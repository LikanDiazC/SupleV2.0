import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
// ⚠️ Nota: Revisa que esta ruta apunte bien a tu archivo TenantOrmEntity
import { TenantOrmEntity } from '../../../tenant/infrastructure/persistence/TenantOrmEntity';

@Entity('items')
export class ItemOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column()
  name!: string;

  @Column()
  sku!: string;

  @Column()
  type!: string; // 'RAW_MATERIAL' o 'FINISHED_GOOD'

  @Column()
  unitOfMeasure!: string;

  // Usamos 'decimal' en lugar de 'int' porque puedes tener 1.5 Litros o 2.5 Metros
  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  stock!: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  unitCost!: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  price?: number; // Es nullable (opcional) porque los insumos no suelen tener precio de venta

  // 👇 EL SUPERPODER DE POSTGRES: La columna JSONB
  @Column({ type: 'jsonb', default: {} })
  attributes!: Record<string, any>;

  // Candado de seguridad: Llave foránea hacia la tabla de Tenants (Empresas)
  @ManyToOne(() => TenantOrmEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant!: TenantOrmEntity;
}