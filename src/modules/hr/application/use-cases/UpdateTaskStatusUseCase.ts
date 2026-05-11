import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import { IsEnum } from 'class-validator';
import type { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository';
import type { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { EmployeeId } from '../../domain/value-objects/EmployeeId';
import { TaskId } from '../../domain/value-objects/TaskId';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { UniqueId } from '../../../../shared/kernel/UniqueId';

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus;
}

@Injectable()
export class UpdateTaskStatusUseCase {
  constructor(
    @Inject('IEmployeeRepository') private readonly employeeRepo: IEmployeeRepository,
    @Inject('ITaskRepository')     private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(requesterId: string, taskId: string, dto: UpdateTaskStatusDto) {
    const requester = await this.employeeRepo.findByUserId(new UniqueId(requesterId));
    if (!requester) throw new NotFoundException('Empleado no encontrado.');

    const task = await this.taskRepo.findById(new TaskId(taskId));
    if (!task) throw new NotFoundException('Tarea no encontrada.');

    const isAssignee = task.assignedToId.value === requester.id.value;

    if (!isAssignee) {
      const assignee = await this.employeeRepo.findById(new EmployeeId(task.assignedToId.value));
      if (!assignee || !requester.canManage(assignee)) {
        throw new ForbiddenException('No puedes modificar esta tarea.');
      }
    }

    task.updateStatus(dto.status);
    await this.taskRepo.save(task);

    return { id: task.id.value, status: task.status, updatedAt: task.updatedAt };
  }
}
