import {
  Controller, Post, Body, Req, UseGuards, Param,
  Patch, Get, Query, ParseIntPipe, DefaultValuePipe, Delete,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';
import { ReceiveExternalOrderUseCase, ExternalOrderDto } from '../application/use-cases/ReceiveExternalOrderUseCase';
import { CheckOrderStockUseCase } from '../application/use-cases/CheckOrderStockUseCase';
import { StartOrderProductionUseCase } from '../application/use-cases/StartOrderProductionUseCase';
import { CompleteOrderProductionUseCase } from '../application/use-cases/CompleteOrderProductionUseCase';
import { ShipOrderUseCase } from '../application/use-cases/ShipOrderUseCase';
import { DeliverOrderUseCase } from '../application/use-cases/DeliverOrderUseCase';
import { GetOrdersUseCase } from '../application/use-cases/GetOrdersUseCase';
import { GetOrderByIdUseCase } from '../application/use-cases/GetOrderByIdUseCase';
import { UpdateOrderStatusUseCase, UpdateOrderStatusDto } from '../application/use-cases/UpdateOrderStatusUseCase';
import { MarkNotificationStepUseCase } from '../../order-notifications/application/use-cases/MarkNotificationStepUseCase';
import { UnmarkNotificationStepUseCase } from '../../order-notifications/application/use-cases/UnmarkNotificationStepUseCase';
import { GetOrderNotificationsUseCase } from '../../order-notifications/application/use-cases/GetOrderNotificationsUseCase';

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly receiveExternalOrderUseCase: ReceiveExternalOrderUseCase,
    private readonly checkOrderStockUseCase: CheckOrderStockUseCase,
    private readonly startOrderProductionUseCase: StartOrderProductionUseCase,
    private readonly completeOrderProductionUseCase: CompleteOrderProductionUseCase,
    private readonly shipOrderUseCase: ShipOrderUseCase,
    private readonly deliverOrderUseCase: DeliverOrderUseCase,
    private readonly getOrdersUseCase: GetOrdersUseCase,
    private readonly getOrderByIdUseCase: GetOrderByIdUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly markNotifStepUseCase: MarkNotificationStepUseCase,
    private readonly unmarkNotifStepUseCase: UnmarkNotificationStepUseCase,
    private readonly getOrderNotificationsUseCase: GetOrderNotificationsUseCase,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllOrders(
    @Req() request: Request,
    @Query('limit', new DefaultValuePipe(200), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number,
  ) {
    const userPayload = request['user'] as any;
    return await this.getOrdersUseCase.execute(userPayload.tenantId, limit, offset);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrderById(@Param('id') orderId: string, @Req() request: Request) {
    const userPayload = request['user'] as any;
    return await this.getOrderByIdUseCase.execute(userPayload.tenantId, orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async receiveOrder(@Body() dto: ExternalOrderDto, @Req() request: Request) {
    const userPayload = request['user'] as any;
    const result = await this.receiveExternalOrderUseCase.execute(userPayload.tenantId, dto);
    return {
      message: 'Orden recibida y stock verificado automáticamente.',
      id:        result.id,
      status:    result.status,
      reference: dto.externalReference,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/check-stock')
  async checkStock(@Param('id') orderId: string, @Req() request: Request) {
    const userPayload = request['user'] as any;
    const newStatus = await this.checkOrderStockUseCase.execute(userPayload.tenantId, orderId);
    return { message: 'Evaluación de inventario completada.', status: newStatus };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/start-production')
  async startProduction(@Param('id') orderId: string, @Req() request: Request) {
    const userPayload = request['user'] as any;
    const userId = userPayload.sub || userPayload.id;
    const newStatus = await this.startOrderProductionUseCase.execute(userPayload.tenantId, orderId, userId);
    return { message: 'Producción iniciada. Materiales descontados de la bodega con éxito.', status: newStatus };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/complete-production')
  async completeProduction(@Param('id') orderId: string, @Req() request: Request) {
    const userPayload = request['user'] as any;
    const userId = userPayload.sub || userPayload.id;
    const newStatus = await this.completeOrderProductionUseCase.execute(userPayload.tenantId, orderId, userId);
    return { message: '¡Orden completada! Los productos terminados se han sumado al inventario.', status: newStatus };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/ship')
  async shipOrder(@Param('id') orderId: string, @Req() request: Request) {
    const userPayload = request['user'] as any;
    const newStatus = await this.shipOrderUseCase.execute(userPayload.tenantId, orderId);
    return { message: '¡El paquete está en camino! La orden ha sido enviada.', status: newStatus };
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/deliver')
  async deliverOrder(@Param('id') orderId: string, @Req() request: Request) {
    const userPayload = request['user'] as any;
    const newStatus = await this.deliverOrderUseCase.execute(userPayload.tenantId, orderId);
    return { message: '¡Misión cumplida! El cliente ha recibido su pedido. Ciclo finalizado.', status: newStatus };
  }

  // ── Tenant-aware status update ───────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() request: Request,
  ) {
    const { tenantId } = request['user'] as any;
    const newStatus = await this.updateOrderStatusUseCase.execute(tenantId, orderId, dto.status);
    return { status: newStatus };
  }

  // ── Notification step tracking ───────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Patch(':id/notify/:step')
  async markNotifStep(
    @Param('id') orderId: string,
    @Param('step') step: string,
    @Req() request: Request,
  ) {
    const { tenantId, sub } = request['user'] as any;
    await this.markNotifStepUseCase.execute(orderId, tenantId, step, sub);
    return { marked: true, step };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/notify/:step')
  async unmarkNotifStep(
    @Param('id') orderId: string,
    @Param('step') step: string,
    @Req() request: Request,
  ) {
    const { tenantId } = request['user'] as any;
    await this.unmarkNotifStepUseCase.execute(orderId, tenantId, step);
    return { marked: false, step };
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/notifications')
  async getOrderNotifications(
    @Param('id') orderId: string,
    @Req() request: Request,
  ) {
    const { tenantId } = request['user'] as any;
    return this.getOrderNotificationsUseCase.executeForOrder(orderId, tenantId);
  }
}
