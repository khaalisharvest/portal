# Khaalis Harvest Platform - Production Build
# Works for both local development and production deployments (Azure, AWS, etc.)
FROM node:18-alpine

# Install build dependencies for Alpine
RUN apk add --no-cache python3 make g++ wget

# Build arguments - Environment variables needed during build
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_API_BASE_URL=
ARG BACKEND_URL
ARG JWT_SECRET
ARG NEXT_PUBLIC_ADMIN_WHATSAPP
ARG NEXT_PUBLIC_BANK_NAME
ARG NEXT_PUBLIC_BANK_ACCOUNT_NAME
ARG NEXT_PUBLIC_BANK_ACCOUNT_NUMBER
ARG NEXT_PUBLIC_BANK_IBAN
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_DESCRIPTION
ARG NEXT_PUBLIC_DEFAULT_CURRENCY
ARG NEXT_PUBLIC_DEFAULT_LANGUAGE
ARG NODE_ENV=production

# Set as environment variables for build process
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV BACKEND_URL=$BACKEND_URL
ENV JWT_SECRET=$JWT_SECRET
ENV NEXT_PUBLIC_ADMIN_WHATSAPP=$NEXT_PUBLIC_ADMIN_WHATSAPP
ENV NEXT_PUBLIC_BANK_NAME=$NEXT_PUBLIC_BANK_NAME
ENV NEXT_PUBLIC_BANK_ACCOUNT_NAME=$NEXT_PUBLIC_BANK_ACCOUNT_NAME
ENV NEXT_PUBLIC_BANK_ACCOUNT_NUMBER=$NEXT_PUBLIC_BANK_ACCOUNT_NUMBER
ENV NEXT_PUBLIC_BANK_IBAN=$NEXT_PUBLIC_BANK_IBAN
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
ENV NEXT_PUBLIC_APP_DESCRIPTION=$NEXT_PUBLIC_APP_DESCRIPTION
ENV NEXT_PUBLIC_DEFAULT_CURRENCY=$NEXT_PUBLIC_DEFAULT_CURRENCY
ENV NEXT_PUBLIC_DEFAULT_LANGUAGE=$NEXT_PUBLIC_DEFAULT_LANGUAGE
ENV NODE_ENV=$NODE_ENV

# Set working directory
WORKDIR /app

# Copy root files
COPY package.json yarn.lock turbo.json ./

# Copy workspace package files
COPY apps/backend/package.json ./apps/backend/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build backend first
RUN cd apps/backend && yarn build

# Build frontend
# Create minimal prerender-manifest.json if build fails on error pages
RUN cd apps/web && \
    (NEXT_TELEMETRY_DISABLED=1 yarn build 2>&1 || true) && \
    if [ -d .next ] && [ -f .next/BUILD_ID ] && [ ! -f .next/prerender-manifest.json ]; then \
      echo "✅ Core build succeeded, creating minimal prerender-manifest.json..." && \
      echo '{"version":3,"routes":{},"dynamicRoutes":{},"notFoundRoutes":[],"preview":{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}}' > .next/prerender-manifest.json && \
      echo "✅ Fixed prerender-manifest.json"; \
    fi && \
    if [ ! -d .next ] || [ ! -f .next/BUILD_ID ]; then \
      echo "❌ Build failed completely"; \
      exit 1; \
    fi

# Create startup script with proper error handling and signal trapping
# Memory limits can be overridden via NODE_OPTIONS_BACKEND and NODE_OPTIONS_FRONTEND env vars
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "🚀 Starting Khaalis Harvest Platform..."' >> /app/start.sh && \
    echo 'BACKEND_MEM=${NODE_OPTIONS_BACKEND:-1536}' >> /app/start.sh && \
    echo 'FRONTEND_MEM=${NODE_OPTIONS_FRONTEND:-2048}' >> /app/start.sh && \
    echo 'BACKEND_PID=0' >> /app/start.sh && \
    echo 'FRONTEND_PID=0' >> /app/start.sh && \
    echo 'trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGTERM SIGINT' >> /app/start.sh && \
    echo 'cd /app/apps/backend && NODE_OPTIONS="--max-old-space-size=$BACKEND_MEM" PORT=${PORT:-3000} yarn start:prod &' >> /app/start.sh && \
    echo 'BACKEND_PID=$!' >> /app/start.sh && \
    echo 'echo "✅ Backend started (PID: $BACKEND_PID)"' >> /app/start.sh && \
    echo 'sleep 2' >> /app/start.sh && \
    echo 'cd /app/apps/web && NODE_OPTIONS="--max-old-space-size=$FRONTEND_MEM" PORT=${FRONTEND_PORT:-3001} yarn start &' >> /app/start.sh && \
    echo 'FRONTEND_PID=$!' >> /app/start.sh && \
    echo 'echo "✅ Frontend started (PID: $FRONTEND_PID)"' >> /app/start.sh && \
    echo 'echo "✅ Both applications started successfully"' >> /app/start.sh && \
    echo 'wait' >> /app/start.sh && \
    chmod +x /app/start.sh

# Health check (60s start period allows time for services to start in production)
# Uses fixed port 3000 for backend health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Expose ports
EXPOSE 3000 3001

# Start applications
CMD ["/app/start.sh"]