import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export interface EmailMessageProps {
  tenantId: TenantId;
  userId: UniqueId;
  externalMessageId: string; // El ID que le da Google al correo
  threadId: string; // Súper útil para agrupar respuestas (hilos de conversación)
  sender: string; // Ej: "Juan <juan@empresa.com>"
  recipient: string; // A quién se lo mandaron
  subject: string;
  bodySnippet: string; // Un resumen corto
  bodyHtml: string; // El cuerpo completo
  receivedAt: Date;
  isProcessed: boolean; // Para saber si ya lo escaneamos para el CRM
  linkedContactId?: UniqueId;
  dealId?: UniqueId | null;
}

export class EmailMessage {
  private constructor(
    private readonly _id: UniqueId,
    private _props: EmailMessageProps,
  ) {}

  public static create(props: EmailMessageProps, id?: UniqueId): EmailMessage {
    return new EmailMessage(id ?? new UniqueId(), {
      ...props,
      isProcessed: props.isProcessed ?? false,
    });
  }

  // Getters
  get id(): UniqueId { return this._id; }
  get tenantId(): TenantId { return this._props.tenantId; }
  get externalMessageId(): string { return this._props.externalMessageId; }
  get threadId(): string { return this._props.threadId; }
  get sender(): string { return this._props.sender; }
  get recipient(): string { return this._props.recipient; }
  get subject(): string { return this._props.subject; }
  get bodySnippet(): string { return this._props.bodySnippet; }
  get bodyHtml(): string { return this._props.bodyHtml; }
  get receivedAt(): Date { return this._props.receivedAt; }
  get isProcessed(): boolean { return this._props.isProcessed; }
  get userId(): UniqueId { return this._props.userId; }
  get linkedContactId(): UniqueId | undefined { return this._props.linkedContactId; }
  get dealId(): UniqueId | null | undefined { return this._props.dealId; }

  // Comportamientos
public linkToContact(contactId: UniqueId): void {
    this._props.linkedContactId = contactId;
  }

  public linkToDeal(dealId: UniqueId): void { // 👈 NUEVO MÉTODO
    this._props.dealId = dealId;
  }

}