import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export type GrainRequirement = 'FOLLOW' | 'CROSS' | 'ANY';

// FOLLOW: la veta corre a lo largo del alto de la pieza (vertical en la plancha)
// CROSS:  la veta corre a lo largo del ancho de la pieza (horizontal en la plancha)
// ANY:    sin importancia de veta (MDF liso, fondos de closet, etc.)

interface BomComponentProps {
  tenantId:    TenantId;
  bomId:       UniqueId;
  materialId:  UniqueId;
  quantity:    number;

  // Solo para materiales de plancha (SHEET):
  pieceWidthMm?:     number;
  pieceHeightMm?:    number;
  grainRequirement?: GrainRequirement;
  pieceLabel?:       string; // ej: "Lateral izquierdo", "Repisa superior"
}

export class BomComponent {
  private constructor(
    public readonly id: UniqueId,
    private readonly props: BomComponentProps,
  ) {}

  public static create(props: BomComponentProps, id?: UniqueId): BomComponent {
    if (props.quantity <= 0) {
      throw new Error('La cantidad del componente debe ser mayor a cero.');
    }
    if (props.pieceWidthMm !== undefined && props.pieceWidthMm <= 0) {
      throw new Error('El ancho de la pieza debe ser mayor a cero.');
    }
    if (props.pieceHeightMm !== undefined && props.pieceHeightMm <= 0) {
      throw new Error('El alto de la pieza debe ser mayor a cero.');
    }
    return new BomComponent(id ?? new UniqueId(), {
      grainRequirement: 'ANY',
      ...props,
    });
  }

  public static load(props: BomComponentProps, id: UniqueId): BomComponent {
    return new BomComponent(id, props);
  }

  public hasDimensions(): boolean {
    return (
      this.props.pieceWidthMm !== undefined &&
      this.props.pieceHeightMm !== undefined
    );
  }

  get tenantId()         { return this.props.tenantId; }
  get bomId()            { return this.props.bomId; }
  get materialId()       { return this.props.materialId; }
  get quantity()         { return this.props.quantity; }
  get pieceWidthMm()     { return this.props.pieceWidthMm; }
  get pieceHeightMm()    { return this.props.pieceHeightMm; }
  get grainRequirement() { return this.props.grainRequirement ?? 'ANY'; }
  get pieceLabel()       { return this.props.pieceLabel; }
}
