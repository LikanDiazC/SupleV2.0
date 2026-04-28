import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

interface RemnantProps {
  tenantId:      TenantId;
  materialId:    UniqueId; // plancha origen
  widthMm:       number;
  heightMm:      number;
  stock:         number;   // cuántos retazos de esta medida hay
  sourceOrderId: UniqueId; // orden que generó el retazo
  createdAt:     Date;
}

export class Remnant {
  private constructor(
    public readonly id: UniqueId,
    private readonly props: RemnantProps,
  ) {}

  public static create(
    props: Omit<RemnantProps, 'createdAt'>,
    id?: UniqueId,
  ): Remnant {
    if (props.widthMm <= 0 || props.heightMm <= 0) {
      throw new Error('Las dimensiones del retazo deben ser mayores a cero.');
    }
    if (props.stock <= 0) {
      throw new Error('La cantidad de retazos debe ser mayor a cero.');
    }
    return new Remnant(id ?? new UniqueId(), { ...props, createdAt: new Date() });
  }

  public static load(props: RemnantProps, id: UniqueId): Remnant {
    return new Remnant(id, props);
  }

  get tenantId()      { return this.props.tenantId; }
  get materialId()    { return this.props.materialId; }
  get widthMm()       { return this.props.widthMm; }
  get heightMm()      { return this.props.heightMm; }
  get areaMm2()       { return this.props.widthMm * this.props.heightMm; }
  get stock()         { return this.props.stock; }
  get sourceOrderId() { return this.props.sourceOrderId; }
  get createdAt()     { return this.props.createdAt; }

  addStock(qty: number): void {
    if (qty <= 0) throw new Error('La cantidad a agregar debe ser mayor a cero.');
    this.props.stock += qty;
  }
}
