import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    const isHttp     = exception instanceof HttpException;
    const status     = isHttp ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const httpRes    = isHttp ? exception.getResponse() : null;
    const clientMsg  = isHttp
      ? (typeof httpRes === 'string' ? httpRes : (httpRes as any)?.message ?? exception.message)
      : 'Ocurrió un error interno. Intenta de nuevo más tarde.';

    if (!isHttp || status >= 500) {
      this.logger.error(
        `[${request.method} ${request.url}] ${exception instanceof Error ? exception.message : String(exception)}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
      message:    clientMsg,
      timestamp:  new Date().toISOString(),
      path:       request.url,
    });
  }
}
