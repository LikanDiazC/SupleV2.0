import {
  Controller, Get, Post, Patch, Delete,
  Query, Body, Param, Req, UseGuards,
  ParseIntPipe, DefaultValuePipe, BadRequestException, NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';
import { GetMarketplaceProductsUseCase } from '../application/use-cases/GetMarketplaceProductsUseCase';
import { GetMarketplaceCartUseCase } from '../application/use-cases/GetMarketplaceCartUseCase';
import { AddToCartUseCase } from '../application/use-cases/AddToCartUseCase';
import { UpdateCartItemUseCase } from '../application/use-cases/UpdateCartItemUseCase';
import { RemoveCartItemUseCase } from '../application/use-cases/RemoveCartItemUseCase';
import { ClearCartUseCase } from '../application/use-cases/ClearCartUseCase';
import { AddCartItemDto } from './dto/AddCartItemDto';
import { UpdateCartItemDto } from './dto/UpdateCartItemDto';

@Controller('marketplace')
export class MarketplaceController {
  constructor(
    private readonly getProducts: GetMarketplaceProductsUseCase,
    private readonly getCart: GetMarketplaceCartUseCase,
    private readonly addToCart: AddToCartUseCase,
    private readonly updateItem: UpdateCartItemUseCase,
    private readonly removeItem: RemoveCartItemUseCase,
    private readonly clearCart: ClearCartUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('products')
  async findProducts(
    @Query('search') search?: string,
    @Query('tienda') tienda?: string,
    @Query('categoria') categoria?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.getProducts.execute({ search, tienda, categoria, page, limit });
  }

  @UseGuards(JwtAuthGuard)
  @Get('cart')
  async getMyCart(@Req() req: Request) {
    const user = req['user'] as any;
    const cart = await this.getCart.execute(user.sub || user.id);
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }
    return cart;
  }

  @UseGuards(JwtAuthGuard)
  @Post('cart/items')
  async addItem(@Body() body: AddCartItemDto, @Req() req: Request) {
    const user = req['user'] as any;
    return this.addToCart.execute(user.sub || user.id, user.tenantId, body.productId, body.quantity);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('cart/items/:id')
  async updateCartItem(@Param('id') id: string, @Body() body: UpdateCartItemDto, @Req() req: Request) {
    const user = req['user'] as any;
    await this.updateItem.execute(id, user.sub || user.id, body.quantity);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart/items/:id')
  async removeCartItem(@Param('id') id: string, @Req() req: Request) {
    const user = req['user'] as any;
    await this.removeItem.execute(id, user.sub || user.id);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart/items')
  async clearByStore(@Query('tienda') tienda: string, @Req() req: Request) {
    if (!tienda) throw new BadRequestException('Se requiere el parámetro tienda');
    const user = req['user'] as any;
    await this.clearCart.executeByStore(user.sub || user.id, tienda);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cart')
  async clearAll(@Req() req: Request) {
    const user = req['user'] as any;
    await this.clearCart.executeAll(user.sub || user.id);
    return { ok: true };
  }
}
