# Architecture Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring both apps and the monorepo to 10/10 architecture confidence by fixing logging, error handling, TypeScript strictness, shared types, connection pooling, error boundaries, token refresh, and monorepo hygiene — without breaking any existing functionality.

**Architecture:** Changes are isolated to infrastructure/cross-cutting concerns. No business logic is touched. Each task is independently deployable. The order matters: backend hardening first, then monorepo shared layer, then frontend resilience.

**Tech Stack:** NestJS Logger (built-in), TypeORM pooling, Next.js error.tsx, React error boundaries, Yarn workspaces, Turbo, TypeScript strict mode.

**Safety rule:** After every backend change run `cd apps/backend && npx tsc --noEmit 2>&1 | head -30` to confirm no compilation errors. After every frontend change run `cd apps/web && npx tsc --noEmit 2>&1 | head -30`.

---

## Task 1: Monorepo hygiene — remove package-lock.json, fix README, add root tsconfig

**Files:**
- Delete: `package-lock.json` (root)
- Modify: `README.md`
- Create: `tsconfig.base.json` (root)

- [ ] **Step 1: Remove package-lock.json from git tracking**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest
git rm --cached package-lock.json
echo "package-lock.json" >> .gitignore
```

- [ ] **Step 2: Create root tsconfig.base.json**

Create `/Users/ram/Desktop/applications/khaalis-harvest/tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "strict": false,
    "strictNullChecks": true,
    "noImplicitAny": false,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

- [ ] **Step 3: Update backend tsconfig.json to extend base**

Replace `apps/backend/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2020",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": false,
    "paths": {
      "@/*": ["src/*"],
      "@/common/*": ["src/common/*"],
      "@/modules/*": ["src/modules/*"],
      "@/config/*": ["src/config/*"]
    }
  }
}
```

- [ ] **Step 4: Verify backend still compiles**

Run: `cd /Users/ram/Desktop/applications/khaalis-harvest/apps/backend && npx tsc --noEmit 2>&1 | head -40`

If errors appear, they are null-safety issues. Fix each one: add `!` non-null assertion or a null check. The most common pattern will be `configService.get(...)` which already uses `!` in most places.

- [ ] **Step 5: Update README.md — fix stale project name**

In `README.md`, find and replace all occurrences of:
- `livestock-app` → `khaalis-harvest`
- `livestock_test` → `khaalis_harvest`
- Remove any mention of React Native mobile app

- [ ] **Step 6: Commit**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest
git add tsconfig.base.json apps/backend/tsconfig.json README.md .gitignore
git commit -m "chore: add root tsconfig base, remove package-lock.json, fix README"
```

---

## Task 2: Backend — replace console.log with NestJS Logger throughout

NestJS has a built-in `Logger` class. Replace all `console.log/warn/error` calls with it. This gives structured log levels, context tagging, and makes it easy to swap in a production logger later without code changes.

**Files:**
- Modify: `apps/backend/src/main.ts`
- Modify: `apps/backend/src/common/interceptors/logging.interceptor.ts`
- Modify: `apps/backend/src/common/filters/all-exceptions.filter.ts`
- Modify: `apps/backend/src/config/redis.config.ts` (already uses Logger — verify)
- Modify: `apps/backend/src/modules/products/products.service.ts` (has Logger already)
- Modify: `apps/backend/src/seeders/seeder.service.ts`
- Modify: `apps/backend/src/config/env.ts`

- [ ] **Step 1: Replace console.log in main.ts**

In `apps/backend/src/main.ts`, after bootstrap() function is defined, replace the three `console.log` statements at the bottom with:
```typescript
import { Logger } from '@nestjs/common';

// Inside bootstrap():
const logger = new Logger('Bootstrap');
await app.listen(PORT);
logger.log(`API Server running on http://localhost:${PORT}`);
logger.log(`API Documentation: http://localhost:${PORT}/api/docs`);
logger.log(`Environment: ${process.env.NODE_ENV}`);
```

Full updated `apps/backend/src/main.ts`:
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SeederService } from './seeders/seeder.service';
import helmet from 'helmet';
import * as compression from 'compression';
import { PORT, ALLOWED_ORIGINS } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });
  const logger = new Logger('Bootstrap');

  // Run database seeder
  const seederService = app.get(SeederService);
  await seederService.seed();

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // CORS configuration
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Graceful shutdown
  app.enableShutdownHooks();

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Khaalis Harvest API')
    .setDescription("Pakistan's premier organic marketplace API")
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(PORT);
  logger.log(`API Server running on http://localhost:${PORT}`);
  logger.log(`API Docs: http://localhost:${PORT}/api/docs`);
  logger.log(`Environment: ${process.env.NODE_ENV}`);
}

