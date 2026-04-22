import { Item } from '../entities/Item';

export interface IItemRepository{
  // Por ahora, solo le enseñaremos a guardar un artículo nuevo
  save(item: Item): Promise<void>;

  findAll(tenantId: string, type?: string): Promise<Item[]>;
  findById(id: string, tenantId: string): Promise<Item | null>;
  
  // (Más adelante agregaremos aquí el findAll, findById, etc.)
}