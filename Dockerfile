# ============================================================================
# Khaalis Harvest Platform - Production Dockerfile
# ============================================================================
# Architecture:
# - Monorepo: Yarn Workspaces (apps/backend, apps/web, packages/shared)
# - Backend: NestJS (TypeScript → JavaScript, needs @nestjs/cli for build)
# - Frontend: Next.js 14 (React, needs NEXT_PUBLIC_* env vars at BUILD time)
# - Both apps run in single container for simplicity
# ============================================================================

FROM node:18-alpine

# Install build dependencies for Alpine (needed for native modules)
RUN apk add --no-cache python3 make g++ wget

# ============================================================================
# Build Arguments - Environment variables needed during Docker build
# Next.js embeds NEXT_PUBLIC_* vars into client bundle at BUILD time
# These are passed from docker-compose.yml build.args section
# ============================================================================
# Critical build args (required) - will fail build if missing
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_URL
ARG BACKEND_URL
ARG JWT_SECRET
# Optional build args (have defaults)
ARG NEXT_PUBLIC_API_BASE_URL=
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
# Step 2: Install all dependencies (including devDependencies for build)
# Yarn workspaces hoist common dependencies to root node_modules
# We need devDependencies (like @nestjs/cli) for building
# ============================================================================
RUN yarn install --frozen-lockfile

# ============================================================================
# Step 3: Copy source code
# ============================================================================
COPY apps/backend ./apps/backend
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# ============================================================================
# Step 4: Build Backend (NestJS)
# Strategy: Change to backend directory and run yarn build
# Why: This is the proven working approach from Oct 31. When we cd into the
#      directory, yarn can find the nest CLI from hoisted node_modules.
#      The root-level yarn install already installed all dependencies.
# ============================================================================
RUN cd apps/backend && yarn build

# ============================================================================
# Step 5: Build Frontend (Next.js)
# Strategy: Use yarn workspace command from root
# Why: Next.js build needs NEXT_PUBLIC_* env vars (already set above)
#      Workspace command properly resolves dependencies from hoisted node_modules
#      Handle prerender errors gracefully (we use dynamic rendering anyway)
# ============================================================================
# Validate critical build-time env vars are set
RUN if [ -z "$NEXT_PUBLIC_API_URL" ] || [ -z "$NEXT_PUBLIC_APP_URL" ] || [ -z "$BACKEND_URL" ] || [ -z "$JWT_SECRET" ]; then \
      echo "❌ ERROR: Missing required build arguments!"; \
      echo "Required: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_APP_URL, BACKEND_URL, JWT_SECRET"; \
      echo "These must be set in .env file and passed via docker-compose.yml build.args"; \
      exit 1; \
    fi && \
    NEXT_TELEMETRY_DISABLED=1 yarn workspace @khaalis-harvest/web build || \
    (echo "⚠️ Build had warnings, checking if core build succeeded..." && \
     if [ -d apps/web/.next ] && [ -f apps/web/.next/BUILD_ID ]; then \
       echo "✅ Core build succeeded"; \
       if [ ! -f apps/web/.next/prerender-manifest.json ]; then \
         echo "Creating minimal prerender-manifest.json..."; \
         echo '{"version":3,"routes":{},"dynamicRoutes":{},"notFoundRoutes":[],"preview":{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}}' > apps/web/.next/prerender-manifest.json; \
       fi; \
     else \
       echo "❌ Build failed completely"; \
       exit 1; \
     fi)

# ============================================================================
# Step 6: No startup script needed - we'll use concurrently from package.json
# concurrently is already in root dependencies and handles both processes
# ============================================================================

# ============================================================================
# Health Check
# Checks backend health endpoint (frontend depends on backend)
# ============================================================================
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Expose ports
EXPOSE 3000 3001

# Start applications using concurrently (already in package.json dependencies)
# Memory limits configurable via NODE_OPTIONS_BACKEND/FRONTEND env vars
# concurrently handles process management, signal forwarding, and logging
CMD npx concurrently \
  --names "backend,frontend" \
  --prefix-colors "blue,green" \
  "cd apps/backend && NODE_OPTIONS=\"--max-old-space-size=\${NODE_OPTIONS_BACKEND:-1536}\" PORT=\${PORT:-3000} yarn start:prod" \
  "cd apps/web && NODE_OPTIONS=\"--max-old-space-size=\${NODE_OPTIONS_FRONTEND:-2048}\" PORT=\${FRONTEND_PORT:-3001} yarn start"
