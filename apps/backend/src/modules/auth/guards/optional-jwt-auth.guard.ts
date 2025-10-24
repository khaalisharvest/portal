import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(OptionalJwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      // Try to authenticate with JWT
      const result = await super.canActivate(context) as boolean;
      if (result) {
        this.logger.debug('JWT authentication successful');
      }
      return result;
    } catch (error) {
      // Log authentication failures for monitoring
      this.logger.warn('JWT authentication failed, proceeding as guest', error.message);
      // If JWT is invalid or missing, just continue without user
      return true;
    }
  }

  handleRequest(err: any, user: any, info: any) {
    if (err) {
      this.logger.warn('JWT validation error', err.message);
    }
    // Return user if valid, otherwise return null (don't throw error)
    return user || null;
  }
}
