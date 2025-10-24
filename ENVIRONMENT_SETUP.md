# Environment Configuration Guide

This guide explains how to configure environment variables for the Khaalis Harvest application.

## 🚀 Quick Setup

> **⚠️ CRITICAL**: This application has **ZERO hardcoded values**. All URLs, secrets, and configuration must come from environment variables. The application will **FAIL TO START** if required variables are missing.

### 1. Frontend Environment (.env.local)

Create `apps/web/.env.local` with the following content:

```bash
# Application URL (for metadata and Open Graph)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# API URLs
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1

# Backend URL (for API routes)
BACKEND_URL=http://localhost:3001

# JWT Secret (for API routes)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 2. Backend Environment (.env)

Create `apps/backend/.env` with the following content:

```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/khaalis_harvest

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🔧 Environment Variables Explained

### Frontend Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `NEXT_PUBLIC_APP_URL` | Frontend application URL for metadata | ✅ **Yes** | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | Backend API URL for frontend requests | ✅ **Yes** | `http://localhost:3001/api/v1` |
| `NEXT_PUBLIC_API_BASE_URL` | Alternative API URL (fallback) | No | `http://localhost:3001/api/v1` |
| `BACKEND_URL` | Backend URL for API routes | ✅ **Yes** | `http://localhost:3001` |
| `JWT_SECRET` | JWT secret for API routes | ✅ **Yes** | `your-super-secret-jwt-key` |

### Backend Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ **Yes** | `postgresql://postgres:password@localhost:5432/khaalis_harvest` |
| `JWT_SECRET` | JWT signing secret | ✅ **Yes** | `your-super-secret-jwt-key` |
| `JWT_EXPIRES_IN` | JWT expiration time | No | `7d` |
| `PORT` | Server port | No | `3001` |
| `NODE_ENV` | Environment mode | No | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | ✅ **Yes** | `http://localhost:3000` |
| `ADMIN_URL` | Admin URL for CORS | No | `http://localhost:3001` |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | No | `http://localhost:3000,http://localhost:3001` |

> **⚠️ Important**: The application will **FAIL TO START** if required environment variables are missing. No hardcoded fallback values are provided.

## 🌍 Production Configuration

### Frontend Production (.env.production)

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com/api/v1
BACKEND_URL=https://api.your-domain.com
JWT_SECRET=your-super-secure-production-jwt-secret
```

### Backend Production (.env.production)

```bash
DATABASE_URL=postgresql://username:password@your-db-host:5432/khaalis_harvest_prod
JWT_SECRET=your-super-secure-production-jwt-secret
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
ADMIN_URL=https://admin.your-domain.com
ALLOWED_ORIGINS=https://your-domain.com,https://admin.your-domain.com
```

## 🔒 Security Notes

1. **Never commit `.env` files** to version control
2. **Use strong JWT secrets** in production (32+ characters)
3. **Use HTTPS** in production
4. **Restrict CORS origins** to your actual domains
5. **Use environment-specific database URLs**

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Check `ALLOWED_ORIGINS` includes your frontend URL
2. **API Connection Failed**: Verify `NEXT_PUBLIC_API_URL` is correct
3. **Database Connection Failed**: Check `DATABASE_URL` format and credentials
4. **JWT Errors**: Ensure `JWT_SECRET` is the same in frontend and backend

### Validation

The application will warn you about missing environment variables in development mode. Check the console for warnings like:

```
⚠️  Missing environment variables: NEXT_PUBLIC_API_URL, JWT_SECRET
```

## 📁 File Structure

```
apps/
├── web/
│   ├── .env.local          # Frontend environment (create this)
│   └── .env.example        # Frontend example (this file)
└── backend/
    ├── .env                # Backend environment (create this)
    └── .env.example        # Backend example (create this)
```

## 🚀 Deployment

### Docker

For Docker deployment, set environment variables in your `docker-compose.yml`:

```yaml
services:
  frontend:
    environment:
      - NEXT_PUBLIC_APP_URL=https://your-domain.com
      - NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
      - BACKEND_URL=https://api.your-domain.com
  
  backend:
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/khaalis_harvest
      - JWT_SECRET=your-production-secret
      - FRONTEND_URL=https://your-domain.com
```

### Vercel/Netlify

Set environment variables in your deployment platform's dashboard.

### Railway/Heroku

Use the platform's environment variable configuration.

## ✅ Verification

After setting up environment variables:

1. **Frontend**: Check browser console for warnings
2. **Backend**: Check server startup logs
3. **API**: Test API endpoints work correctly
4. **CORS**: Verify cross-origin requests work

## 🔄 Updates

When adding new environment variables:

1. Update this documentation
2. Add to `.env.example` files
3. Update the centralized config files
4. Test in development
5. Update production configuration
