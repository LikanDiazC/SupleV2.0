import { Injectable, Inject } from '@nestjs/common';
import type { IEmployeeRepository } from '../../domain/repositories/IEmployeeRepository';
import type { ITaskRepository } from '../../domain/repositories/ITaskRepository';
import { HrRole } from '../../domain/value-objects/HrRole';
import { TaskStatus } from '../../domain/value-objects/TaskStatus';
import { UniqueId } from '../../../../shared/kernel/UniqueId';

export interface TeamResult {
  notRegistered?: boolean;
  isEmployee?:    boolean;
  team:           TeamMemberDto[];
}

interface TeamMemberDto {
  id: string; userId: string; firstName: string; lastName: string;
  email: string; hrRole: string; position: string | null;
  managerId: string | null; pendingTasks: number; totalTasks: number;
  isOnline: boolean; lastSeenAt: Date | null;
}

@Injectable()
export class GetTeamUseCase {
  constructor(
    @Inject('IEmployeeRepository') private readonly employeeRepo: IEmployeeRepository,
    @Inject('ITaskRepository')     private readonly taskRepo: ITaskRepository,
  ) {}

  async execute(userId: string, tenantId: string): Promise<TeamResult> {
    const currentEmployee = await this.employeeRepo.findByUserId(new UniqueId(userId));

    if (!currentEmployee) {
      return { notRegistered: true, team: [] };
    }

    if (currentEmployee.hrRole === HrRole.EMPLOYEE) {
      return { isEmployee: true, team: [] };
    }

    const team =
      currentEmployee.hrRole === HrRole.OWNER
        ? (await this.employeeRepo.findByTenantId(new UniqueId(tenantId)))
            .filter(e => e.id.value !== currentEmployee.id.value)
        : await this.employeeRepo.findDirectReports(currentEmployee.id);

    const allTasks = await this.taskRepo.findByTenantId(new UniqueId(tenantId));

    const ONLINE_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes
    const now = Date.now();

    const members = team.map(member => {
      const memberTasks = allTasks.filter(t => t.assignedToId.value === member.id.value);
      const pending     = memberTasks.filter(t => t.status !== TaskStatus.COMPLETED).length;
      const isOnline    = member.lastSeenAt
        ? now - new Date(member.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS
        : false;

      return {
        id:           member.id.value,
        userId:       member.userId.value,
        firstName:    member.firstName,
        lastName:     member.lastName,
        email:        member.email,
        hrRole:       member.hrRole,
        position:     member.position,
        managerId:    member.managerId?.value ?? null,
        pendingTasks: pending,
        totalTasks:   memberTasks.length,
        isOnline,
        lastSeenAt:   member.lastSeenAt,
      };
    });

    return { team: members };
  }
}
