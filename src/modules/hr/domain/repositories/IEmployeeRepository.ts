import { Employee } from '../entities/Employee';
import { EmployeeId } from '../value-objects/EmployeeId';
import { UniqueId } from '../../../../shared/kernel/UniqueId';

export interface IEmployeeRepository {
  save(employee: Employee): Promise<void>;
  findById(id: EmployeeId): Promise<Employee | null>;
  findByUserId(userId: UniqueId): Promise<Employee | null>;
  findByTenantId(tenantId: UniqueId): Promise<Employee[]>;
  findDirectReports(managerId: EmployeeId): Promise<Employee[]>;
  updateLastSeen(employeeId: EmployeeId): Promise<void>;
}
