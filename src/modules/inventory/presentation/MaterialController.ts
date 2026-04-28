import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';
import { CreateMaterialUseCase, CreateMaterialDto } from '../application/use-cases/CreateMaterialUseCase';
import { GetMaterialsUseCase } from '../application/use-cases/GetMaterialsUseCase';
import { AddMaterialStockUseCase, AddMaterialStockDto } from '../application/use-cases/AddMaterialStockUseCase';
import { ConsumeMaterialStockUseCase, ConsumeMaterialStockDto } from '../application/use-cases/ConsumeMaterialStockUseCase';
import { GetRemnantsUseCase } from '../application/use-cases/GetRemnantsUseCase';

@Controller('materials')
export class MaterialController {
  constructor(
    private readonly createMaterial: CreateMaterialUseCase,
    private readonly getMaterials: GetMaterialsUseCase,
    private readonly addStock: AddMaterialStockUseCase,
    private readonly consumeStock: ConsumeMaterialStockUseCase,
    private readonly getRemnants: GetRemnantsUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('remnants')
  async findRemnants(@Req() req: Request) {
    const user = req['user'] as any;
    return await this.getRemnants.execute(user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateMaterialDto, @Req() req: Request) {
    const user = req['user'] as any;
    return await this.createMaterial.execute(dto, user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Req() req: Request,
    @Query('type') type?: string,
    @Query('limit', new DefaultValuePipe(200), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    const user = req['user'] as any;
    return await this.getMaterials.execute(user.tenantId, type, limit, offset);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/receive')
  async receive(
    @Param('id') id: string,
    @Body() dto: AddMaterialStockDto,
    @Req() req: Request,
  ) {
    const user = req['user'] as any;
    const userId = user.sub || user.id;
    await this.addStock.execute(id, user.tenantId, userId, dto);
    return { message: 'Stock de material actualizado.' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/consume')
  async consume(
    @Param('id') id: string,
    @Body() dto: ConsumeMaterialStockDto,
    @Req() req: Request,
  ) {
    const user = req['user'] as any;
    const userId = user.sub || user.id;
    await this.consumeStock.execute(id, user.tenantId, userId, dto);
    return { message: 'Material consumido correctamente.' };
  }
}
