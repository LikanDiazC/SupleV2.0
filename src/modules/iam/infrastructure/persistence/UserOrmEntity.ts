import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TenantOrmEntity } from '../../../tenant/infrastructure/persistence/TenantOrmEntity';

// 1. @Entity le dice a TypeORM: "Crea una tabla en Postgres llamada 'users' usando esta clase"
@Entity('users')
export class UserOrmEntity {
  
  // 2. @PrimaryColumn le dice que este es el ID principal y que será un UUID
  @PrimaryColumn('uuid')
  id!: string;

  // 3. @Column crea una columna normal. Le decimos que el email debe ser único (no pueden haber dos iguales)
  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column()
  tenantId!: string;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.users)
  @JoinColumn({ name: 'tenantId' }) // Le decimos que esta relación usa la columna de arriba
  tenant!: TenantOrmEntity;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 'USER' })
  role!: string;

  @ManyToOne(() => TenantOrmEntity, (tenant) => tenant.users)

  // 4. Estas son "columnas mágicas" de TypeORM que guardan automáticamente la fecha de creación y de última modificación.
  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}