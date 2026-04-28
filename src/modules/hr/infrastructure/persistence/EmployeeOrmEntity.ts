import {
  Entity, PrimaryColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

@Entity('employees')
export class EmployeeOrmEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Index()
  @Column('uuid')
  tenantId: string;

  @Column({ type: 'varchar', default: 'EMPLOYEE' })
  hrRole: string;

  @Column({ type: 'uuid', nullable: true })
  managerId: string | null;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column({ type: 'varchar', nullable: true })
  position: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastSeenAt: Date | null;
}