bootstrap();
```

- [ ] **Step 2: Replace LoggingInterceptor with NestJS Logger**

Replace `apps/backend/src/common/interceptors/logging.interceptor.ts`:
```typescript
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const start = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          this.logger.log(`${method} ${url} ${response.statusCode} +${Date.now() - start}ms`);
        },
        error: () => {
          this.logger.warn(`${method} ${url} ERROR +${Date.now() - start}ms`);
        },
      }),
    );
  }
}
```

- [ ] **Step 3: Replace AllExceptionsFilter with Logger-based version**

Replace `apps/backend/src/common/filters/all-exceptions.filter.ts`:
```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || (res as any).error || 'Error';
    } else if (exception instanceof QueryFailedError) {
      // PostgreSQL unique constraint violation
      if ((exception as any).code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'A record with this value already exists.';
      } else {
        status = HttpStatus.BAD_REQUEST;
        message = 'Database error';
      }
      this.logger.error(`DB Error [${(exception as any).code}]: ${exception.message}`);
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
    } else {
      this.logger.error(`Unknown exception: ${JSON.stringify(exception)}`);
    }

    // Only log 5xx as errors; 4xx as warnings
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${status}`);
    } else if (status >= 400) {
      this.logger.warn(`${request.method} ${request.url} → ${status}: ${Array.isArray(message) ? message[0] : message}`);
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: Array.isArray(message) ? message[0] : message,
      ...(Array.isArray(message) && message.length > 1 ? { errors: message } : {}),
    });
  }
}
```

- [ ] **Step 4: Fix console.log in seeder**

In `apps/backend/src/seeders/seeder.service.ts`, read the file and replace all `console.log` and `console.error` calls with NestJS Logger. The Logger is already available in NestJS services via injection or instantiation:

Add at top of class:
```typescript
private readonly logger = new Logger(SeederService.name);
```

Replace `console.log(...)` → `this.logger.log(...)`
Replace `console.error(...)` → `this.logger.error(...)`
Replace `console.warn(...)` → `this.logger.warn(...)`

- [ ] **Step 5: Fix console.error in env.ts**

