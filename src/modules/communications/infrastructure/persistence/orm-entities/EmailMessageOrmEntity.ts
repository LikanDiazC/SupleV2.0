import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('comms_email_messages')
export class EmailMessageOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  tenantId!: string;

  @Column('uuid')
  userId!: string; // 👈 El dueño privado de este correo

  @Column({ unique: true })
  externalMessageId!: string; // 👈 El ID de Google (para no guardar el mismo correo 2 veces)

  @Column({ nullable: true })
  threadId!: string;

  @Column()
  sender!: string;

  @Column({ nullable: true })
  recipient!: string;

  @Column()
  subject!: string;

  @Column('text')
  bodySnippet!: string;

  @Column('text', { nullable: true })
  bodyHtml!: string;

  @Column('timestamp', { nullable: true })
  receivedAt!: Date;

  @Column({ default: false })
  isProcessed!: boolean;

  @Column('uuid', { nullable: true })
  linkedContactId!: string | null; // 👈 Aquí guardaremos el ID de Juan Pérez (el Contacto del CRM)

  @CreateDateColumn()
  createdAt!: Date;
}