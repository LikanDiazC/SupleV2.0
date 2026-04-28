import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository';
import type { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { UniqueId } from '../../../../shared/kernel/UniqueId';

@Injectable()
export class GetMyTasksUseCase {
  constructor(
    @Inject('IEmployeeRepository') private readonly employeeRepo: IEmployeeRepository,
    @Inject('ITaskRepository')     private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(userId: string) {
    const employee = await this.employeeRepo.findByUserId(new UniqueId(userId));
    if (!employee) throw new NotFoundException('Empleado no encontrado.');

    const tasks = await this.taskRepo.findByAssignedTo(new UniqueId(employee.id.value));

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
