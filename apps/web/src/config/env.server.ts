/**
 * Server-only environment variables — never import this from client components.
 * These vars are not prefixed with NEXT_PUBLIC_ and are undefined in the browser.
 * Next.js will throw a build error if this file is imported from a client component.
 */

if (typeof window !== 'undefined') {
  throw new Error('env.server.ts must not be imported from client components.');
}

const required = ['BACKEND_URL'] as const;

const missing = required.filter((key) => !process.env[key] && !process.env.INTERNAL_BACKEND_URL);
if (missing.length > 0) {
  throw new Error(`❌ Missing required server environment variables: ${missing.join(', ')}`);
}

export const serverEnv = {
  BACKEND_URL: process.env.INTERNAL_BACKEND_URL || process.env.BACKEND_URL!,
  JWT_SECRET: process.env.JWT_SECRET,
} as const;

export const { BACKEND_URL } = serverEnv;
