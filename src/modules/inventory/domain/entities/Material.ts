import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export type MaterialType = 'SHEET' | 'HARDWARE' | 'CONSUMABLE';
export type GrainDirection = 'HORIZONTAL' | 'VERTICAL' | 'NONE';

interface MaterialProps {
  tenantId:    TenantId;
  name:        string;
  sku:         string;
  materialType: MaterialType;
  unitOfMeasure: string;
  unitCost:    number;
  stock:       number;

  // Solo para materialType === 'SHEET'
  sheetWidthMm?:       number;
  sheetHeightMm?:      number;
  thicknessMm?:        number;
  grainDirection?:     GrainDirection;
  kerfMm?:             number; // espesor del corte de sierra (default 3.2mm)
  minRemnantAreaMm2?:  number; // área mínima para guardar retazo (default 60000 = 300×200mm)
}

export class Material {
  private constructor(
    public readonly id: UniqueId,
    private readonly props: MaterialProps,
  ) {}

  public static create(props: MaterialProps, id?: UniqueId): Material {
    if (!props.name?.trim())         throw new Error('El nombre es requerido.');
    if (!props.sku?.trim())          throw new Error('El SKU es requerido.');
    if (!props.unitOfMeasure?.trim()) throw new Error('La unidad de medida es requerida.');
    if (props.stock < 0)             throw new Error('El stock inicial no puede ser negativo.');
    if (props.unitCost < 0)          throw new Error('El costo no puede ser negativo.');

    if (props.materialType === 'SHEET') {
      if (!props.sheetWidthMm || !props.sheetHeightMm || !props.thicknessMm) {
        throw new Error('Las planchas requieren ancho, alto y espesor.');
      }
    }

    return new Material(id ?? new UniqueId(), {
      grainDirection:    'NONE',
      kerfMm:            3.2,
      minRemnantAreaMm2: 60000,
      ...props,
    });
  }

  public static load(props: MaterialProps, id: UniqueId): Material {
    return new Material(id, props);
  }

  public addStock(quantity: number): void {
    if (quantity <= 0) throw new Error('La cantidad debe ser mayor a cero.');
    this.props.stock += quantity;
  }

  public removeStock(quantity: number): void {
    if (quantity <= 0) throw new Error('La cantidad debe ser mayor a cero.');
    if (this.props.stock - quantity < 0) {
      throw new Error(
        `Stock insuficiente de "${this.props.name}". Disponible: ${this.props.stock} ${this.props.unitOfMeasure}.`
      );
    }
    this.props.stock -= quantity;
  }

  public isSheet(): boolean {
    return this.props.materialType === 'SHEET';
  }

  get tenantId()           { return this.props.tenantId; }
  get name()               { return this.props.name; }
  get sku()                { return this.props.sku; }
  get materialType()       { return this.props.materialType; }
  get unitOfMeasure()      { return this.props.unitOfMeasure; }
  get unitCost()           { return this.props.unitCost; }
  get stock()              { return this.props.stock; }
  get sheetWidthMm()       { return this.props.sheetWidthMm; }
  get sheetHeightMm()      { return this.props.sheetHeightMm; }
  get thicknessMm()        { return this.props.thicknessMm; }
  get grainDirection()     { return this.props.grainDirection; }
  get kerfMm()             { return this.props.kerfMm ?? 3.2; }
  get minRemnantAreaMm2()  { return this.props.minRemnantAreaMm2 ?? 60000; }
}
