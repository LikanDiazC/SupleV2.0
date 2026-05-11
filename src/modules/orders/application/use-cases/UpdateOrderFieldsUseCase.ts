import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IsString, IsOptional } from 'class-validator';
import type { IOrderRepository } from '../../domain/repositories/IOrderRepository';

export class UpdateOrderFieldsDto {
  @IsOptional() @IsString()
  orderType?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  fechaConfeccion?: string;

  @IsOptional() @IsString()
  fechaEntrega?: string;

  @IsOptional() @IsString()
  horario?: string;

  @IsOptional() @IsString()
  comuna?: string;

  @IsOptional() @IsString()
  color?: string;

  @IsOptional() @IsString()
  mesVenta?: string;
}

@Injectable()
export class UpdateOrderFieldsUseCase {
  constructor(
    @Inject('IOrderRepository')
    private readonly orderRepo: IOrderRepository,
  ) {}

  async execute(tenantId: string, orderId: string, dto: UpdateOrderFieldsDto): Promise<void> {
    const order = await this.orderRepo.findById(orderId, tenantId);
    if (!order) throw new NotFoundException('Orden no encontrada');
    await this.orderRepo.updateFields(orderId, tenantId, dto);
  }
}
