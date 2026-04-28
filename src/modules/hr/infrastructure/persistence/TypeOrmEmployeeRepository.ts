import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeOrmEntity } from './EmployeeOrmEntity';
import { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository';
import { Employee } from '../../domain/entities/Employee';
import { EmployeeId } from '../../domain/value-objects/EmployeeId';
import { HrRole } from '../../domain/value-objects/HrRole';
import { UniqueId } from '../../../../shared/kernel/UniqueId';

@Injectable()
export class TypeOrmEmployeeRepository implements IEmployeeRepository {
  constructor(
    @InjectRepository(EmployeeOrmEntity)
    private readonly repo: Repository<EmployeeOrmEntity>,
  ) {}

  async save(employee: Employee): Promise<void> {
    await this.repo.save({
      id:         employee.id.value,
      userId:     employee.userId.value,
      tenantId:   employee.tenantId.value,
      hrRole:     employee.hrRole,
      managerId:  employee.managerId?.value ?? null,
      firstName:  employee.firstName,
      lastName:   employee.lastName,
      email:      employee.email,
      position:   employee.position ?? null,
      createdAt:  employee.createdAt,
    });
  }

  async findById(id: EmployeeId): Promise<Employee | null> {
    const row = await this.repo.findOne({ where: { id: id.value } });
    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: UniqueId): Promise<Employee | null> {
    const row = await this.repo.findOne({ where: { userId: userId.value } });
    return row ? this.toDomain(row) : null;
  }

  async findByTenantId(tenantId: UniqueId): Promise<Employee[]> {
    const rows = await this.repo.find({ where: { tenantId: tenantId.value } });
    return rows.map(r => this.toDomain(r));
  }

  async findDirectReports(managerId: EmployeeId): Promise<Employee[]> {
    const rows = await this.repo.find({ where: { managerId: managerId.value } });
    return rows.map(r => this.toDomain(r));
  }

  async updateLastSeen(employeeId: EmployeeId): Promise<void> {
    await this.repo.update({ id: employeeId.value }, { lastSeenAt: new Date() });
  }

  private toDomain(row: EmployeeOrmEntity): Employee {
    return Employee.load(
      {
        userId:     new UniqueId(row.userId),
        tenantId:   new UniqueId(row.tenantId),
        hrRole:     row.hrRole as HrRole,
        managerId:  row.managerId ? new EmployeeId(row.managerId) : null,
        firstName:  row.firstName,
        lastName:   row.lastName,
        email:      row.email,
        position:   row.position,
        createdAt:  row.createdAt,
        lastSeenAt: row.lastSeenAt ?? null,
      },
      new EmployeeId(row.id),
    );
  }
}
