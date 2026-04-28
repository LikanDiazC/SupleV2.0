import { Injectable, Inject, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository';
import type { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { EmployeeId } from '../../domain/value-objects/EmployeeId';
import { UniqueId } from '../../../../shared/kernel/UniqueId';

@Injectable()
export class GetEmployeeTasksUseCase {
  constructor(
    @Inject('IEmployeeRepository') private readonly employeeRepo: IEmployeeRepository,
    @Inject('ITaskRepository')     private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(requesterId: string, targetEmployeeId: string) {
    const requester = await this.employeeRepo.findByUserId(new UniqueId(requesterId));
    if (!requester) throw new NotFoundException('Empleado solicitante no encontrado.');

    const target = await this.employeeRepo.findById(new EmployeeId(targetEmployeeId));
    if (!target) throw new NotFoundException('Empleado objetivo no encontrado.');

    if (requester.id.value !== target.id.value && !requester.canManage(target)) {
      throw new ForbiddenException('No tienes permiso para ver las tareas de este empleado.');
    }

    const tasks = await this.taskRepo.findByAssignedTo(new UniqueId(target.id.value));

    return tasks.map(t => ({
      id:          t.id.value,
      title:       t.title,
      description: t.description,
      status:      t.status,
      dueDate:     t.dueDate,
      createdById: t.createdById.value,
      createdAt:   t.createdAt,
      updatedAt:   t.updatedAt,
    }));
  }
}
