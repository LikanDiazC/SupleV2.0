import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export type MovementType       = 'IN' | 'OUT';
export type MovementEntityType = 'MATERIAL' | 'PRODUCT' | 'REMNANT' | 'ITEM';

interface InventoryMovementProps {
  tenantId:    TenantId;
  itemId:      UniqueId;           // UUID de la entidad que se movió
  userId:      UniqueId;
  type:        MovementType;
  quantity:    number;
  reason:      string;
  entityType?: MovementEntityType; // qué tabla referencia itemId
  createdAt:   Date;
}

export class InventoryMovement {
  private constructor(
    public readonly id: UniqueId,
    private readonly props: InventoryMovementProps,
  ) {}

  public static create(
    props: Omit<InventoryMovementProps, 'createdAt'>,
    id?: UniqueId,
  ): InventoryMovement {
    if (props.quantity <= 0) {
      throw new Error('La cantidad del movimiento debe ser mayor a cero.');
    }
    return new InventoryMovement(id ?? new UniqueId(), { ...props, createdAt: new Date() });
  }

  public static load(props: InventoryMovementProps, id: UniqueId): InventoryMovement {
    return new InventoryMovement(id, props);
  }

  get tenantId()   { return this.props.tenantId; }
  get itemId()     { return this.props.itemId; }
  get userId()     { return this.props.userId; }
  get type()       { return this.props.type; }
  get quantity()   { return this.props.quantity; }
  get reason()     { return this.props.reason; }
  get entityType() { return this.props.entityType; }
  get createdAt()  { return this.props.createdAt; }
}
