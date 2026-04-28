import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';
import { CreateProductUseCase, CreateProductDto } from '../application/use-cases/CreateProductUseCase';
import { GetProductsUseCase } from '../application/use-cases/GetProductsUseCase';

@Controller('products')
export class ProductController {
  constructor(
    private readonly createProduct: CreateProductUseCase,
    private readonly getProducts: GetProductsUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() dto: CreateProductDto, @Req() req: Request) {
    const user = req['user'] as any;
    return await this.createProduct.execute(dto, user.tenantId);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Req() req: Request) {
    const user = req['user'] as any;
    return await this.getProducts.execute(user.tenantId);
  }
}
