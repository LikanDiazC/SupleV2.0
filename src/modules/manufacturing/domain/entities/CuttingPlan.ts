import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

export interface PlacedPiece {
  label:    string;
  x:        number;
  y:        number;
  width:    number;
  height:   number;
  rotated:  boolean;
}

export interface SheetLayout {
  sheetIndex: number;
  pieces:     PlacedPiece[];
}

export interface RemnantResult {
  sheetIndex: number;
  x:          number;
  y:          number;
  widthMm:    number;
  heightMm:   number;
}

interface CuttingPlanProps {
  tenantId:     TenantId;
  orderId:      UniqueId;
  materialId:   UniqueId;
  sheetsUsed:   number;
  wastePercent: number;
  layouts:      SheetLayout[];
  remnants:     RemnantResult[];
  createdAt:    Date;
}

export class CuttingPlan {
  private constructor(
    public readonly id: UniqueId,
    private readonly props: CuttingPlanProps,
  ) {}

  public static create(
    props: Omit<CuttingPlanProps, 'createdAt'>,
    id?: UniqueId,
  ): CuttingPlan {
    return new CuttingPlan(id ?? new UniqueId(), { ...props, createdAt: new Date() });
  }

  public static load(props: CuttingPlanProps, id: UniqueId): CuttingPlan {
    return new CuttingPlan(id, props);
  }

  get tenantId()     { return this.props.tenantId; }
  get orderId()      { return this.props.orderId; }
  get materialId()   { return this.props.materialId; }
  get sheetsUsed()   { return this.props.sheetsUsed; }
  get wastePercent() { return this.props.wastePercent; }
  get layouts()      { return this.props.layouts; }
  get remnants()     { return this.props.remnants; }
  get createdAt()    { return this.props.createdAt; }
}
