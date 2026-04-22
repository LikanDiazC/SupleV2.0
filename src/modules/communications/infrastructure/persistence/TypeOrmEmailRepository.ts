import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailMessageOrmEntity } from './orm-entities/EmailMessageOrmEntity';
import { EmailMessage } from '../../domain/entities/EmailMessage';
import type { IEmailRepository } from '../../domain/repositories/IEmailRepository';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

@Injectable()
export class TypeOrmEmailRepository implements IEmailRepository {
  constructor(
    @InjectRepository(EmailMessageOrmEntity)
    private readonly ormRepo: Repository<EmailMessageOrmEntity>,
  ) {}

  async save(email: EmailMessage): Promise<void> {
    const ormEntity = this.ormRepo.create({
      id: email.id.value,
      tenantId: email.tenantId.value,
      userId: email.userId.value,
      externalMessageId: email.externalMessageId,
      threadId: email.threadId,
      sender: email.sender,
      recipient: email.recipient,
      subject: email.subject,
      bodySnippet: email.bodySnippet,
      bodyHtml: email.bodyHtml,
      receivedAt: email.receivedAt,
      isProcessed: email.isProcessed,
      linkedContactId: email.linkedContactId ? email.linkedContactId.value : null,
    });
    
    // Usamos save() para que si el correo ya existe (mismo ID), lo actualice en lugar de duplicarlo
    await this.ormRepo.save(ormEntity);
  }

  async findByExternalId(externalMessageId: string): Promise<EmailMessage | null> {
    const ormEntity = await this.ormRepo.findOne({ where: { externalMessageId } });
    if (!ormEntity) return null;

    const email = EmailMessage.create({
      tenantId: new TenantId(ormEntity.tenantId),
      userId: new UniqueId(ormEntity.userId),
      externalMessageId: ormEntity.externalMessageId,
      threadId: ormEntity.threadId,
      sender: ormEntity.sender,
      recipient: ormEntity.recipient || '',
      subject: ormEntity.subject,
      bodySnippet: ormEntity.bodySnippet,
      bodyHtml: ormEntity.bodyHtml || '',
      receivedAt: ormEntity.receivedAt || new Date(),
      isProcessed: ormEntity.isProcessed,
      linkedContactId: ormEntity.linkedContactId ? new UniqueId(ormEntity.linkedContactId) : undefined,
    }, new UniqueId(ormEntity.id));

    return email;
  }

  async findUnprocessed(tenantId: string): Promise<EmailMessage[]> {
    // Por ahora retornamos vacío para cumplir el contrato, lo implementaremos luego
    return [];
  }
}