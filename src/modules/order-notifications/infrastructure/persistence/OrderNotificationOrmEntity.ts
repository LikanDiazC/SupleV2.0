import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, Unique } from 'typeorm';

@Unique(['orderId', 'step'])
@Entity('order_notifications')
export class OrderNotificationOrmEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column('uuid')
  orderId!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('varchar')
  step!: string;

  @Column('timestamp')
  markedAt!: Date;

  @Column('uuid')
  markedByUserId!: string;
}
