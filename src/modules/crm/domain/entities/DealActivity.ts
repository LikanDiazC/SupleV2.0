import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export type ActivityType = 'NOTA_MANUAL' | 'CAMBIO_ESTADO' | 'EMAIL_VINCULADO' | 'AI_SUMMARY' | 'SISTEMA';

export interface DealActivityProps {
  tenantId: TenantId;
  dealId: UniqueId;
  userId: UniqueId;     // Quién hizo la acción (Puede ser un humano o la IA en el futuro)
  type: ActivityType;   
  content: string;      // El texto de la nota o resumen
  createdAt: Date;
}

export class DealActivity {
  private constructor(
    public readonly id: UniqueId,
    private _props: DealActivityProps,
  ) {}

  public static create(props: Omit<DealActivityProps, 'createdAt'>, id?: UniqueId): DealActivity {
    return new DealActivity(id ?? new UniqueId(), {
      ...props,
      createdAt: new Date(),
    });
  }

  public static load(props: DealActivityProps, id: UniqueId): DealActivity {
    return new DealActivity(id, props);
  }

  get tenantId() { return this._props.tenantId; }
  get dealId() { return this._props.dealId; }
  get userId() { return this._props.userId; }
  get type() { return this._props.type; }
  get content() { return this._props.content; }
  get createdAt() { return this._props.createdAt; }
}