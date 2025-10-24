/**
 * Environment Configuration
 * Centralized environment variables for the backend application
 * NO HARDCODED VALUES - All values must come from environment variables
 */

// Validate required environment variables
const requiredEnvVars = {
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  FRONTEND_URL: process.env.FRONTEND_URL,
  ADMIN_URL: process.env.ADMIN_URL,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
};

// Check for missing required environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  const errorMessage = `❌ Missing required environment variables: ${missingVars.join(', ')}`;
  console.error(errorMessage);
  console.error('Please create a .env file with all required variables.');
  
  if (process.env.NODE_ENV === 'development') {
    console.error('See ENVIRONMENT_SETUP.md for configuration details.');
  } else {
    throw new Error(errorMessage);
  }
}

// Environment configuration - NO FALLBACK VALUES
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
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS!.split(','),
  
  // Environment flags
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_TEST: process.env.NODE_ENV === 'test',
} as const;

// Export individual values for convenience
export const {
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  PORT,
  NODE_ENV,
  FRONTEND_URL,
  ADMIN_URL,
  ALLOWED_ORIGINS,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
  IS_TEST,
} = env;
