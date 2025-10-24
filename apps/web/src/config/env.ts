/**
 * Environment Configuration
 * Centralized environment variables for the application
 * NO HARDCODED VALUES - All values must come from environment variables
 */

// Validate required environment variables
const requiredEnvVars = {
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  BACKEND_URL: process.env.BACKEND_URL,
};

// Check for missing required environment variables
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  const errorMessage = `❌ Missing required environment variables: ${missingVars.join(', ')}`;
  console.error(errorMessage);
  console.error('Please create a .env.local file with all required variables.');
  
  if (process.env.NODE_ENV === 'development') {
    console.error('See ENVIRONMENT_SETUP.md for configuration details.');
  } else {
    throw new Error(errorMessage);
  }
}

// Environment configuration - NO FALLBACK VALUES
export const env = {
  // Frontend URLs
  APP_URL: process.env.NEXT_PUBLIC_APP_URL!,
  
  // API URLs
  API_URL: process.env.NEXT_PUBLIC_API_URL!,
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL!,
  
  // Backend URL (for API routes)
  BACKEND_URL: process.env.BACKEND_URL!,
  
  // Admin WhatsApp for payment confirmation
  ADMIN_WHATSAPP: process.env.NEXT_PUBLIC_ADMIN_WHATSAPP,
  
  // Bank account details for payment
  BANK_NAME: process.env.NEXT_PUBLIC_BANK_NAME,
  BANK_ACCOUNT_NAME: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME,
  BANK_ACCOUNT_NUMBER: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER,
  BANK_IBAN: process.env.NEXT_PUBLIC_BANK_IBAN,
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;

// Export individual URLs for convenience
export const {
  APP_URL,
  API_URL,
  API_BASE_URL,
  BACKEND_URL,
  ADMIN_WHATSAPP,
  BANK_NAME,
  BANK_ACCOUNT_NAME,
  BANK_ACCOUNT_NUMBER,
  BANK_IBAN,
  NODE_ENV,
  IS_PRODUCTION,
  IS_DEVELOPMENT,
} = env;
