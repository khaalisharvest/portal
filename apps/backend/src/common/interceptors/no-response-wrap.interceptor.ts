import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class NoResponseWrapInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // This interceptor simply passes the response through without modification.
    // It's used to explicitly bypass the global ResponseInterceptor for specific routes.
    return next.handle();
  }
}
