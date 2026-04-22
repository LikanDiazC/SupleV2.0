import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    // Extraemos el token que viene oculto en los "Headers" de la petición
    const token = this.extractTokenFromHeader(request);
    
    if (!token) {
      throw new UnauthorizedException('¡Alto ahí! No tienes tu gafete digital (Token)');
    }
    
    try {
      // Verificamos si el token es real y no ha expirado
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'MI_FIRMA_SECRETA_SÚPER_SEGURA'
      });
      // Si todo está bien, adjuntamos la información a la petición
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Gafete inválido o modificado');
    }
    
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}