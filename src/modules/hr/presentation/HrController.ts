import { Controller, Get, Post, Patch, Body, Param, Req, UseGuards, HttpCode } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../../iam/infrastructure/guards/JwtAuthGuard';
import { EmployeeId } from '../domain/value-objects/EmployeeId';
import { UniqueId } from '../../../shared/kernel/UniqueId';
import { Inject } from '@nestjs/common';
import type { IEmployeeRepository } from '../domain/repositories/IEmployeeRepository';
import { GetTeamUseCase } from '../application/use-cases/GetTeamUseCase';
import { GetEmployeeTasksUseCase } from '../application/use-cases/GetEmployeeTasksUseCase';
import { GetMyTasksUseCase } from '../application/use-cases/GetMyTasksUseCase';
import { CreateTaskUseCase, CreateTaskDto } from '../application/use-cases/CreateTaskUseCase';
import { UpdateTaskStatusUseCase, UpdateTaskStatusDto } from '../application/use-cases/UpdateTaskStatusUseCase';

@UseGuards(JwtAuthGuard)
@Controller('hr')
export class HrController {
  constructor(
    private readonly getTeam:             GetTeamUseCase,
    private readonly getEmployeeTasks:    GetEmployeeTasksUseCase,
    private readonly getMyTasks:          GetMyTasksUseCase,
    private readonly createTask:          CreateTaskUseCase,
    private readonly updateTaskStatus:    UpdateTaskStatusUseCase,
    @Inject('IEmployeeRepository') private readonly employeeRepo: IEmployeeRepository,
  ) {}

  @Get('team')
  async team(@Req() req: Request) {
    const user = req['user'] as any;
    return this.getTeam.execute(user.sub, user.tenantId);
  }

  @Get('my-tasks')
  async myTasks(@Req() req: Request) {
    const user = req['user'] as any;
    return this.getMyTasks.execute(user.sub);
  }

  @Get('employees/:employeeId/tasks')
  async employeeTasks(@Param('employeeId') employeeId: string, @Req() req: Request) {
    const user = req['user'] as any;
    return this.getEmployeeTasks.execute(user.sub, employeeId);
  }

  @Post('tasks')
  async create(@Body() dto: CreateTaskDto, @Req() req: Request) {
    const user = req['user'] as any;
    return this.createTask.execute(user.sub, user.tenantId, dto);
  }

  @Patch('tasks/:taskId/status')
  async updateStatus(
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskStatusDto,
    @Req() req: Request,
  ) {
    const user = req['user'] as any;
    return this.updateTaskStatus.execute(user.sub, taskId, dto);
  }

  @HttpCode(200)
  @Post('heartbeat')
  async heartbeat(@Req() req: Request) {
    const user = req['user'] as any;
    const employee = await this.employeeRepo.findByUserId(new UniqueId(user.sub));
    if (employee) {
      await this.employeeRepo.updateLastSeen(new EmployeeId(employee.id.value));
    }
    return { ok: true };
  }
}
