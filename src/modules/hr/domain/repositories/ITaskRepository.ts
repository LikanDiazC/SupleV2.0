import { Task } from '../entities/Task';
import { TaskId } from '../value-objects/TaskId';
import { UniqueId } from '../../../../shared/kernel/UniqueId';

export interface ITaskRepository {
  save(task: Task): Promise<void>;
  findById(id: TaskId): Promise<Task | null>;
  findByAssignedTo(employeeId: UniqueId): Promise<Task[]>;
  findByTenantId(tenantId: UniqueId): Promise<Task[]>;
}
