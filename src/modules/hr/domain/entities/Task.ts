import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { TaskId } from '../value-objects/TaskId';
import { TaskStatus } from '../value-objects/TaskStatus';

interface TaskProps {
  tenantId:     UniqueId;
  title:        string;
  description:  string | null;
  assignedToId: UniqueId;
  createdById:  UniqueId;
  status:       TaskStatus;
  dueDate:      Date | null;
  createdAt:    Date;
  updatedAt:    Date;
}

export class Task {
  private constructor(
    public readonly id: TaskId,
    private props: TaskProps,
  ) {}

  static create(
    props: Omit<TaskProps, 'status' | 'createdAt' | 'updatedAt'>,
    id?: TaskId,
  ): Task {
    if (!props.title?.trim()) throw new Error('La tarea debe tener un título.');
    return new Task(id ?? new TaskId(), {
      ...props,
      status:    TaskStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static load(props: TaskProps, id: TaskId): Task {
    return new Task(id, props);
  }

  updateStatus(status: TaskStatus): void {
    this.props.status    = status;
    this.props.updatedAt = new Date();
  }

  get tenantId()     { return this.props.tenantId; }
  get title()        { return this.props.title; }
  get description()  { return this.props.description; }
  get assignedToId() { return this.props.assignedToId; }
  get createdById()  { return this.props.createdById; }
  get status()       { return this.props.status; }
  get dueDate()      { return this.props.dueDate; }
  get createdAt()    { return this.props.createdAt; }
  get updatedAt()    { return this.props.updatedAt; }
}
