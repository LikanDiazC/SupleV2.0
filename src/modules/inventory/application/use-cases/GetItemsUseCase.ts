import { Injectable, Inject } from '@nestjs/common';
import type { IItemRepository } from '../../domain/repositories/IItemRepository';

// 1. Definimos cómo queremos que se vea el JSON final (Limpio y plano)
export interface ItemResponseDto {
  id: string;
  tenantId: string;
  name: string;
  sku: string;
  type: string;
  unitOfMeasure: string;
  stock: number;
  unitCost: number;
  price?: number;
  attributes: Record<string, any>;
}

@Injectable()
export class GetItemsUseCase {
  constructor(
    @Inject('IItemRepository')
    private readonly itemRepository: IItemRepository,
  ) {}

  // 2. Cambiamos la promesa para que devuelva nuestro nuevo DTO limpio
  async execute(tenantId: string, type?: string): Promise<ItemResponseDto[]> {
    // Obtenemos los artículos crudos de la base de datos (con sus _id y props)
    const items = await this.itemRepository.findAll(tenantId, type);

    // 3. Mapeamos (transformamos) cada 'Item' complejo en un objeto plano y simple
    return items.map(item => {
      return {
        id: item.id.value,               // Sacamos el valor real del UniqueId
        tenantId: item.tenantId.value,   // Sacamos el valor real del TenantId
        name: item.name,                 // Usamos los getters limpios
        sku: item.sku,
        type: item.type,
        unitOfMeasure: item.unitOfMeasure,
        stock: item.stock,
        unitCost: item.unitCost,
        price: item.price,
        attributes: item.attributes,
      };
    });
  }
}