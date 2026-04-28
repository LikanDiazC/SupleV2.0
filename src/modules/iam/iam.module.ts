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
    TypeOrmModule.forFeature([UserOrmEntity]),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => {
        const secret = process.env.JWT_SECRET;
        if (!secret || secret.length < 32) {
          throw new Error('JWT_SECRET no está definido o es demasiado corto (mínimo 32 caracteres). Configúralo en el archivo .env');
        }
        return {
          secret,
          signOptions: { expiresIn: '1h' },
        };
      },
    }),
  ],
  controllers: [
    UserController,
  ],
  providers: [
    CreateUserUseCase,
    GetAllUsersUseCase,
    LoginUseCase,
    {
      provide: 'IUserRepository',
      useClass: TypeOrmUserRepository,
    },
  ],
  exports: ['IUserRepository'],
})
export class IamModule {}
