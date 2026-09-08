import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

// Normaliza todas las respuestas de error, incluyendo el código de dominio
// ACCOUNTING_PERIOD_CLOSED que exige el PRD (sección 15) para que el frontend
// pueda distinguirlo de un error genérico de validación.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const isDomainError =
      typeof exceptionResponse === 'object' &&
      exceptionResponse !== null &&
      'code' in exceptionResponse;

    const body = isDomainError
      ? exceptionResponse
      : {
          code: exception instanceof HttpException ? exception.name : 'INTERNAL_ERROR',
          message:
            exception instanceof HttpException
              ? exception.message
              : 'Ha ocurrido un error inesperado.',
        };

    if (status >= 500) {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json(body);
  }
}
