import { Controller, Post, Body, Req, UseGuards, Query, Get, Param, Patch } from '@nestjs/common';
import type { Request } from 'express';
import { CreateItemUseCase, CreateItemDto } from '../application/use-cases/CreateItemUseCase';
// ⚠️ Nota: Revisa que la ruta a tu guardia apunte correctamente al módulo IAM
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';
import { GetItemsUseCase } from '../application/use-cases/GetItemsUseCase';
import { ConsumeItemStockUseCase, ConsumeItemStockDto } from '../application/use-cases/ConsumeItemStockUseCase';
import { ReceiveItemStockUseCase, ReceiveItemStockDto } from '../application/use-cases/ReceiveItemStockUseCase';
import { GetItemMovementsUseCase } from '../application/use-cases/GetItemMovementsUseCase';

@Controller('items') // La ruta será http://localhost:3000/items
export class InventoryController {
  constructor(
    private readonly createItemUseCase: CreateItemUseCase,
    private readonly getItemsUseCase: GetItemsUseCase,
    private readonly consumeItemStockUseCase: ConsumeItemStockUseCase,
    private readonly receiveItemStockUseCase: ReceiveItemStockUseCase,
    private readonly getItemMovementsUseCase: GetItemMovementsUseCase,
  ) {}

  // Ponemos a nuestro guardia para que solo usuarios logueados puedan registrar inventario
  @UseGuards(JwtAuthGuard)
  @Post()
  async createItem(@Body() dto: CreateItemDto, @Req() request: Request) {
    // 1. Extraemos los datos del Gafete (Token) que el guardia ya validó
    const userPayload = request['user'] as any;
    
    // 2. Le pasamos el JSON del body y el ID de la empresa (Tenant) al Gerente
    await this.createItemUseCase.execute(dto, userPayload.tenantId);
    
    return { message: '¡Artículo registrado en el inventario con éxito!' };
  }
  //////////////////////////////////
  @UseGuards(JwtAuthGuard)
  @Get()
  async getItems(@Req() request: Request, @Query('type') type?: string) {
    const userPayload = request['user'] as any;
    
    // Solo pasamos el tenantId del token para garantizar privacidad
    const items = await this.getItemsUseCase.execute(userPayload.tenantId, type);
    
    // Retornamos los items (NestJS los convertirá a JSON automáticamente)
    return items;
  }
  ////////////////////////////////
 @UseGuards(JwtAuthGuard)
  @Patch(':id/consume')
  async consumeStock(
    @Param('id') itemId: string, 
    @Body() dto: ConsumeItemStockDto, 
    @Req() request: Request
  ) {
    const userPayload = request['user'] as any;
    // 👇 Usualmente el ID del usuario viaja en la propiedad 'sub' o 'id' del Token JWT
    const userId = userPayload.sub || userPayload.id; 
    
    // 👇 Pasamos el userId al caso de uso
    await this.consumeItemStockUseCase.execute(itemId, userPayload.tenantId, userId, dto);
    
    return { message: '¡Material consumido con éxito! El movimiento quedó registrado.' };
  }
////////////////////////
  @UseGuards(JwtAuthGuard)
  @Patch(':id/receive')
  async receiveStock(
    @Param('id') itemId: string, 
    @Body() dto: ReceiveItemStockDto, 
    @Req() request: Request
  ) {
    const userPayload = request['user'] as any;
    const userId = userPayload.sub || userPayload.id; 
    
    // 👇 Pasamos el userId al caso de uso
    await this.receiveItemStockUseCase.execute(itemId, userPayload.tenantId, userId, dto);
    
    return { message: '¡Material recibido con éxito! El movimiento quedó registrado.' };
  }
////////////////////////
  @UseGuards(JwtAuthGuard)
  @Get(':id/movements')
  async getMovements(@Param('id') itemId: string, @Req() request: Request) {
    const userPayload = request['user'] as any;
    return await this.getItemMovementsUseCase.execute(itemId, userPayload.tenantId);
  }
}
