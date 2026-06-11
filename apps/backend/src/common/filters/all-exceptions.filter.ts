import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import * as Sentry from '@sentry/nestjs';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message =
        typeof res === 'string'
          ? res
          : (res as any).message || (res as any).error || 'Error';
    } else if (exception instanceof QueryFailedError) {
      const dbError = exception as any;
      if (dbError.code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'A record with this value already exists.';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = 'Database error';
      }
      this.logger.error(`DB error [code: ${dbError.code}]`);
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Unknown exception: ${JSON.stringify(exception)}`);
    }

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${status}`);
      // Capture unexpected server errors in Sentry
      if (exception instanceof Error) {
        Sentry.captureException(exception);
      }
    } else if (status >= 400) {
      const msg = Array.isArray(message) ? message[0] : message;
      this.logger.warn(`${request.method} ${request.url} → ${status}: ${msg}`);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: Array.isArray(message) ? message[0] : message,
      ...(Array.isArray(message) && message.length > 1 ? { errors: message } : {}),
    });
  }
}