In `apps/backend/src/config/env.ts`, replace:
```typescript
  console.error(errorMessage);
  console.error('Please create a .env file with all required variables.');
  if (process.env.NODE_ENV === 'development') {
    console.error('See env.template for configuration details.');
  } else {
```
with:
```typescript
  process.stderr.write(`${errorMessage}\n`);
  process.stderr.write('Please create a .env file with all required variables.\n');
  if (process.env.NODE_ENV === 'development') {
    process.stderr.write('See env.template for configuration details.\n');
  } else {
```
(At startup, the NestJS Logger isn't initialized yet, so use process.stderr directly)

- [ ] **Step 6: Verify compilation**

Run: `cd /Users/ram/Desktop/applications/khaalis-harvest/apps/backend && npx tsc --noEmit 2>&1 | head -30`

Expected: no errors

- [ ] **Step 7: Commit**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest
git add apps/backend/src/main.ts \
        apps/backend/src/common/interceptors/logging.interceptor.ts \
        apps/backend/src/common/filters/all-exceptions.filter.ts \
        apps/backend/src/seeders/seeder.service.ts \
        apps/backend/src/config/env.ts
git commit -m "refactor: replace console.log with NestJS Logger throughout backend; add graceful shutdown"
```

---

## Task 3: Backend — TypeORM connection pooling + query logging improvement

**Files:**
- Modify: `apps/backend/src/config/database.config.ts`

- [ ] **Step 1: Add connection pool config to database.config.ts**

Replace the entire `apps/backend/src/config/database.config.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfig implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const dbHost = this.configService.get<string>('DB_HOST')!;
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    const isLocalDatabase = ['postgres', 'localhost', '127.0.0.1'].includes(dbHost);

    return {
      type: 'postgres',
      host: dbHost,
      port: this.configService.get<number>('DB_PORT')!,
      username: this.configService.get<string>('DB_USERNAME')!,
      password: this.configService.get<string>('DB_PASSWORD')!,
      database: this.configService.get<string>('DB_NAME')!,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/../migrations/*{.ts,.js}'],
      synchronize: nodeEnv === 'development',
      logging: nodeEnv === 'development' ? ['error', 'warn', 'migration'] : ['error'],
      ssl: nodeEnv === 'production' && !isLocalDatabase ? { rejectUnauthorized: false } : false,
      // Connection pool — prevents single-connection bottleneck under load
      extra: {
        max: 20,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      },
      retryAttempts: 3,
      retryDelay: 3000,
    };
  }
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd /Users/ram/Desktop/applications/khaalis-harvest/apps/backend && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 3: Commit**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest
git add apps/backend/src/config/database.config.ts
git commit -m "perf: add TypeORM connection pool (max 20, min 2) and retry config"
```

---

## Task 4: Fix shared types package — update to match actual codebase

The existing `packages/shared/src/types/index.ts` has stale types from an old project (wrong roles, wrong Product shape). Update it to match the actual running system.

**Files:**
- Modify: `packages/shared/src/types/index.ts`
- Modify: `packages/shared/tsconfig.json` (if exists; create if not)

- [ ] **Step 1: Check packages/shared tsconfig**

Run: `cat /Users/ram/Desktop/applications/khaalis-harvest/packages/shared/tsconfig.json 2>/dev/null || echo "MISSING"`

If missing, create `packages/shared/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Replace shared types with accurate definitions**

Replace `packages/shared/src/types/index.ts`:
```typescript
// ============================================================
// Shared types between frontend and backend
// These mirror the backend entity/DTO shapes exactly.
// Update here when backend entity fields change.
// ============================================================

export type UserRole = 'customer' | 'staff' | 'super_admin';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  isActive: boolean;
  profileImage?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductStatus = 'draft' | 'active' | 'archived';
export type InventoryType = 'marketplace' | 'warehouse';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  unit: string;
  images: string[];
  categoryId: string;
  productTypeId?: string;
  category?: Category;
  productType?: ProductType;
  inventory?: Inventory[];
  specifications?: Record<string, unknown>;
  status: ProductStatus;
  inventoryType: InventoryType;
  isAvailable: boolean;
  featured: boolean;
  isOrganic: boolean;
  hasVariants: boolean;
  variantName?: string;
  variants?: ProductVariant[];
  tags?: string[];
  marketplaceInfo?: { supplierName?: string; supplierContact?: string };
  adminId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  name: string;
  price: number;
  originalPrice?: number;
  isAvailable: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image?: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductType {
  id: string;
  name: string;
  displayName: string;
  color?: string;
  unit?: string;
  categoryId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Inventory {
  id: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumStock: number;
  maximumStock: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: string;
  isActive: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type PaymentMethod = 'cash_on_delivery' | 'credit_card' | 'debit_card' | 'bank_transfer' | 'digital_wallet';

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  user?: Pick<User, 'id' | 'name' | 'phone' | 'email'>;
  address: OrderAddress;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  cancelledAt?: string;
  cancelReason?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  itemName: string;
  itemImage: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  unit: string;
}

export interface OrderAddress {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: 'home' | 'work' | 'other';
  instructions?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'pending' | 'read' | 'replied' | 'archived';
  adminResponse?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  timestamp: string;
  message?: string;
}
```

- [ ] **Step 3: Build shared package**

Run:
```bash
cd /Users/ram/Desktop/applications/khaalis-harvest/packages/shared && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest
git add packages/shared/src/types/index.ts packages/shared/tsconfig.json
git commit -m "fix: update shared types package to match actual codebase schema and roles"
```

---

## Task 5: Frontend — add error boundaries for route groups

Next.js App Router uses `error.tsx` files as React error boundaries at each route segment. Add them to critical routes so errors show a recovery UI instead of blanking the page.

**Files:**
- Create: `apps/web/src/app/global-error.tsx`
- Create: `apps/web/src/app/error.tsx`
- Create: `apps/web/src/app/admin/error.tsx`
- Create: `apps/web/src/app/account/error.tsx`

- [ ] **Step 1: Create root global-error.tsx (catches errors in root layout)**

Create `apps/web/src/app/global-error.tsx`:
```tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
          <div className="text-center max-w-md px-4">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Something went wrong</h1>
            <p className="text-neutral-600 mb-6">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create root error.tsx (catches errors inside root layout)**

Create `apps/web/src/app/error.tsx`:
```tsx
'use client';

import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center max-w-md px-4">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-2">Something went wrong</h1>
        <p className="text-neutral-600 mb-6">
          An unexpected error occurred. Your data is safe.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:bg-neutral-100 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create admin error boundary**

Create `apps/web/src/app/admin/error.tsx`:
```tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log admin errors for debugging
    console.error('[Admin Error]', error.message, error.digest);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center max-w-md px-4">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Admin panel error</h2>
        <p className="text-gray-500 text-sm mb-6">
          {error.message || 'An unexpected error occurred in the admin panel.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600"
          >
            Retry
          </button>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create account error boundary**

Create `apps/web/src/app/account/error.tsx`:
```tsx
'use client';

import Link from 'next/link';

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center max-w-sm px-4">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-neutral-900 mb-2">Account page error</h2>
        <p className="text-neutral-500 text-sm mb-6">
          Something went wrong loading your account. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
          >
            Retry
          </button>
          <Link href="/" className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg text-sm font-medium hover:bg-neutral-50">
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Verify TypeScript**

Run: `cd /Users/ram/Desktop/applications/khaalis-harvest/apps/web && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 6: Commit**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest
git add apps/web/src/app/global-error.tsx \
        apps/web/src/app/error.tsx \
        apps/web/src/app/admin/error.tsx \
        apps/web/src/app/account/error.tsx
git commit -m "feat: add Next.js error boundaries for root, admin, and account routes"
```

---

## Task 6: Frontend — token refresh flow in AuthContext

Currently if the JWT expires (7-day `auth_token`), the user is simply logged out. The backend returns a `refreshToken` alongside `accessToken` on login. Implement silent token refresh: when a BFF call returns 401, automatically try to refresh the `backend_token` using the stored refresh token, then replay the original request.

**Files:**
- Modify: `apps/web/src/app/api/auth/login/route.ts` (store refreshToken)
- Create: `apps/web/src/app/api/auth/refresh/route.ts`
- Modify: `apps/web/src/contexts/AuthContext.tsx`
- Modify: `apps/web/src/lib/proxy.ts` (add refresh-aware fetch)

- [ ] **Step 1: Update login route to also return and store refreshToken**

Read `apps/web/src/app/api/auth/login/route.ts`. The backend already returns `refreshToken` in `backendData.data`. Update the response to include it:

In the success block, after extracting `accessToken`, also extract:
```typescript
const refreshToken = backendData.data?.refreshToken;
```

Add to the JSON response:
```typescript
return NextResponse.json({
  user,
  token,          // frontend JWT
  backendToken: accessToken,
  refreshToken,   // backend refresh token
});
```

Also set `refreshToken` as an HttpOnly cookie (most secure storage):
```typescript
res.cookies.set('refresh_token', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: '/',
});
```

- [ ] **Step 2: Create refresh BFF route**

Create `apps/web/src/app/api/auth/refresh/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_URL } from '@/config/env.server';

export async function POST(request: NextRequest) {
  try {
    const refreshToken =
      request.cookies.get('refresh_token')?.value ||
      (await request.json().catch(() => ({}))).refreshToken;

    if (!refreshToken) {
      return NextResponse.json({ message: 'No refresh token' }, { status: 401 });
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      return NextResponse.json({ message: 'Refresh failed' }, { status: 401 });
    }

    const data = await response.json();
    const newAccessToken = data.data?.accessToken || data.accessToken;
    const newRefreshToken = data.data?.refreshToken || data.refreshToken;

    const res = NextResponse.json({ backendToken: newAccessToken });

    if (newRefreshToken) {
      res.cookies.set('refresh_token', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    return res;
  } catch {
    return NextResponse.json({ message: 'Refresh error' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Add refresh endpoint to NestJS auth controller**

Read `apps/backend/src/modules/auth/auth.controller.ts`. Add:
```typescript
@Post('refresh')
@ApiOperation({ summary: 'Refresh access token using refresh token' })
async refresh(@Body() body: { refreshToken: string }) {
  return this.authService.refreshToken(body.refreshToken);
}
```

(The `authService.refreshToken` method already exists — added earlier in the session)

- [ ] **Step 4: Update AuthContext to store refreshToken and implement auto-refresh**

In `apps/web/src/contexts/AuthContext.tsx`:

1. Update the `login` function to store `refreshToken`:
```typescript
if (data.ok || response.ok) {
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('backend_token', data.backendToken);
  if (data.refreshToken) {
    localStorage.setItem('refresh_token', data.refreshToken);
  }
  localStorage.setItem('user', JSON.stringify(data.user));
  setUser(data.user);
  // ... rest of login
}
```

2. Add a `refreshBackendToken` helper:
```typescript
const refreshBackendToken = async (): Promise<string | null> => {
  try {
    const storedRefreshToken = localStorage.getItem('refresh_token');
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: storedRefreshToken }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.backendToken) {
        localStorage.setItem('backend_token', data.backendToken);
        return data.backendToken;
      }
    }
    return null;
  } catch {
    return null;
  }
};
```

3. Export `refreshBackendToken` from context so components can use it.

4. Update `logout` to also remove `refresh_token`:
```typescript
localStorage.removeItem('refresh_token');
```

- [ ] **Step 5: Verify TypeScript on web**

Run: `cd /Users/ram/Desktop/applications/khaalis-harvest/apps/web && npx tsc --noEmit 2>&1 | head -20`

- [ ] **Step 6: Commit**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest
git add apps/web/src/app/api/auth/login/route.ts \
        apps/web/src/app/api/auth/refresh/route.ts \
        apps/backend/src/modules/auth/auth.controller.ts \
        apps/web/src/contexts/AuthContext.tsx
git commit -m "feat: implement token refresh flow — silent reauth when backend token expires"
```

---

## Task 7: Frontend — centralize API route constants

All BFF paths are currently hardcoded as strings scattered across 55+ component files. Create a single constants file. This doesn't require updating every component immediately — it provides the canonical reference and can be adopted incrementally.

**Files:**
- Create: `apps/web/src/constants/api-routes.ts`

- [ ] **Step 1: Create api-routes.ts**

Create `apps/web/src/constants/api-routes.ts`:
```typescript
/**
 * Centralized BFF API route constants.
 * All fetch() calls in components should reference these instead of inline strings.
 * This makes it easy to find all callers when a route changes.
 */

export const API = {
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    refresh: '/api/auth/refresh',
    forgotPassword: '/api/auth/forgot-password',
    resetPassword: '/api/auth/reset-password',
    profile: '/api/v1/auth/profile',
    changePassword: '/api/v1/auth/change-password',
  },
  products: {
    list: '/api/v1/products',
    admin: '/api/v1/products/admin',
    byId: (id: string) => `/api/v1/products/${id}`,
    uploadImage: '/api/v1/products/upload-image',
    categories: '/api/v1/products/categories',
    categoriesWithTypes: '/api/v1/products/categories-with-types',
    inventory: (productId: string) => `/api/v1/products/${productId}/inventory`,
  },
  categories: {
    list: '/api/v1/categories',
    byId: (id: string) => `/api/v1/categories/${id}`,
  },
  productTypes: {
    list: '/api/v1/product-types',
    byId: (id: string) => `/api/v1/product-types/${id}`,
  },
  orders: {
    list: '/api/v1/orders',
    byId: (id: string) => `/api/v1/orders/${id}`,
    addresses: '/api/v1/orders/addresses',
    addressById: (id: string) => `/api/v1/orders/addresses/${id}`,
    guestOrder: '/api/v1/orders/guest',
    adminList: '/api/v1/admin/orders',
    adminStatusById: (id: string) => `/api/v1/admin/orders/${id}/status`,
  },
  users: {
    customers: '/api/v1/admin/users/customers',
    statusById: (id: string) => `/api/v1/admin/users/${id}/status`,
  },
  staff: {
    list: '/api/v1/admin/staff',
    byId: (id: string) => `/api/v1/admin/staff/${id}`,
    statusById: (id: string) => `/api/v1/admin/staff/${id}/status`,
    activity: '/api/v1/admin/staff/activity',
    activityById: (id: string) => `/api/v1/admin/staff/${id}/activity`,
  },
  contacts: {
    list: '/api/v1/contacts',
    stats: '/api/v1/contacts/stats',
    byId: (id: string) => `/api/v1/contacts/${id}`,
    readById: (id: string) => `/api/v1/contacts/${id}/read`,
  },
  dashboard: {
    stats: '/api/v1/admin/dashboard',
  },
  settings: {
    delivery: '/api/v1/settings/delivery',
    payment: '/api/v1/settings/payment',
    contact: '/api/v1/settings/contact',
    social: '/api/v1/settings/social',
    store: '/api/v1/settings/store',
    orders: '/api/v1/settings/orders',
    notificationBar: '/api/v1/settings/notification-bar',
  },
  userTypes: {
    list: '/api/super-admin/user-types',
    byId: (id: string) => `/api/super-admin/user-types/${id}`,
  },
  wishlist: {
    list: '/api/v1/wishlist',
    toggle: (productId: string) => `/api/v1/wishlist/${productId}`,
    check: (productId: string) => `/api/v1/wishlist/${productId}/check`,
  },
  reviews: {
    byProduct: (productId: string) => `/api/v1/products/${productId}/reviews`,
  },
  public: {
    settings: '/api/v1/public/settings',
  },
} as const;
```

- [ ] **Step 2: Verify TypeScript**

Run: `cd /Users/ram/Desktop/applications/khaalis-harvest/apps/web && npx tsc --noEmit 2>&1 | head -10`

- [ ] **Step 3: Commit**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest
git add apps/web/src/constants/api-routes.ts
git commit -m "feat: add centralized API route constants file"
```

---

## Task 8: Backend — enable strictNullChecks and fix compilation errors

Enable `strictNullChecks: true` in the backend TypeScript config. Then fix all resulting compilation errors. This catches null-pointer bugs at compile time rather than at runtime in production.

**Files:**
- Modify: `apps/backend/tsconfig.json` (already set to true from Task 1)
- Fix: any files that produce errors

- [ ] **Step 1: Run tsc to see all errors**

Run: `cd /Users/ram/Desktop/applications/khaalis-harvest/apps/backend && npx tsc --noEmit 2>&1`

Capture and fix every error. Common patterns to fix:

**Pattern A: `configService.get(...)` returning `string | undefined`**
```typescript
// Before (was fine with strictNullChecks: false):
const host = configService.get('DB_HOST');
// After:
const host = configService.get<string>('DB_HOST')!;
```

**Pattern B: optional chaining with method call**
```typescript
// Before:
user.name.toLowerCase()
// After:
user.name?.toLowerCase() ?? ''
```

**Pattern C: array index access**
```typescript
// Before:
const first = items[0].value;
// After:
const first = items[0]?.value;
```

**Pattern D: implicit `any` in catch**
```typescript
// Before:
} catch (error) { error.message }
// After:
} catch (error) { (error as Error).message }
```

- [ ] **Step 2: Fix each error — run tsc after each file fix to confirm**

Fix errors file-by-file. After fixing each file, run:
```bash
cd /Users/ram/Desktop/applications/khaalis-harvest/apps/backend && npx tsc --noEmit 2>&1 | grep "error TS" | wc -l
```

Continue until output is `0`.

- [ ] **Step 3: Confirm zero errors**

Run: `cd /Users/ram/Desktop/applications/khaalis-harvest/apps/backend && npx tsc --noEmit 2>&1`

Expected: no output (exit code 0)

- [ ] **Step 4: Commit**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest
git add apps/backend/
git commit -m "refactor: enable strictNullChecks on backend — fix all null safety issues"
```

---

## Task 9: Turbo pipeline — ensure shared package builds before apps

Currently `turbo.json` has `"build": { "dependsOn": ["^build"] }` which means `packages/shared` must build before `apps/*`. But the shared package's `tsconfig.json` may not have `composite: true` set. Verify the full build works.

**Files:**
- Modify: `turbo.json`
- Verify: `packages/shared/tsconfig.json`

- [ ] **Step 1: Add type-check to turbo pipeline for shared**

Update `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "dependsOn": ["^type-check"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 2: Run full monorepo type-check**

Run: `cd /Users/ram/Desktop/applications/khaalis-harvest && yarn type-check 2>&1 | tail -20`

Expected: All packages pass with no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest
git add turbo.json
git commit -m "chore: add type-check dependency chain to turbo pipeline"
```

---

## Self-Review

**Spec coverage check:**
- [x] Remove package-lock.json → Task 1
- [x] Root tsconfig.base.json → Task 1
- [x] Backend console.log → NestJS Logger → Task 2
- [x] AllExceptionsFilter improved → Task 2
- [x] Graceful shutdown → Task 2 (enableShutdownHooks in main.ts)
- [x] TypeORM connection pooling → Task 3
- [x] Shared types fixed → Task 4
- [x] Frontend error boundaries → Task 5
- [x] Token refresh flow → Task 6
- [x] API route constants → Task 7
- [x] strictNullChecks on backend → Task 8
- [x] Turbo pipeline → Task 9
- [x] README fix → Task 1

**Migrations explicitly excluded per user instruction.**
**Moving localStorage tokens to HttpOnly cookies excluded — too risky without testing env, auth_token cookie already set httpOnly in login route.**
**noImplicitAny excluded — would require touching 100+ files; strictNullChecks alone gives 90% of the value.**
