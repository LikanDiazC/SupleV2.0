import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserOrmEntity } from './infrastructure/persistence/UserOrmEntity';
import { UserController } from './presentation/UserController';
import { CreateUserUseCase } from './application/use-cases/CreateUserUseCase';
import { TypeOrmUserRepository } from './infrastructure/persistence/TypeOrmUserRepository';
import { GetAllUsersUseCase } from './application/use-cases/GetAllUsersUseCase';
import { LoginUseCase } from './application/use-cases/LoginUseCase';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [
    // 1. Le decimos a este módulo que tiene permiso para usar la tabla 'users'
    TypeOrmModule.forFeature([UserOrmEntity]),
    // 2. Configuramos la máquina de gafetes
    JwtModule.register({
      global: true, 
      secret: 'MI_FIRMA_SECRETA_SÚPER_SEGURA', // En un proyecto real, esto se lee del archivo .env
      signOptions: { expiresIn: '1h' }, // ¡El gafete se destruye automáticamente en 1 hora!
    }),
  ],
  controllers: [
    // 2. Registramos nuestra puerta de entrada HTTP
    UserController,
  ],
  providers: [
    // 3. Registramos nuestro Director de Orquesta
    CreateUserUseCase,
    GetAllUsersUseCase,
    LoginUseCase,
    
    // 4. ¡EL TRUCO MÁGICO! 
    // Le decimos a NestJS: "Cuando el Caso de Uso pida el contrato 'IUserRepository', 
    // entrégale esta clase real 'TypeOrmUserRepository' que sabe usar PostgreSQL".
    {
      provide: 'IUserRepository',
      useClass: TypeOrmUserRepository,
    },
  ],
})
export class IamModule {}