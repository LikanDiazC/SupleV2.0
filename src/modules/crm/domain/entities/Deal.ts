import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export type DealStage = 'NUEVO' | 'REUNION_AGENDADA' | 'PROPUESTA_ENVIADA' | 'GANADO' | 'PERDIDO';

// 👇 NUEVO: Definimos qué es un "Item" dentro de una venta
export interface DealItem {
  productId: UniqueId;
  quantity: number;
}

export interface DealProps {
  tenantId: TenantId;
  name: string;             
  amount: number;           
  stage: DealStage;
  companyId?: UniqueId | null; 
  contactId?: UniqueId | null; 
  assignedUserId: UniqueId;    
  items: DealItem[]; // 👈 NUEVO: El "carrito de compras" del negocio
  createdAt: Date;
  updatedAt: Date;
}

export class Deal {
  private constructor(
    public readonly id: UniqueId,
    private _props: DealProps,
  ) {}

  public static create(props: Omit<DealProps, 'createdAt' | 'updatedAt' | 'stage'>, id?: UniqueId): Deal {
    return new Deal(id ?? new UniqueId(), {
      ...props,
      items: props.items || [], // Si no mandan productos, inicia vacío
      stage: 'NUEVO', 
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static load(props: DealProps, id: UniqueId): Deal {
    return new Deal(id, props);
  }

  // Getters
  get tenantId() { return this._props.tenantId; }
  get name() { return this._props.name; }
  get amount() { return this._props.amount; }
  get stage() { return this._props.stage; }
  get companyId() { return this._props.companyId; }
  get contactId() { return this._props.contactId; }
  get assignedUserId() { return this._props.assignedUserId; }
  get items() { return this._props.items; } // 👈 NUEVO
  get createdAt() { return this._props.createdAt; }
  get updatedAt() { return this._props.updatedAt; }

  // Comportamientos
  public changeStage(newStage: DealStage): void {
    this._props.stage = newStage;
    this._props.updatedAt = new Date();
  }
}