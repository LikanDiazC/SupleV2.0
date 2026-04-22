import { Injectable, Inject } from '@nestjs/common';
import type { IInventoryMovementRepository } from '../../domain/repositories/IInventoryMovementRepository';

// DTO de respuesta limpio para el Frontend
export interface MovementResponseDto {
  id: string;
  type: string;
  quantity: number;
  reason: string;
  createdAt: Date;
  userId: string;
}

@Injectable()
export class GetItemMovementsUseCase {
  constructor(
    @Inject('IInventoryMovementRepository')
    private readonly movementRepository: IInventoryMovementRepository,
  ) {}

  async execute(itemId: string, tenantId: string): Promise<MovementResponseDto[]> {
    const movements = await this.movementRepository.findByItemId(itemId, tenantId);

    // Mapeamos el molde complejo a un JSON plano y amigable
    return movements.map(mov => ({
      id: mov.id.value,
      type: mov.type,
      quantity: mov.quantity,
      reason: mov.reason,
      createdAt: mov.createdAt,
      userId: mov.userId.value, // Le enviamos el ID de quien hizo el movimiento
    }));
  }
}