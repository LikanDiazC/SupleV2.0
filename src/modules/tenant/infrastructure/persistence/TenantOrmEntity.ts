import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { UserOrmEntity } from '../../../iam/infrastructure/persistence/UserOrmEntity';

@Entity('tenants') // ¡Así se llamará la tabla en pgAdmin!
export class TenantOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  shopifyAccessToken?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany(() => UserOrmEntity, (user) => user.tenant)
  users!: UserOrmEntity[];
}