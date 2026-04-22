import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  // El "Reflector" es la herramienta de NestJS para leer las etiquetas VIP que creamos
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // Si la ruta no tiene la etiqueta @Roles, dejamos pasar a cualquiera que haya hecho login
    if (!requiredRoles) {
      return true; 
    }
    
    // Atrapamos la petición. (Recuerda que el JwtAuthGuard ya descifró el token 
    // y metió los datos del usuario aquí adentro segundos antes)
    const { user } = context.switchToHttp().getRequest();

    // Si el usuario no tiene rol, o su rol NO está en la lista de permitidos, ¡bloqueamos!
    if (!user || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('¡Acceso Denegado! Tu rol no tiene los permisos suficientes.');
    }
    
    return true; // Si pasa la prueba, abrimos la puerta
  }
}