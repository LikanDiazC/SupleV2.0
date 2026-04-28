import { Controller, Post, Body, Req, UseGuards, Get, Delete, Param, Query } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';
import { CreateBillOfMaterialsUseCase, CreateBomDto } from '../application/use-cases/CreateBillOfMaterialsUseCase';
import { ManufactureProductUseCase, ManufactureRequestDto } from '../application/use-cases/ManufactureProductUseCase';
import { GetBomsUseCase } from '../application/use-cases/GetBomsUseCase';
import { CreateBomWithComponentsUseCase, CreateBomWithComponentsDto } from '../application/use-cases/CreateBomWithComponentsUseCase';
import { DeleteBomUseCase } from '../application/use-cases/DeleteBomUseCase';
import { PreviewBomCuttingPlanUseCase } from '../application/use-cases/PreviewBomCuttingPlanUseCase';

@Controller('boms')
export class ManufacturingController {
  constructor(
    private readonly createBomUseCase: CreateBillOfMaterialsUseCase,
    private readonly manufactureProductUseCase: ManufactureProductUseCase,
    private readonly getBomsUseCase: GetBomsUseCase,
    private readonly createBomWithComponentsUseCase: CreateBomWithComponentsUseCase,
    private readonly deleteBomUseCase: DeleteBomUseCase,
    private readonly previewBomCuttingPlanUseCase: PreviewBomCuttingPlanUseCase,
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

  @UseGuards(JwtAuthGuard)
  @Get()
  async getBoms(@Req() request: Request) {
    const userPayload = request['user'] as any;
    return await this.getBomsUseCase.execute(userPayload.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteBom(@Param('id') id: string, @Req() request: Request) {
    const userPayload = request['user'] as any;
    await this.deleteBomUseCase.execute(userPayload.tenantId, id);
    return { message: 'BOM eliminado.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':bomId/cutting-preview')
  async getCuttingPreview(
    @Param('bomId') bomId: string,
    @Query('quantity') quantity: string,
    @Req() request: Request,
  ) {
    const userPayload = request['user'] as any;
    const qty = quantity ? parseInt(quantity, 10) : 1;
    return await this.previewBomCuttingPlanUseCase.execute(userPayload.tenantId, bomId, qty);
  }

  @UseGuards(JwtAuthGuard)
  @Post('with-components')
  async createBomWithComponents(
    @Body() dto: CreateBomWithComponentsDto,
    @Req() request: Request,
  ) {
    const userPayload = request['user'] as any;
    await this.createBomWithComponentsUseCase.execute(userPayload.tenantId, dto);
    return { message: 'BOM con componentes creado con éxito.' };
  }
}