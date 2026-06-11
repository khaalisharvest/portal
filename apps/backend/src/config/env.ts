/**
 * Environment Configuration
 * Centralized environment variables for the backend application
 * NO HARDCODED VALUES - All values must come from environment variables
 */

// Load .env before NestJS ConfigModule initializes — env.ts runs at module import time
// dotenv resolves .env from the process working directory (apps/backend/ in dev, /app in Docker)
import 'dotenv/config';

const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  FRONTEND_URL: process.env.FRONTEND_URL,
  ADMIN_URL: process.env.ADMIN_URL,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  BACKEND_URL: process.env.BACKEND_URL,
  // Redis
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  REDIS_TTL: process.env.REDIS_TTL,
  // Notifications — required
  SMTP_FROM: process.env.SMTP_FROM,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_WHATSAPP: process.env.ADMIN_WHATSAPP,
  // Uploads
  UPLOAD_PATH: process.env.UPLOAD_PATH,
  MAX_FILE_SIZE_MB: process.env.MAX_FILE_SIZE_MB,
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  // Super admin seed
  SUPER_ADMIN_PHONE: process.env.SUPER_ADMIN_PHONE,
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

// JWT_SECRET must be set in ALL environments — undefined = trivially forgeable tokens
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set. Generate one with: openssl rand -base64 32');
}

if (missingVars.length > 0) {
  const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}`;
  process.stderr.write(`${errorMessage}\n`);
  process.stderr.write('Please create a .env file with all required variables.\n');
  if (process.env.NODE_ENV === 'development') {
    process.stderr.write('See env.template for configuration details.\n');
  } else {
    throw new Error(errorMessage);
  }
}

export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN!,
  // Server
  PORT: parseInt(process.env.PORT!, 10),
  NODE_ENV: process.env.NODE_ENV!,
  // URLs
  FRONTEND_URL: process.env.FRONTEND_URL!,
  ADMIN_URL: process.env.ADMIN_URL!,
  BACKEND_URL: process.env.BACKEND_URL!,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS!.split(','),
  // Notifications — required fields
  SMTP_FROM: process.env.SMTP_FROM!,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL!,
  ADMIN_WHATSAPP: process.env.ADMIN_WHATSAPP!,
  // Notifications — optional (SMTP credentials; absent = log to console only)
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  // Redis
  REDIS_HOST: process.env.REDIS_HOST!,
  REDIS_PORT: parseInt(process.env.REDIS_PORT!, 10),
  REDIS_TTL: parseInt(process.env.REDIS_TTL!, 10),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  // Uploads
  UPLOAD_PATH: process.env.UPLOAD_PATH!,
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB!, 10),
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,
  // Error tracking — optional, Sentry disabled if absent
  SENTRY_DSN: process.env.SENTRY_DSN,
  // Environment flags
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const;

export const {
  DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT, NODE_ENV,
  FRONTEND_URL, ADMIN_URL, BACKEND_URL, ALLOWED_ORIGINS,
  REDIS_HOST, REDIS_PORT, REDIS_TTL, REDIS_PASSWORD,
  SMTP_FROM, ADMIN_EMAIL, ADMIN_WHATSAPP,
  SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS,
  UPLOAD_PATH, MAX_FILE_SIZE_MB,
  CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
  IS_PRODUCTION, IS_DEVELOPMENT, IS_TEST,
} = env;
