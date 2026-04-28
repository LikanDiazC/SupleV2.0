import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

interface ProductProps {
  tenantId:    TenantId;
  name:        string;
  sku:         string;
  description?: string;
  salePrice?:  number;
  stock:       number;
}

export class Product {
  private constructor(
    public readonly id: UniqueId,
    private readonly props: ProductProps,
  ) {}

  public static create(props: ProductProps, id?: UniqueId): Product {
    if (props.stock < 0) throw new Error('El stock inicial no puede ser negativo.');
    if (props.salePrice !== undefined && props.salePrice < 0) {
      throw new Error('El precio de venta no puede ser negativo.');
    }
    return new Product(id ?? new UniqueId(), props);
  }

  public static load(props: ProductProps, id: UniqueId): Product {
    return new Product(id, props);
  }

  public addStock(quantity: number): void {
    if (quantity <= 0) throw new Error('La cantidad debe ser mayor a cero.');
    this.props.stock += quantity;
  }

  public removeStock(quantity: number): void {
    if (quantity <= 0) throw new Error('La cantidad debe ser mayor a cero.');
    if (this.props.stock - quantity < 0) {
      throw new Error(
        `Stock insuficiente de "${this.props.name}". Disponible: ${this.props.stock} unidades.`
      );
    }
    this.props.stock -= quantity;
  }

  get tenantId()    { return this.props.tenantId; }
  get name()        { return this.props.name; }
  get sku()         { return this.props.sku; }
  get description() { return this.props.description; }
  get salePrice()   { return this.props.salePrice; }
  get stock()       { return this.props.stock; }
}
