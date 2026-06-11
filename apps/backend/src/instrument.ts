import * as Sentry from '@sentry/nestjs';

// Must be called before any other imports that touch NestJS/Express
export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    // Only send errors in production; log locally in dev
    enabled: process.env.NODE_ENV === 'production',
    tracesSampleRate: 0.1,
  });
}
