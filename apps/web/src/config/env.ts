/**
 * Public environment variables — safe to import from client components, server components, and API routes.
 * Only NEXT_PUBLIC_* vars belong here (Next.js embeds these in the client bundle at build time).
 * Server-only vars (BACKEND_URL, JWT_SECRET, etc.) live in env.server.ts.
 *
 * IMPORTANT: Next.js replaces process.env.NEXT_PUBLIC_* statically at build time using AST analysis.
 * Dynamic access (process.env[key]) is NOT replaced — always use direct property access here.
 */

export const env = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  API_URL: process.env.NEXT_PUBLIC_API_URL!,
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL!,
  ADMIN_EMAIL: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  ADMIN_WHATSAPP: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP,
  BANK_NAME: process.env.NEXT_PUBLIC_BANK_NAME,
  BANK_ACCOUNT_NAME: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME,
  BANK_ACCOUNT_NUMBER: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER,
  BANK_IBAN: process.env.NEXT_PUBLIC_BANK_IBAN,
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
  APP_DESCRIPTION: process.env.NEXT_PUBLIC_APP_DESCRIPTION,
  DEFAULT_CURRENCY: process.env.NEXT_PUBLIC_DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE: process.env.NEXT_PUBLIC_DEFAULT_LANGUAGE,
  NODE_ENV: process.env.NODE_ENV!,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;

export const {
  APP_URL,
  API_URL,
  API_BASE_URL,
  ADMIN_EMAIL,
  ADMIN_WHATSAPP,
  BANK_NAME,
  BANK_ACCOUNT_NAME,
  BANK_ACCOUNT_NUMBER,
  BANK_IBAN,
  APP_NAME,
  APP_DESCRIPTION,
  DEFAULT_CURRENCY,
  DEFAULT_LANGUAGE,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
} = env;
