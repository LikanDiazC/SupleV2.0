import { Entity } from '../../../../shared/kernel/Entity';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId'; 

// 1. Definimos las propiedades del Artículo Genérico
export interface ItemProps {
  tenantId: TenantId;
  name: string;             // ej: "Madera de Roble", "Anillo de Oro", "Camiseta"
  sku: string;              // Código único (ej: MAD-ROB-001)
  type: string;             // ej: 'RAW_MATERIAL' (Insumo) o 'FINISHED_GOOD' (Para vender)
  
  // 📏 Cómo lo contamos en la bodega:
  unitOfMeasure: string;    // ej: 'UNIDADES', 'LITROS', 'GRAMOS', 'PULGADAS'
  stock: number;            
  
  // 💰 Costos y Precios:
  unitCost: number;         // Cuánto nos costó fabricarlo/comprarlo
  price?: number;           // En cuánto lo vendemos (opcional, un insumo no se vende)
  
  // 🪄 EL SUPERPODER: Atributos Dinámicos
  // Aquí podemos guardar un objeto libre con lo que la empresa quiera
  attributes: Record<string, any>; 
}

export class Item extends Entity<ItemProps> {
  private constructor(props: ItemProps, id?: UniqueId) {
    super(props, id);
  }

  get tenantId(): TenantId { return this.props.tenantId; }
  get name(): string { return this.props.name; }
  get sku(): string { return this.props.sku; }
  get type(): string { return this.props.type; }
  get unitOfMeasure(): string { return this.props.unitOfMeasure; }
  get stock(): number { return this.props.stock; }
  get unitCost(): number { return this.props.unitCost; }
  get price(): number | undefined { return this.props.price; }
  get attributes(): Record<string, any> { return this.props.attributes; }

  // Fábrica para crear un nuevo artículo
  public static create(props: ItemProps, id?: UniqueId): Item {
    if (props.stock < 0) throw new Error('El stock inicial no puede ser negativo.');
    if (props.unitCost < 0) throw new Error('El costo no puede ser negativo.');
    
    return new Item({ 
      ...props,
      // Si no nos mandan atributos, iniciamos con un objeto vacío
      attributes: props.attributes ?? {} 
    }, id);
  }

  // Comportamientos de Inventario
  public addStock(quantity: number): void {
    if (quantity <= 0) throw new Error('La cantidad debe ser mayor a cero.');
    this.props.stock += quantity;
  }

  public removeStock(quantity: number): void {
    if (quantity <= 0) throw new Error('La cantidad debe ser mayor a cero.');
    if (this.props.stock - quantity < 0) {
      throw new Error(`Stock insuficiente de ${this.props.name}. Solo hay ${this.props.stock} ${this.props.unitOfMeasure}.`);
    }
    this.props.stock -= quantity;
  }
}