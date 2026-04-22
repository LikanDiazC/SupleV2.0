import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import type { IBillOfMaterialsRepository } from '../../domain/repositories/IBillOfMaterialsRepository';
import type { IItemRepository } from '../../../inventory/domain/repositories/IItemRepository';
import type { IInventoryMovementRepository } from '../../../inventory/domain/repositories/IInventoryMovementRepository';
import { InventoryMovement } from '../../../inventory/domain/entities/InventoryMovement';
import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TenantId } from '../../../iam/domain/value-objects/TenantId';
import { Item } from '../../../inventory/domain/entities/Item';

export class ManufactureRequestDto {
  productId!: string;
  quantity!: number; // Cuántas sillas queremos fabricar
}

@Injectable()
export class ManufactureProductUseCase {
  constructor(
    @Inject('IBillOfMaterialsRepository')
    private readonly bomRepository: IBillOfMaterialsRepository,
    // 👇 Inyectamos a los gerentes de la bodega
    @Inject('IItemRepository')
    private readonly itemRepository: IItemRepository,
    @Inject('IInventoryMovementRepository')
    private readonly movementRepository: IInventoryMovementRepository,
  ) {}

  async execute(tenantId: string, userId: string, dto: ManufactureRequestDto): Promise<void> {
    // 1. Buscamos la receta
    const bom = await this.bomRepository.findByProductId(dto.productId, tenantId);
    if (!bom) {
      throw new NotFoundException('No existe una receta (BOM) para este producto.');
    }

    // 2. Buscamos el Producto Terminado (La Silla)
    const productItem = await this.itemRepository.findById(dto.productId, tenantId);
    if (!productItem) {
      throw new NotFoundException('El producto a fabricar no existe en el inventario.');
    }

    // Arreglos temporales para guardar todos los cambios al final (si todo sale bien)
    const itemsToUpdate: Item[] = [];
    const movementsToSave: InventoryMovement[] = [];

    try {
      // 3. Procesamos los Ingredientes (Ej: Madera y Tornillos)
      for (const component of bom.components) {
        // ¿Cuánto necesitamos en total? (Cantidad de la receta X Cantidad de sillas a fabricar)
        const totalRequiredQuantity = component.quantity * dto.quantity;
        
        const materialItem = await this.itemRepository.findById(component.itemId.value, tenantId);
        if (!materialItem) {
          throw new NotFoundException(`El material con ID ${component.itemId.value} no existe.`);
        }

        // Le descontamos al molde (si no alcanza, el molde lanzará el error "Stock Insuficiente" y se detiene todo)
        materialItem.removeStock(totalRequiredQuantity);
        itemsToUpdate.push(materialItem);

        // Creamos el registro del historial (Salida de material)
        const outMovement = InventoryMovement.create({
          tenantId: new TenantId(tenantId),
          itemId: component.itemId,
          userId: new UniqueId(userId),
          type: 'OUT',
          quantity: totalRequiredQuantity,
          reason: `Consumo para orden de producción: ${dto.quantity} unidades de ${bom.name}`,
        });
        movementsToSave.push(outMovement);
      }

      // 4. Fabricamos el Producto Terminado (Sumamos las sillas)
      productItem.addStock(dto.quantity);
      itemsToUpdate.push(productItem);

      // Creamos el registro del historial (Entrada de producto terminado)
      const inMovement = InventoryMovement.create({
        tenantId: new TenantId(tenantId),
        itemId: new UniqueId(dto.productId),
        userId: new UniqueId(userId),
        type: 'IN',
        quantity: dto.quantity,
        reason: `Producción terminada mediante receta: ${bom.name}`,
      });
      movementsToSave.push(inMovement);

      // 5. ¡A guardar todo en la Base de Datos!
      for (const item of itemsToUpdate) {
        await this.itemRepository.save(item);
      }
      for (const movement of movementsToSave) {
        await this.movementRepository.save(movement);
      }

    } catch (error: any) {
      // Si a la mitad del proceso descubrimos que falta madera, atrapamos el error y cancelamos.
      throw new BadRequestException(error.message);
    }
  }
}