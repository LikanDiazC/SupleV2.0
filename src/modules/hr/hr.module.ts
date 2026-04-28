import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EmployeeOrmEntity } from './infrastructure/persistence/EmployeeOrmEntity';
import { TaskOrmEntity } from './infrastructure/persistence/TaskOrmEntity';
import { TypeOrmEmployeeRepository } from './infrastructure/persistence/TypeOrmEmployeeRepository';
import { TypeOrmTaskRepository } from './infrastructure/persistence/TypeOrmTaskRepository';

import { GetTeamUseCase } from './application/use-cases/GetTeamUseCase';
import { GetEmployeeTasksUseCase } from './application/use-cases/GetEmployeeTasksUseCase';
import { GetMyTasksUseCase } from './application/use-cases/GetMyTasksUseCase';
import { CreateTaskUseCase } from './application/use-cases/CreateTaskUseCase';
import { UpdateTaskStatusUseCase } from './application/use-cases/UpdateTaskStatusUseCase';

import { HrController } from './presentation/HrController';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeOrmEntity, TaskOrmEntity]),
  ],
  providers: [
    { provide: 'IEmployeeRepository', useClass: TypeOrmEmployeeRepository },
    { provide: 'ITaskRepository',     useClass: TypeOrmTaskRepository },

    GetTeamUseCase,
    GetEmployeeTasksUseCase,
    GetMyTasksUseCase,
    CreateTaskUseCase,
    UpdateTaskStatusUseCase,
  ],
  controllers: [HrController],
})
export class HrModule {}
