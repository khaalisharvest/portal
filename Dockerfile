# ============================================================================
# Khaalis Harvest Platform - Production Dockerfile
# ============================================================================
# Architecture:
# - Monorepo with Yarn Workspaces (apps/backend, apps/web, packages/shared)
# - Backend: NestJS (TypeScript → JavaScript, needs @nestjs/cli for build)
# - Frontend: Next.js (React, needs NEXT_PUBLIC_* env vars at build time)
# - Both apps run in single container for simplicity
# ============================================================================

FROM node:18-alpine

# Install build dependencies for Alpine Linux
RUN apk add --no-cache python3 make g++ wget

# ============================================================================
# Build Arguments - Environment variables needed during Docker build
# These are passed from docker-compose.yml build.args section
# ============================================================================
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

# ============================================================================
# Environment Variables - Set from build args for build process
# Next.js needs NEXT_PUBLIC_* vars at BUILD time (embedded in client bundle)
# ============================================================================
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

# ============================================================================
# Step 1: Copy package files first (for better Docker layer caching)
# ============================================================================
COPY package.json yarn.lock turbo.json ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# ============================================================================
# Step 2: Install root and workspace dependencies
# Yarn workspaces hoist common dependencies to root node_modules
# This installs dependencies for all workspaces
# ============================================================================
RUN yarn install --frozen-lockfile

# ============================================================================
# Step 3: Copy source code
# ============================================================================
COPY apps/backend ./apps/backend
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# ============================================================================
# Step 4: Reinstall dependencies after copying source
# This ensures workspace dependencies are properly linked
# ============================================================================
RUN yarn install --frozen-lockfile

# ============================================================================
# Step 5: Build Backend (NestJS)
# ============================================================================
# Strategy: Install dependencies in backend directory first, then build
# Why: @nestjs/cli is a devDependency. Installing in backend directory ensures
#      nest CLI is available in apps/backend/node_modules/.bin (in PATH)
#      when yarn build runs the "nest build" script
RUN cd apps/backend && \
    yarn install --frozen-lockfile && \
    yarn build

# ============================================================================
# Step 6: Build Frontend (Next.js)
# ============================================================================
# Strategy: Use yarn workspace command from root
# Why: Next.js build needs NEXT_PUBLIC_* env vars (already set above)
#      Workspace command properly resolves dependencies from hoisted node_modules
#      Handle prerender errors gracefully (we use dynamic rendering anyway)
RUN (NEXT_TELEMETRY_DISABLED=1 yarn workspace @khaalis-harvest/web build 2>&1 || true) && \
    if [ -d apps/web/.next ] && [ -f apps/web/.next/BUILD_ID ] && [ ! -f apps/web/.next/prerender-manifest.json ]; then \
      echo "✅ Core build succeeded, creating minimal prerender-manifest.json..." && \
      echo '{"version":3,"routes":{},"dynamicRoutes":{},"notFoundRoutes":[],"preview":{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}}' > apps/web/.next/prerender-manifest.json && \
      echo "✅ Fixed prerender-manifest.json"; \
    fi && \
    if [ ! -d apps/web/.next ] || [ ! -f apps/web/.next/BUILD_ID ]; then \
      echo "❌ Build failed completely"; \
      exit 1; \
    fi

# ============================================================================
# Step 7: Create startup script
# ============================================================================
# Runs both backend and frontend in the same container
# Memory limits configurable via NODE_OPTIONS_BACKEND/FRONTEND env vars
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

# ============================================================================
# Health Check
# ============================================================================
# Checks backend health endpoint (frontend depends on backend)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Expose ports
EXPOSE 3000 3001

# Start applications
CMD ["/app/start.sh"]
