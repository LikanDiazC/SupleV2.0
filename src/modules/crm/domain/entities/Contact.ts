import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export interface ContactProps {
  tenantId: TenantId;
  companyId?: UniqueId | null; // A qué empresa pertenece
  email: string;       // Ej: "juan.perez@constructora-alfa.com"
  name: string;        // Ej: "Juan Perez"
  createdAt: Date;
  personality?: string | null;
}

export class Contact {
  private constructor(
    private readonly _id: UniqueId,
    private _props: ContactProps,
  ) {}

  public static create(props: Omit<ContactProps, 'createdAt'>, id?: UniqueId): Contact {
    return new Contact(id ?? new UniqueId(), {
      ...props,
      createdAt: new Date(),
    });
  }

  // Getters
  get id(): UniqueId { return this._id; }
  get tenantId(): TenantId { return this._props.tenantId; }
  get companyId(): UniqueId | null | undefined { return this._props.companyId; }
  get email(): string { return this._props.email; }
  get name(): string { return this._props.name; }
  get personality(): string | null | undefined { return this._props.personality; }

  public updatePersonality(newPersonality: string): void {
    this._props.personality = newPersonality;
  } 
}