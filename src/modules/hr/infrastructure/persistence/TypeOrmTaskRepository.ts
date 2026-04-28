import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskOrmEntity } from './TaskOrmEntity';
import { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { Task } from '../../domain/entities/Task';
import { TaskId } from '../../domain/value-objects/TaskId';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { UniqueId } from '../../../../shared/kernel/UniqueId';

@Injectable()
export class TypeOrmTaskRepository implements ITaskRepository {
  constructor(
    @InjectRepository(TaskOrmEntity)
    private readonly repo: Repository<TaskOrmEntity>,
  ) {}

  async save(task: Task): Promise<void> {
    await this.repo.save({
      id:           task.id.value,
      tenantId:     task.tenantId.value,
      title:        task.title,
      description:  task.description,
      assignedToId: task.assignedToId.value,
      createdById:  task.createdById.value,
      status:       task.status,
      dueDate:      task.dueDate,
      createdAt:    task.createdAt,
      updatedAt:    task.updatedAt,
    });
  }

  async findById(id: TaskId): Promise<Task | null> {
    const row = await this.repo.findOne({ where: { id: id.value } });
    return row ? this.toDomain(row) : null;
  }

  async findByAssignedTo(employeeId: UniqueId): Promise<Task[]> {
    const rows = await this.repo.find({
      where: { assignedToId: employeeId.value },
      order: { createdAt: 'DESC' },
    });
    return rows.map(r => this.toDomain(r));
  }

  async findByTenantId(tenantId: UniqueId): Promise<Task[]> {
    const rows = await this.repo.find({
      where: { tenantId: tenantId.value },
      order: { createdAt: 'DESC' },
    });
    return rows.map(r => this.toDomain(r));
  }

  private toDomain(row: TaskOrmEntity): Task {
    return Task.load(
      {
        tenantId:     new UniqueId(row.tenantId),
        title:        row.title,
        description:  row.description,
        assignedToId: new UniqueId(row.assignedToId),
        createdById:  new UniqueId(row.createdById),
        status:       row.status as TaskStatus,
        dueDate:      row.dueDate,
        createdAt:    row.createdAt,
        updatedAt:    row.updatedAt,
      },
      new TaskId(row.id),
    );
  }
}
