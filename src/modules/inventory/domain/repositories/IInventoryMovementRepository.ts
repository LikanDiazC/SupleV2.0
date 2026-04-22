import { InventoryMovement } from '../entities/InventoryMovement';

export interface IInventoryMovementRepository {
  // Solo necesitamos guardar. Los movimientos no se editan ni se borran.
  save(movement: InventoryMovement): Promise<void>;
  findByItemId(itemId: string, tenantId: string): Promise<InventoryMovement[]>;
}