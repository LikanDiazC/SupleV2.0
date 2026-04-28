import { Controller, Post, Body, Req, UseGuards, Param, Patch, Get, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';
import { CreateDealUseCase, CreateDealDto } from '../application/use-cases/CreateDealUseCase';
import { MoveDealStageUseCase } from '../application/use-cases/MoveDealStageUseCase';
import { AddDealActivityUseCase, CreateActivityDto } from '../application/use-cases/AddDealActivityUseCase';
import { GetDealsUseCase } from '../application/use-cases/GetDealsUseCase';
import type { DealStage } from '../domain/entities/Deal';

@Controller('crm/deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(
    private readonly createDealUseCase: CreateDealUseCase,
    private readonly moveDealStageUseCase: MoveDealStageUseCase,
    private readonly addDealActivityUseCase: AddDealActivityUseCase,
    private readonly getDealsUseCase: GetDealsUseCase,
  ) {}

  @Post()
  async createDeal(@Body() dto: CreateDealDto, @Req() request: Request) {
    const user = request['user'] as any;
    const userId = user.sub || user.id;
    const dealId = await this.createDealUseCase.execute(user.tenantId, userId, dto);
    return { message: 'Negocio creado exitosamente', dealId };
  }

  @Get()
  async getDeals(
    @Req() request: Request,
    @Query('limit', new DefaultValuePipe(200), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    const user = request['user'] as any;
    return await this.getDealsUseCase.execute(user.tenantId, limit, offset);
  }

  @Patch(':id/stage')
  async moveStage(@Param('id') dealId: string, @Body('stage') newStage: DealStage, @Req() request: Request) {
    const user = request['user'] as any;
    const userId = user.sub || user.id;
    await this.moveDealStageUseCase.execute(user.tenantId, userId, dealId, newStage);
    return { message: `Negocio movido a ${newStage}` };
  }

  @Post(':id/activities')
  async addActivity(@Param('id') dealId: string, @Body() dto: CreateActivityDto, @Req() request: Request) {
    const user = request['user'] as any;
    const userId = user.sub || user.id;
    await this.addDealActivityUseCase.execute(user.tenantId, userId, dealId, dto);
    return { message: 'Nota agregada al negocio' };
  }
}