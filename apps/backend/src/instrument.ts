import * as Sentry from '@sentry/nestjs';

// Must be called before any other imports that touch NestJS/Express
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    process.stderr.write('[Sentry] SENTRY_DSN not set — error tracking disabled\n');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    enabled: true, // Enable in all environments so staging/preview errors are captured
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}
