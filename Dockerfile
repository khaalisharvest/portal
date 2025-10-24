# Khaalis Harvest Platform - Optimized for Railway
FROM node:18-slim as base

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files for dependency caching
COPY package.json yarn.lock ./
COPY apps/*/package.json ./apps/*/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY . .

# Build stage
FROM base as builder

# Build both applications
RUN yarn build

# Production stage
FROM node:18-slim as production

# Install only production dependencies
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY apps/*/package.json ./apps/*/
COPY packages/*/package.json ./packages/*/

# Install production dependencies only
RUN yarn install --frozen-lockfile --production=true && yarn cache clean

# Copy built applications
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/packages ./packages

# Create optimized startup script
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'set -e' >> /app/start.sh && \
    echo 'echo "🚀 Starting Khaalis Harvest Platform..."' >> /app/start.sh && \
    echo 'cd /app/apps/backend && NODE_OPTIONS="--max-old-space-size=1024" PORT=${PORT:-3000} yarn start:prod &' >> /app/start.sh && \
    echo 'cd /app/apps/web && NODE_OPTIONS="--max-old-space-size=1024" PORT=${FRONTEND_PORT:-3001} yarn start &' >> /app/start.sh && \
    echo 'echo "✅ Both applications started"' >> /app/start.sh && \
    echo 'wait' >> /app/start.sh && \
    chmod +x /app/start.sh

# Add health check (using wget instead of curl)
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/api/v1/health || exit 1

# Expose ports (Railway will use PORT environment variable)
EXPOSE 3000 3001

# Start both applications
CMD ["/app/start.sh"]