import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { LoginDto } from '../dtos/LoginDto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    
  ) {}

  async execute(dto: LoginDto) {
    // 1. Buscamos al usuario en la base de datos usando su correo
    const user = await this.userRepository.findByEmail(dto.email);
    
    // 2. Si el usuario NO existe, lanzamos un error 401 (No Autorizado)
    // Por seguridad, siempre decimos "Credenciales inválidas" para no darle pistas a los hackers
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Comparamos la contraseña (por ahora la guardamos tal cual, 
    // en el futuro aquí usaríamos bcrypt.compare)
    // 3. Comparamos la contraseña en texto plano contra el Hash guardado
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciales inválidas');
    }

const payload = { 
      sub: user.id.value, 
      tenantId: user.tenantId.value, 
      tenantName: user.tenantName, // 👈 ¡ESTA ES LA CLAVE!
      role: user.role,
      email: user.email, 
      name: `${user.firstName} ${user.lastName}` 
    };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      message: '¡Inicio de sesión exitoso!',
      accessToken: accessToken,
      user: {
        id: payload.sub,
        tenantId: payload.tenantId,
        tenantName: payload.tenantName, // 👈 También lo incluimos aquí
        role: payload.role,
        email: payload.email,
        name: payload.name
      }
    };
  }
}