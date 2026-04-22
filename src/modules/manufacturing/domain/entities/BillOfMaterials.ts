import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

// Esto representa cada "ingrediente" de la receta
export interface BomComponent {
  itemId: UniqueId; // El ID de la materia prima (Ej: El UUID de tu Tabla de Pino)
  quantity: number; // ¿Cuánto necesitamos para fabricar 1 unidad del producto final?
}

interface BillOfMaterialsProps {
  tenantId: TenantId;
  productId: UniqueId; // El ID del producto terminado (Ej: El UUID de la "Silla")
  name: string;        // Nombre de la receta (Ej: "Ensamblaje Silla Estándar")
  components: BomComponent[];
  createdAt: Date;
  updatedAt: Date;
}

export class BillOfMaterials {
  private constructor(
    public readonly id: UniqueId,
    private readonly props: BillOfMaterialsProps,
  ) {}

  public static create(
    props: Omit<BillOfMaterialsProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueId
  ): BillOfMaterials {
    // Regla de Negocio 1: No puede existir una receta sin ingredientes
    if (!props.components || props.components.length === 0) {
      throw new Error('Una Lista de Materiales (BOM) debe tener al menos un componente.');
    }

    // Regla de Negocio 2: Las cantidades no pueden ser negativas o cero
    const hasInvalidQuantity = props.components.some(c => c.quantity <= 0);
    if (hasInvalidQuantity) {
      throw new Error('La cantidad de todos los componentes debe ser mayor a cero.');
    }

    return new BillOfMaterials(id ?? new UniqueId(), {
      ...props,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Método Load para cuando leamos desde la Base de Datos
  public static load(props: BillOfMaterialsProps, id: UniqueId): BillOfMaterials {
    return new BillOfMaterials(id, props);
  }

  // Getters limpios para exponer los datos
  get tenantId() { return this.props.tenantId; }
  get productId() { return this.props.productId; }
  get name() { return this.props.name; }
  get components() { return this.props.components; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}