import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository';
import type { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import { EmployeeId } from '../../domain/value-objects/EmployeeId';
import { UniqueId } from '../../../../shared/kernel/UniqueId';

export class CreateTaskDto {
  title!:        string;
  description?:  string;
  assignedToId!: string;
  dueDate?:      string;
}

@Injectable()
export class CreateTaskUseCase {
  constructor(
    @Inject('IEmployeeRepository') private readonly employeeRepo: IEmployeeRepository,
    @Inject('ITaskRepository')     private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(requesterId: string, tenantId: string, dto: CreateTaskDto) {
    const requester = await this.employeeRepo.findByUserId(new UniqueId(requesterId));
    if (!requester) throw new NotFoundException('Empleado solicitante no encontrado.');

    const target = await this.employeeRepo.findById(new EmployeeId(dto.assignedToId));
    if (!target) throw new NotFoundException('Empleado destino no encontrado.');

    if (!requester.canManage(target) && requester.id.value !== target.id.value) {
      throw new ForbiddenException('No puedes asignar tareas a este empleado.');
    }

    const task = Task.create({
      tenantId:     new UniqueId(tenantId),
      title:        dto.title,
      description:  dto.description ?? null,
      assignedToId: new UniqueId(target.id.value),
      createdById:  new UniqueId(requester.id.value),
      dueDate:      dto.dueDate ? new Date(dto.dueDate) : null,
    });

    await this.taskRepo.save(task);

    return {
      id:           task.id.value,
      title:        task.title,
      description:  task.description,
      status:       task.status,
      dueDate:      task.dueDate,
      assignedToId: task.assignedToId.value,
      createdAt:    task.createdAt,
    };
  }
}
