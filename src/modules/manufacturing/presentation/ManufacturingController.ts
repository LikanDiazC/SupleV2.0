import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';
import { CreateBillOfMaterialsUseCase, CreateBomDto } from '../application/use-cases/CreateBillOfMaterialsUseCase';
import { ManufactureProductUseCase, ManufactureRequestDto } from '../application/use-cases/ManufactureProductUseCase';

@Controller('boms') // La URL será: http://localhost:3000/boms
export class ManufacturingController {
  constructor(
    private readonly createBomUseCase: CreateBillOfMaterialsUseCase,
    private readonly manufactureProductUseCase: ManufactureProductUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createBom(@Body() dto: CreateBomDto, @Req() request: Request) {
    const userPayload = request['user'] as any; // Extraemos el token
    
    await this.createBomUseCase.execute(userPayload.tenantId, dto);
    
    return { message: '¡Receta (BOM) creada con éxito! La fábrica está lista para producir.' };
  }
  
  @UseGuards(JwtAuthGuard)
  @Post('manufacture') // URL: http://localhost:3000/boms/manufacture
  async manufacture(@Body() dto: ManufactureRequestDto, @Req() request: Request) {
    const userPayload = request['user'] as any;
    const userId = userPayload.sub || userPayload.id;

    await this.manufactureProductUseCase.execute(userPayload.tenantId, userId, dto);

    return { 
      message: `¡Producción exitosa! Se han fabricado ${dto.quantity} unidades. El inventario ha sido actualizado automáticamente.` 
    };
  }
}