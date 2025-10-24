# Environment Setup

## Quick Start

1. **Create environment files in each app folder:**

   **Backend (`apps/backend/.env`):**
   ```env
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=postgres
   DB_PASSWORD=password
   DB_NAME=khaalis_harvest
   
   # Redis
   REDIS_HOST=localhost
   REDIS_PORT=6379
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key
   
   # App
   PORT=3000
   NODE_ENV=development
   ```

   **Web App (`apps/web/.env.local`):**
   ```env
   # API
   NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
   
   # App
   NEXT_PUBLIC_APP_NAME=Khaalis Harvest
   ```

2. **Start the applications:**
   ```bash
   # Backend
   yarn backend
   
   # Web App
   yarn web
   ```

## Environment Files

- `apps/backend/.env` - Backend environment variables
- `apps/web/.env.local` - Web app environment variables

That's it! Each app has its own .env file where it belongs.