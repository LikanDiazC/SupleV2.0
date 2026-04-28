import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/IUserRepository'; // <-- ¡Solo agregamos 'type' aquí!
import { CreateUserDto } from '../dtos/CreateUserDto';
import { User } from '../../domain/entities/User';
import { TenantId } from '../../domain/value-objects/TenantId';
import * as bcrypt from 'bcrypt';

@Injectable() // Esto le dice a NestJS que esta clase se puede inyectar en otros lados
export class CreateUserUseCase {
  
  constructor(
    // 💡 Fíjate que inyectamos el CONTRATO, no a TypeORM directamente. 
    // Así mantenemos la arquitectura limpia.
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  // El método 'execute' es la única acción que hace esta clase
  async execute(dto: CreateUserDto): Promise<void> {
    
    // 1. Verificamos que el email no exista ya en la base de datos
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Error: Este correo ya está registrado en el sistema.');
    }

    // 2. (Nota: En un proyecto real, aquí usaríamos una librería como 'bcrypt' 
    // para encriptar la contraseña. Por ahora, para probar rápido, la pasamos tal cual).
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 3. Creamos la "Caja Fuerte" (Nuestro usuario del Dominio)
    const user = User.create({
      email: dto.email,
      passwordHash: passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      isActive: true,
      tenantId: new TenantId(dto.tenantId),
      role: 'USER',
      mustChangePassword: true,
    });

    // 4. ¡Se lo pasamos al Repositorio para que lo guarde en PostgreSQL!
    await this.userRepository.save(user);
  }
}