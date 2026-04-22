import { Injectable, Inject } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import e from 'express';
import { User } from '../../domain/entities/User';

@Injectable()
export class GetAllUsersUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(tenantId: string,role: string) { 
    let users: User[] = [];
    if (role === 'SUPERADMIN') {
      // Si es un Dios, no le pasamos el tenantId (necesitaremos modificar el repositorio para esto)
      users = await this.userRepository.findAll(); 
    }else {
      // Si no es un Dios, solo le damos acceso a los usuarios de su tenant
      users = await this.userRepository.findAll(tenantId);
    }
    
    // Mapeamos los usuarios del dominio a un formato limpio para el frontend
    // (Ocultamos el passwordHash por seguridad)
    return users.map(user => ({
      id: user.id.value,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      tenantId: user.tenantId.value,
      isActive: user.isActive,
      role: user.role,
    }));
  }
}