import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

// Los tipos de movimientos permitidos
export type MovementType = 'IN' | 'OUT';

// Los datos internos de nuestro molde
interface InventoryMovementProps {
  tenantId: TenantId;
  itemId: UniqueId;     // ¿Qué material se movió?
  userId: UniqueId;     // ¿Qué usuario (carpintero/bodeguero) lo movió?
  type: MovementType;   // ¿Entró (IN) o Salió (OUT)?
  quantity: number;     // ¿Cuánto?
  reason: string;       // ¿Por qué? (Ej: "Compra a proveedor", "Orden de trabajo #45")
  createdAt: Date;      // ¿Cuándo exactamente?
}

export class InventoryMovement {
  private constructor(
    public readonly id: UniqueId,
    private readonly props: InventoryMovementProps,
  ) {}

  // Nuestra fábrica de movimientos
  public static create(
    props: Omit<InventoryMovementProps, 'createdAt'>, 
    id?: UniqueId
  ): InventoryMovement {
    // Validamos que no hagan movimientos en cero o negativos
    if (props.quantity <= 0) {
      throw new Error('La cantidad del movimiento debe ser mayor a cero.');
    }

    return new InventoryMovement(
      id ?? new UniqueId(),
      {
        ...props,
        createdAt: new Date(), // El sistema siempre sella la fecha y hora exacta
      }
    );
  }
  // 👇 NUEVO: Este método es solo para reconstruir objetos que ya estaban en la base de datos
  public static load(props: InventoryMovementProps, id: UniqueId): InventoryMovement {
    return new InventoryMovement(id, props);
  }

  // Getters para poder leer los datos desde afuera
  get tenantId() { return this.props.tenantId; }
  get itemId() { return this.props.itemId; }
  get userId() { return this.props.userId; }
  get type() { return this.props.type; }
  get quantity() { return this.props.quantity; }
  get reason() { return this.props.reason; }
  get createdAt() { return this.props.createdAt; }
}