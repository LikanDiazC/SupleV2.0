import { Injectable, Inject } from '@nestjs/common';
import type { IItemRepository } from '../../domain/repositories/IItemRepository';
import { Item } from '../../domain/entities/Item';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';

// 1. Definimos qué datos necesitamos recibir desde afuera (el DTO)
export class CreateItemDto {
  name!: string;
  sku!: string;
  type!: string;
  unitOfMeasure!: string;
  unitCost!: number;
  price?: number;
  stock!: number;
  attributes!: Record<string, any>;
}

@Injectable()
export class CreateItemUseCase {
  constructor(
    // Inyectamos el contrato, no la implementación de TypeORM directamente
    @Inject('IItemRepository')
    private readonly itemRepository: IItemRepository,
  ) {}

  async execute(dto: CreateItemDto, tenantId: string): Promise<void> {
    // 2. Creamos el objeto del Dominio (aquí se disparan las validaciones de Item.ts)
    const item = Item.create({
      ...dto,
      tenantId: new TenantId(tenantId),
    });

    // 3. Le ordenamos al repositorio que lo guarde en la BD
    await this.itemRepository.save(item);
  }

  
}
