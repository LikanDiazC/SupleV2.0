import { UniqueId } from '../../../../shared/kernel/UniqueId';
import { EmployeeId } from '../value-objects/EmployeeId';
import { HrRole } from '../value-objects/HrRole';

interface EmployeeProps {
  userId:     UniqueId;
  tenantId:   UniqueId;
  hrRole:     HrRole;
  managerId:  EmployeeId | null;
  firstName:  string;
  lastName:   string;
  email:      string;
  position:   string | null;
  createdAt:  Date;
  lastSeenAt: Date | null;
}

export class Employee {
  private constructor(
    public readonly id: EmployeeId,
    private readonly props: EmployeeProps,
  ) {}

  static create(
    props: Omit<EmployeeProps, 'createdAt' | 'lastSeenAt'>,
    id?: EmployeeId,
  ): Employee {
    if (!props.firstName?.trim()) throw new Error('El empleado debe tener nombre.');
    return new Employee(id ?? new EmployeeId(), { ...props, createdAt: new Date(), lastSeenAt: null });
  }

  static load(props: EmployeeProps, id: EmployeeId): Employee {
    return new Employee(id, props);
  }

  get userId()    { return this.props.userId; }
  get tenantId()  { return this.props.tenantId; }
  get hrRole()    { return this.props.hrRole; }
  get managerId() { return this.props.managerId; }
  get firstName() { return this.props.firstName; }
  get lastName()  { return this.props.lastName; }
  get email()     { return this.props.email; }
  get position()   { return this.props.position; }
  get createdAt()  { return this.props.createdAt; }
  get lastSeenAt() { return this.props.lastSeenAt; }

  get fullName()  { return `${this.props.firstName} ${this.props.lastName}`; }

  canManage(other: Employee): boolean {
    if (this.props.hrRole === HrRole.OWNER) return true;
    if (this.props.hrRole === HrRole.MANAGER) {
      return other.managerId?.value === this.id.value;
    }
    return false;
  }
}
