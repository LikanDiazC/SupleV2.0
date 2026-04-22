import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export interface CompanyProps {
  tenantId: TenantId;
  domain: string; // Ej: "constructora-alfa.com" (Este es el campo clave)
  name: string;   // Ej: "Constructora Alfa"
  createdAt: Date;
}

export class Company {
  private constructor(
    private readonly _id: UniqueId,
    private _props: CompanyProps,
  ) {}

  public static create(props: Omit<CompanyProps, 'createdAt'>, id?: UniqueId): Company {
    return new Company(id ?? new UniqueId(), {
      ...props,
      createdAt: new Date(),
    });
  }

  // Getters
  get id(): UniqueId { return this._id; }
  get tenantId(): TenantId { return this._props.tenantId; }
  get domain(): string { return this._props.domain; }
  get name(): string { return this._props.name; }
}