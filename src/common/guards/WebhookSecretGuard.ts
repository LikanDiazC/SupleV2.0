import { CanActivate, ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class WebhookSecretGuard implements CanActivate {
  private readonly logger = new Logger('WebhookSecretGuard');

  canActivate(context: ExecutionContext): boolean {
    const expected = process.env.WEBHOOK_SECRET;
    if (!expected) {
      this.logger.warn('WEBHOOK_SECRET no configurado — webhook desprotegido. Configúralo en .env');
      return true;
    }

    const request  = context.switchToHttp().getRequest<Request>();
    const provided = (request.query?.token as string) || (request.headers['x-webhook-secret'] as string);

    if (provided !== expected) {
      this.logger.warn(`Intento de webhook rechazado desde ${request.ip}`);
      throw new UnauthorizedException('Webhook token inválido');
    }
    return true;
  }
}
