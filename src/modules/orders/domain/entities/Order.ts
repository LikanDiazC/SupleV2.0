import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

// 👇 Estos son los Nodos de tu flujo de trabajo exacto
export type OrderStatus =
  | 'ORDER_RECEIVED'       // 1. Entra desde Shopify/Falabella
  | 'DESIGN_CONFIRMED'     // 1.5 Diseño confirmado por el cliente
  | 'CHECKING_STOCK'       // 2. Sistema revisando si hay madera
  | 'ON_HOLD_MATERIALS'    // 3. Faltó madera (esperando humano/compras)
  | 'READY_TO_START'       // 4. Hay madera, listo para que el carpintero inicie
  | 'IN_PRODUCTION'        // 5. Humano inicia (AQUÍ se descuenta material)
  | 'MANUFACTURED'         // 6. Humano termina (AQUÍ se suma producto terminado)
  | 'SHIPPED'              // 7. Va en camino al cliente
  | 'DELIVERED';           // 8. Cliente lo recibió

interface OrderItem {
  productId: UniqueId; // ¿Qué pidieron? (Ej: ID de la Silla)
  quantity: number;    // ¿Cuántas?
}

interface OrderProps {
  tenantId: TenantId;
  externalReference: string; // Ej: "SHOPIFY-9942" o "FALABELLA-102"
  customerName: string;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class Order {
  private constructor(
    public readonly id: UniqueId,
    private readonly props: OrderProps,
  ) {}

  public static create(
    props: Omit<OrderProps, 'status' | 'createdAt' | 'updatedAt'>,
    id?: UniqueId
  ): Order {
    if (!props.items || props.items.length === 0) {
      throw new Error('La orden debe tener al menos un producto.');
    }

    return new Order(id ?? new UniqueId(), {
      ...props,
      status: 'ORDER_RECEIVED', // Toda orden nace en este nodo
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public static load(props: OrderProps, id: UniqueId): Order {
    return new Order(id, props);
  }

  // ==========================================
  // ⚙️ MÁQUINA DE ESTADOS (Transiciones de Nodos)
  // ==========================================

  public markAsCheckingStock(): void {
    if (
      this.props.status !== 'ORDER_RECEIVED' &&
      this.props.status !== 'ON_HOLD_MATERIALS' &&
      this.props.status !== 'DESIGN_CONFIRMED'
    ) {
      throw new Error('Solo se puede revisar stock de órdenes nuevas, en espera o con diseño confirmado.');
    }
    this.props.status = 'CHECKING_STOCK';
    this.updateTimestamp();
  }

  public putOnHoldForMaterials(): void {
    if (this.props.status !== 'CHECKING_STOCK') {
      throw new Error('Solo se puede poner en espera tras revisar el stock.');
    }
    this.props.status = 'ON_HOLD_MATERIALS';
    this.updateTimestamp();
  }

  public markAsReadyToStart(): void {
    if (this.props.status !== 'CHECKING_STOCK') {
      throw new Error('Solo se puede marcar lista para iniciar tras validar el stock.');
    }
    this.props.status = 'READY_TO_START';
    this.updateTimestamp();
  }

  public confirmDesign(): void {
    if (this.props.status !== 'ORDER_RECEIVED') {
      throw new Error('Solo se puede confirmar diseño de órdenes recién recibidas.');
    }
    this.props.status = 'DESIGN_CONFIRMED';
    this.updateTimestamp();
  }

  public startProduction(): void {
    if (this.props.status !== 'READY_TO_START') {
      throw new Error('La orden debe estar lista (con materiales) antes de iniciar producción.');
    }
    this.props.status = 'IN_PRODUCTION';
    this.updateTimestamp();
  }

  public markAsManufactured(): void {
    if (this.props.status !== 'IN_PRODUCTION') {
      throw new Error('La orden debe estar en producción para poder marcarse como fabricada.');
    }
    this.props.status = 'MANUFACTURED';
    this.updateTimestamp();
  }

  public shipOrder(): void {
    if (this.props.status !== 'MANUFACTURED') {
      throw new Error('No puedes enviar una orden que no ha sido fabricada.');
    }
    this.props.status = 'SHIPPED';
    this.updateTimestamp();
  }

  public deliverOrder(): void {
    if (this.props.status !== 'SHIPPED') {
      throw new Error('La orden debe estar enviada antes de marcarse como entregada.');
    }
    this.props.status = 'DELIVERED';
    this.updateTimestamp();
  }

  private updateTimestamp(): void {
    this.props.updatedAt = new Date();
  }

  // Getters
  get tenantId() { return this.props.tenantId; }
  get externalReference() { return this.props.externalReference; }
  get customerName() { return this.props.customerName; }
  get items() { return this.props.items; }
  get status() { return this.props.status; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}