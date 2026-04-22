import { EmailMessage } from '../entities/EmailMessage';

export interface IEmailRepository {
  save(email: EmailMessage): Promise<void>;
  findByExternalId(externalMessageId: string): Promise<EmailMessage | null>;
  findUnprocessed(tenantId: string): Promise<EmailMessage[]>; // Los que el CRM aún no lee
}