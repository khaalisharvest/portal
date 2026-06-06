# Khaalis Harvest — Agent Context Document

> **Purpose:** This is the single source of truth for any agent or developer working on this codebase. Read this fully before touching any file. Every architectural decision, coding convention, and known gap is documented here.

---

## 1. Business Context

**Khaalis Harvest** (خالص ہارویسٹ) is a Pakistan-based online marketplace for organic natural products — fruits, vegetables, dairy, spices, plants, and herbs. It is a B2C platform: admin manages products, customers browse and order.

- **Phase 1**: Pakistan-only, PKR currency, Cash on Delivery + Bank Transfer payments
- **Phase 2** (future): Expand regions, add JazzCash/EasyPaisa payment gateways
- **Language**: English UI, Urdu font (Noto Nastaliq Urdu) available in Tailwind config for Urdu text
- **Target users**: Local Pakistani customers ordering fresh produce online

---

## 2. Architecture — The Definitive Decision

```
┌─────────────────────────────┐        ┌─────────────────────────────┐
│   Next.js 14 Frontend       │ HTTPS  │   NestJS 10 Backend         │
│   apps/web/  (port 3001)    │──────► │   apps/backend/ (port 3000) │
│                             │        │                             │
│  All API calls go through   │        │  REST API at /api/v1/*      │
│  Next.js API route proxies  │        │  PostgreSQL + Redis          │
│  at /api/v1/* which forward │        │  JWT Auth, TypeORM          │
│  to BACKEND_URL             │        │                             │
└─────────────────────────────┘        └─────────────────────────────┘
        │                                         │
        └────────── Both run in ONE Docker ───────┘
                    container in production
```

### Why this architecture
- **Not Supabase**: An attempted Supabase migration was abandoned. It broke guest checkout (required auth for orders), split auth between localStorage JWT and Supabase cookies, and had an empty schema stub. The NestJS backend is the only backend.
- **Separate apps in one container**: Both NestJS (3000) and Next.js (3001) run in a single Docker container via `concurrently`. This simplifies Oracle Cloud deployment — one VM, one `docker-compose up`.
- **Next.js as proxy**: Next.js API routes at `apps/web/src/app/api/v1/*` proxy ALL requests to the NestJS backend. This keeps the frontend clean (no direct backend URL in browser code) and allows CORS to be handled server-side.

### The request flow
```
Browser → http://localhost:3001/api/v1/products
       → apps/web/src/app/api/v1/products/route.ts
       → fetch(BACKEND_URL + '/api/v1/products')  [server-side]
       → NestJS at http://localhost:3000/api/v1/products
       → Response flows back
```

---

## 3. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Backend framework | NestJS | 10.x |
| Backend language | TypeScript | 5.x |
| ORM | TypeORM | 0.3.x |
| Database | PostgreSQL | 15 |
| Cache | Redis | 7 |
| Auth | JWT (Passport) | — |
| File upload | Multer (disk storage) | built-in |
| Email | Nodemailer | 6.x |
| API docs | Swagger/OpenAPI | — |
| Frontend framework | Next.js | 14.0.4 |
| Frontend language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| Animation | Framer Motion | 10.x |
| State (cart) | React Context (CartContext) | — |
| State (global) | Redux Toolkit (auth slice only) | — |
| Data fetching | React Query (TanStack) | 5.x |
| Forms | React Hook Form + Zod | — |
| Toast | react-hot-toast | — |
| Monorepo | Yarn Workspaces + Turbo | — |
| Container | Docker + docker-compose | — |
| Deployment target | Oracle Cloud Always Free ARM VM | — |

---

## 4. Monorepo Structure

```
khaalis-harvest/
├── apps/
│   ├── backend/                    # NestJS API
│   │   ├── src/
│   │   │   ├── app.module.ts       # Root module — imports everything
│   │   │   ├── main.ts             # Bootstrap, CORS, Swagger
│   │   │   ├── config/
│   │   │   │   ├── env.ts          # ← SINGLE SOURCE OF TRUTH for env vars
│   │   │   │   ├── database.config.ts
│   │   │   │   ├── redis.config.ts
│   │   │   │   └── throttler.config.ts
│   │   │   ├── common/
│   │   │   │   └── guards/
│   │   │   │       ├── roles.guard.ts     # Role-based access control
│   │   │   │       └── active-user.guard.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/           # Login, register, JWT, password reset
│   │   │   │   ├── users/          # User CRUD, admin user management
│   │   │   │   ├── products/       # Products, categories, suppliers, reviews, wishlist, upload
│   │   │   │   ├── product-types/  # Dynamic product schema definitions
│   │   │   │   ├── orders/         # Orders, order items, addresses, admin orders
│   │   │   │   ├── contacts/       # Contact form submissions
│   │   │   │   ├── settings/       # App configuration (delivery fee, etc.)
│   │   │   │   └── notifications/  # Email service + templates
│   │   │   └── seeders/            # Initial data (super admin + delivery settings)
│   │   └── uploads/                # Product images (persisted via Docker volume)
│   └── web/                        # Next.js frontend
│       └── src/
│           ├── app/                # Next.js App Router
│           │   ├── page.tsx        # Home
│           │   ├── products/       # Browse + detail
│           │   ├── cart/           # Shopping cart
│           │   ├── checkout/       # Checkout flow
│           │   ├── orders/         # Order history + detail + confirmation
│           │   ├── wishlist/       # Saved products
│           │   ├── account/        # Profile, addresses, security
│           │   ├── auth/           # Login, signup, forgot/reset password
│           │   ├── admin/          # Full admin panel
│           │   ├── contact/        # Contact form
│           │   ├── about/          # About page
│           │   └── api/            # Next.js API routes (proxy to NestJS)
│           ├── components/
│           │   ├── ui/             # Reusable UI components
│           │   ├── layout/         # Header, Footer, AdminLayout, AdminSidebar
│           │   ├── sections/       # Home page sections (Hero, FeaturedProducts, etc.)
│           │   ├── admin/          # Admin-specific components
│           │   ├── auth/           # ProtectedRoute
│           │   └── super-admin/    # Super admin management components
│           ├── contexts/
│           │   ├── AuthContext.tsx  # Auth state (user, login, logout, isLoading)
│           │   ├── CartContext.tsx  # Cart state (items, add, remove, clear) — localStorage
│           │   └── FilterContext.tsx # Product filter state
│           ├── hooks/              # Custom hooks (useProducts, useSettings, useDropdown)
│           ├── services/           # API service layers
│           ├── store/              # Redux (auth slice only — cart uses Context)
│           ├── utils/              # Phone validation, Supabase utils (unused)
│           └── config/env.ts       # Frontend env var exports
├── packages/shared/                # Shared types and utilities
├── docker-compose.yml              # Production (app + postgres + redis + nginx + certbot)
├── docker-compose.dev.yml          # Development (full stack, no nginx)
├── Dockerfile                      # node:18-slim, builds both apps, runs with concurrently
├── env.template                    # Template for .env — ALWAYS update when adding env vars
├── ORACLE_DEPLOYMENT.md            # Step-by-step Oracle Cloud deployment guide
└── docs/
    ├── AGENT_CONTEXT.md            # ← THIS FILE
    └── superpowers/plans/          # Historical implementation plans
```

---

## 5. Database Entities (PostgreSQL via TypeORM)

### Core entities and their relationships

```
users
  ├── orders (one-to-many)
  ├── addresses (one-to-many)
  ├── reviews (one-to-many)
  └── wishlists (one-to-many)

product_categories
  ├── products (one-to-many)
  └── product_types (one-to-many)

product_types
  └── products (one-to-many)

products
  ├── category (many-to-one → product_categories)
  ├── productType (many-to-one → product_types)
  ├── supplier (many-to-one → suppliers)
  ├── inventory (one-to-one → inventory)
  ├── reviews (one-to-many → reviews)
  ├── wishlists (one-to-many → wishlists)
  └── components (many-to-many → product_components for bundles)

inventory
  └── product (one-to-one → products)

orders
  ├── user (many-to-one → users, nullable for guest orders)
  ├── address (many-to-one → addresses)
  └── items (one-to-many → order_items)

order_items
  └── order (many-to-one → orders)

addresses
  └── user (many-to-one → users, nullable for guest addresses)

reviews
  ├── product (many-to-one → products)
  └── user (many-to-one → users)
  [UNIQUE INDEX: userId + productId — one review per user per product]

wishlists
  ├── product (many-to-one → products)
  └── user (many-to-one → users)
  [UNIQUE INDEX: userId + productId — one entry per user per product]

suppliers (standalone)
settings (key-value store, standalone)
contacts (standalone — contact form submissions)
```

### Key field notes
- `users.resetToken` — has `select: false`, use QueryBuilder with `.addSelect('user.resetToken')` to load it
- `users.resetTokenExpiry` — timestamps in UTC
- `orders.userId` — NULLABLE (guest orders have no user)
- `addresses.userId` — NULLABLE (guest addresses)
- `products.images` — JSON array of URL strings
- `products.variants` — JSON array of `{name, price, isAvailable}` objects
- `products.specifications` — JSON object (dynamic fields per product type)
- `inventory.reservedQuantity` — incremented on order creation, decremented on cancellation
- `settings` — key-value store, seeded with delivery settings on first startup

---

## 6. Authentication & Authorization

### JWT Flow
1. User logs in with phone + password → `POST /api/v1/auth/login`
2. Backend returns `{ accessToken, refreshToken, user }`
3. Frontend stores `auth_token` (access token) and `user` in localStorage
4. Every authenticated request sends `Authorization: Bearer <token>` header
5. JWT payload: `{ sub: userId }` — strategy looks up user and returns `{ userId, role, isActive }` in `req.user`

### Role System
```
super_admin  — full access to everything
admin        — same as super_admin for most operations
customer     — can browse, cart, checkout, view own orders/wishlist
```

### Guard Pattern
Every controller uses TWO guards together:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
```

`JwtAuthGuard` → validates JWT token, populates `req.user`
`RolesGuard` → reads `req.user.role`, checks against `@Roles(...)` metadata

**CRITICAL:** `RolesGuard` reads role directly from `req.user.role` (set by JwtStrategy). It does NOT query the database. This means the JWT strategy must include role in its return value.

### Public endpoints (no auth required)
- `GET /api/v1/products` and `GET /api/v1/products/:id`
- `GET /api/v1/products/categories` and `categories-with-types`
- `POST /api/v1/auth/login` and `POST /api/v1/auth/register`
- `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password`
- `POST /api/v1/contacts`
- `GET /api/v1/public/settings/delivery/calculate`
- `GET /api/v1/health`

### Optional auth endpoints
- `POST /api/v1/orders` — uses `OptionalJwtAuthGuard` (works for both guest and auth users)

### Frontend route protection
Use `<ProtectedRoute requiredRoles={['admin', 'super_admin']}>` wrapper in admin pages. `ProtectedRoute` checks `user.role` from `AuthContext`.

**IMPORTANT:** Never include `'customer'` in admin page `requiredRoles`. Customers must never access admin pages.

---

## 7. Environment Variables — Complete Reference

All backend env vars are centralized in `apps/backend/src/config/env.ts`. **NEVER** use `process.env.X` directly in services or controllers — always import from `env.ts`.

### Required (app won't start without these in production)

| Variable | Used In | Description |
|---|---|---|
| `DATABASE_URL` | database.config.ts | PostgreSQL connection string |
| `JWT_SECRET` | auth.module.ts | JWT signing secret — use `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | auth.module.ts | e.g. `7d` |
| `PORT` | main.ts | NestJS port (3000) |
| `NODE_ENV` | everywhere | `development` or `production` |
| `FRONTEND_URL` | auth.service.ts, CORS | e.g. `http://localhost:3001` |
| `ADMIN_URL` | CORS | Same as FRONTEND_URL usually |
| `BACKEND_URL` | upload.controller.ts, web env | e.g. `http://localhost:3000` |
| `ALLOWED_ORIGINS` | main.ts CORS | Comma-separated: `http://localhost:3000,http://localhost:3001` |
| `SMTP_FROM` | email.service.ts | Sender email address |
| `ADMIN_EMAIL` | orders.service.ts | Admin email for new order notifications |
| `ADMIN_WHATSAPP` | email templates | Admin WhatsApp number (shown in emails) |
| `UPLOAD_PATH` | upload.controller.ts, app.module.ts | `./uploads` (relative to app working dir) |
| `MAX_FILE_SIZE_MB` | upload.controller.ts | Max upload size, e.g. `5` |

### Optional (feature degrades gracefully when absent)

| Variable | Used In | Behavior when absent |
|---|---|---|
| `SMTP_HOST` | email.service.ts | Emails logged to console only |
| `SMTP_PORT` | email.service.ts | Defaults to undefined |
| `SMTP_USER` | email.service.ts | Emails logged to console only |
| `SMTP_PASS` | email.service.ts | Emails logged to console only |

### Next.js public vars (embedded in client bundle at BUILD TIME)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Full URL to Next.js API: `http://localhost:3001/api/v1` |
| `NEXT_PUBLIC_APP_URL` | Frontend URL: `http://localhost:3001` |
| `NEXT_PUBLIC_APP_NAME` | `Khaalis Harvest` |
| `NEXT_PUBLIC_APP_DESCRIPTION` | Marketplace tagline |
| `NEXT_PUBLIC_DEFAULT_CURRENCY` | `PKR` |
| `NEXT_PUBLIC_DEFAULT_LANGUAGE` | `en` |
| `NEXT_PUBLIC_ADMIN_WHATSAPP` | Admin WhatsApp number (shown in UI) |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Admin email (shown in UI) |
| `NEXT_PUBLIC_BANK_NAME` | Bank name for bank transfer checkout |
| `NEXT_PUBLIC_BANK_ACCOUNT_NAME` | Account holder name |
| `NEXT_PUBLIC_BANK_ACCOUNT_NUMBER` | Account number |
| `NEXT_PUBLIC_BANK_IBAN` | IBAN for bank transfer |

### Docker-only vars

| Variable | Description |
|---|---|
| `DB_HOST` | Set to `postgres` (Docker service name) in compose |
| `DB_PORT` | Internal: `5432`, External host: `5433` |
| `DB_USERNAME` | PostgreSQL username |
| `DB_PASSWORD` | PostgreSQL password |
| `DB_NAME` | `khaalis_harvest` |
| `REDIS_HOST` | Set to `redis` in compose |
| `REDIS_PORT` | `6379` |
| `INTERNAL_BACKEND_URL` | `http://localhost:3000` — used by Next.js proxy routes inside same container |
| `NODE_OPTIONS_BACKEND` | Node.js max heap for NestJS (MB), e.g. `1536` |
| `NODE_OPTIONS_FRONTEND` | Node.js max heap for Next.js (MB), e.g. `2048` |
| `FRONTEND_PORT` | `3001` |

---

## 8. Coding Conventions & Rules

### Rule 1: No hardcoded values, no fallbacks
```typescript
// ❌ WRONG
const dir = process.env.UPLOAD_PATH || './uploads';

// ✅ CORRECT
import { env } from '../../../config/env';
const dir = env.UPLOAD_PATH;
```

When adding new env vars:
1. Add to `apps/backend/src/config/env.ts` `requiredEnvVars` object (if required) or just to `env` export (if optional)
2. Add to `apps/backend/.env` with a value
3. Add to `env.template` with documentation
4. If it's a `NEXT_PUBLIC_*` var, also add to the Dockerfile `ARG`/`ENV` section and to docker-compose `build.args`

### Rule 2: Auth guards always come in pairs
```typescript
// ❌ WRONG — only JWT, no role check
@UseGuards(JwtAuthGuard)

// ✅ CORRECT — JWT validates token, RolesGuard checks role
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
```

Import guards from: `'../../auth/guards/jwt-auth.guard'` and `'../../../common/guards/roles.guard'` (adjust path based on file location).

### Rule 3: Every new NestJS feature needs ALL these pieces
1. **Entity** in `entities/` directory with TypeORM decorators
2. **DTO** in `dto/` directory with class-validator decorators
3. **Service** in `services/` directory (or directly in module dir)
4. **Controller** in `controllers/` directory
5. **Register ALL of these in the module's `@Module()` decorator** — TypeOrmModule.forFeature([Entity]), controllers: [], providers: [], exports: []
6. **Next.js proxy route** at `apps/web/src/app/api/v1/[feature]/route.ts`

### Rule 4: No direct DB queries in controllers
All database operations go through services. Controllers only handle HTTP layer.

### Rule 5: Transactions for multi-step DB operations
Any operation that touches multiple tables must use `QueryRunner`:
```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.connect();
await queryRunner.startTransaction();
try {
  // all operations via queryRunner.manager
  await queryRunner.commitTransaction();
} catch (err) {
  await queryRunner.rollbackTransaction();
  throw err;
} finally {
  await queryRunner.release();
}
```

### Rule 6: Fire-and-forget notifications
Emails and notifications must NEVER block the order response. Use `setImmediate` with captured data:
```typescript
// Capture data BEFORE setImmediate (prevent stale closure)
const notificationData = { orderNumber: order.orderNumber, ... };
setImmediate(() => {
  this.emailService.send(...).catch(err => this.logger.error(err.message));
});
```

### Rule 7: Prices are always server-side
When creating orders, always fetch product prices from the database. Never trust client-provided prices:
```typescript
const product = products.find(p => p.id === item.productId);
const unitPrice = product.price; // NOT item.price from client
```

### Rule 8: Frontend cart = CartContext only
**Redux cartSlice has been removed.** Do not create or use a Redux cart slice. All cart operations go through `CartContext` at `apps/web/src/contexts/CartContext.tsx`. Cart is persisted to `localStorage`.

### Rule 9: Admin frontend pages always use ProtectedRoute
```tsx
export default function AdminSomePage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'admin']}>
      <AdminLayout>
        {/* content */}
      </AdminLayout>
    </ProtectedRoute>
  );
}
```

Never add `'customer'` to admin page roles.

### Rule 10: Image onError handlers everywhere
```tsx
<Image
  src={product.images?.[0] || '/images/placeholder.svg'}
  alt={product.name}
  onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
/>
```

---

## 9. API Endpoint Map

### Backend (NestJS at port 3000)

#### Auth (public)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/auth/register` | None | Create account |
| POST | `/api/v1/auth/login` | None | Login, returns JWT |
| GET | `/api/v1/auth/profile` | JWT | Current user profile |
| POST | `/api/v1/auth/forgot-password` | None | Send reset link (rate-limited: 3/15min) |
| POST | `/api/v1/auth/reset-password` | None | Reset with token (rate-limited: 5/5min) |

#### Products (mostly public)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/products` | None | Browse (filter: category, type, featured, search, page, limit) |
| GET | `/api/v1/products/:id` | None | Product detail |
| GET | `/api/v1/products/categories` | None | All categories |
| GET | `/api/v1/products/categories-with-types` | None | Categories with nested product types |
| POST | `/api/v1/products` | JWT+Admin | Create product |
| PATCH | `/api/v1/products/:id` | JWT+Admin | Update product |
| DELETE | `/api/v1/products/:id` | JWT+Admin | Delete product |
| POST | `/api/v1/upload/image` | JWT+Admin | Upload product image → returns `{ url, filename }` |

#### Reviews (nested under products)
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/products/:productId/reviews` | None | Get reviews + avgRating |
| POST | `/api/v1/products/:productId/reviews` | JWT | Create review (sets isVerified=false) |
| DELETE | `/api/v1/products/:productId/reviews/:reviewId` | JWT | Delete own review (or admin) |

#### Wishlist
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/wishlist` | JWT | Get user's wishlist |
| POST | `/api/v1/wishlist/:productId` | JWT | Toggle product in/out of wishlist |
| GET | `/api/v1/wishlist/:productId/check` | JWT | Check if product is wishlisted |

#### Orders
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/orders` | Optional JWT | Create order (guest or authenticated) |
| GET | `/api/v1/orders` | JWT | User's orders (paginated) |
| GET | `/api/v1/orders/:id` | JWT | Order detail (own orders only) |
| PATCH | `/api/v1/orders/:id/cancel` | JWT | Cancel order |
| GET | `/api/v1/orders/addresses` | JWT | User's saved addresses |
| POST | `/api/v1/orders/addresses` | JWT | Add address |
| PATCH | `/api/v1/orders/addresses/:id` | JWT | Update address |
| DELETE | `/api/v1/orders/addresses/:id` | JWT | Delete address |

#### Admin Orders
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/admin/orders/dashboard` | JWT+Admin | Stats: revenue, counts, recent orders |
| GET | `/api/v1/admin/orders` | JWT+Admin | All orders (filter: status, search) |
| PATCH | `/api/v1/admin/orders/:id/status` | JWT+Admin | Update order status |

#### Admin Users
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/admin/users` | JWT+Admin | All users (paginated) |
| GET | `/api/v1/admin/users/customers` | JWT+Admin | Customers only |
| GET | `/api/v1/admin/users/:id/details` | JWT+Admin | User with stats |
| PATCH | `/api/v1/admin/users/:id/status` | JWT+Admin | Activate/deactivate |
| PATCH | `/api/v1/admin/users/:id/role` | JWT+Admin | Change role |

#### Settings
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/v1/public/settings/delivery/calculate` | None | Calculate delivery fee |
| GET | `/api/v1/settings/delivery` | JWT+Admin | Get delivery settings |
| PATCH | `/api/v1/settings/delivery` | JWT+Admin | Update delivery settings |
| GET | `/api/v1/settings/notification-bar` | None | Notification bar text |
| PATCH | `/api/v1/settings/notification-bar` | JWT+Admin | Update notification bar |

#### Contacts
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/contacts` | None | Submit contact form |
| GET | `/api/v1/contacts` | JWT+Admin | All contact submissions |
| PATCH | `/api/v1/contacts/:id/read` | JWT+Admin | Mark as read |

#### Categories & Suppliers (Admin)
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/categories` | JWT+Admin | Create category |
| PATCH | `/api/v1/categories/:id` | JWT+Admin | Update category |
| DELETE | `/api/v1/categories/:id` | JWT+Admin | Delete category |
| POST/PATCH/DELETE | `/api/v1/suppliers/*` | JWT+Admin | Supplier CRUD |

---

## 10. Frontend Pages & Routes

| Route | File | Auth | Description |
|---|---|---|---|
| `/` | `app/page.tsx` | None | Home: hero, products, how it works, CTA |
| `/products` | `app/products/page.tsx` | None | Browse with filters |
| `/products/[id]` | `app/products/[id]/page.tsx` | None | Product detail + reviews + wishlist |
| `/cart` | `app/cart/page.tsx` | None | Shopping cart |
| `/checkout` | `app/checkout/page.tsx` | None | Checkout (guest + auth, COD + bank) |
| `/orders/confirmation` | `app/orders/confirmation/page.tsx` | None | Post-checkout confirmation |
| `/orders` | `app/orders/page.tsx` | JWT | Order history |
| `/orders/[id]` | `app/orders/[id]/page.tsx` | JWT | Order detail |
| `/wishlist` | `app/wishlist/page.tsx` | JWT | Saved products |
| `/account` | `app/account/page.tsx` | JWT | Profile, addresses, security |
| `/auth/login` | `app/auth/login/page.tsx` | None | Login with phone |
| `/auth/signup` | `app/auth/signup/page.tsx` | None | Register |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | None | Request reset link |
| `/auth/reset-password` | `app/auth/reset-password/page.tsx` | None | Reset with token |
| `/contact` | `app/contact/page.tsx` | None | Contact form |
| `/about` | `app/about/page.tsx` | None | About page |
| `/admin/dashboard` | `app/admin/dashboard/page.tsx` | Admin | Stats overview |
| `/admin/orders` | `app/admin/orders/page.tsx` | Admin | All orders |
| `/admin/products` | `app/admin/products/page.tsx` | Admin | Product management |
| `/admin/products/categories` | `app/admin/products/categories/page.tsx` | Admin | Category management |
| `/admin/products/types` | `app/admin/products/types/page.tsx` | Admin | Product type management |
| `/admin/customers` | `app/admin/customers/page.tsx` | Admin | Customer management |
| `/admin/contacts` | `app/admin/contacts/page.tsx` | Admin | Contact submissions |
| `/admin/settings` | `app/admin/settings/page.tsx` | Admin | App settings |

---

## 11. Design System

### Brand Colors (Tailwind custom tokens)
```
primary-500: #4B8B3B  (Leaf Green — main brand color)
secondary-500: #8B5E3C (Earth Brown — secondary)
accent-500: #22c55e   (Fresh Mint Green)
neutral: Gray scale
```

### Fonts
- **Display/UI**: Poppins (bold headings)
- **Body**: Open Sans
- **Urdu text**: Noto Nastaliq Urdu (use `font-urdu` Tailwind class)

### Key CSS classes (defined in globals.css or Tailwind config)
- `container-custom` — max-width container with horizontal padding
- `btn-primary` — green primary button
- `btn-secondary` — outlined secondary button
- `shadow-soft`, `shadow-medium`, `shadow-strong` — elevation levels
- `shadow-glow` — brand green glow effect

### Component conventions
- Cards: `rounded-2xl shadow-soft`
- Inputs: `rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500`
- Sections: `py-16` vertical padding
- Page containers: `min-h-screen bg-neutral-50 py-8`

---

## 12. Docker & Deployment

### Development (local)
```bash
# Start postgres + redis + full app
docker-compose -f docker-compose.dev.yml up -d --build

# OR run apps natively with hot-reload:
docker-compose -f docker-compose.dev.yml up -d    # only infra
cd apps/backend && yarn start:dev                  # port 3000
cd apps/web && yarn dev                            # port 3001
```

### Production (Oracle Cloud)
```bash
# First time only
docker volume create portal_postgres_data
docker volume create portal_redis_data

# Deploy
docker-compose up -d --build

# Update
git pull && docker-compose down && docker-compose up -d --build
```

See `ORACLE_DEPLOYMENT.md` for full Oracle Cloud setup guide.

### Dockerfile notes
- Base: `node:18-slim` (Debian — better ARM64/Oracle Cloud support than Alpine)
- Builds NestJS first, then Next.js
- `NEXT_PUBLIC_*` vars are embedded at BUILD time — must be passed as `build.args` in docker-compose
- Both apps start via `concurrently` in a single container
- Health check: `GET /api/v1/health` (backend)

### Volume persistence
| Volume | Purpose |
|---|---|
| `portal_postgres_data` | All database data |
| `portal_redis_data` | Redis cache |
| `uploads_data` | Uploaded product images |

---

## 13. Notifications System

### Email (Nodemailer)
- Configured via `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` in .env
- When SMTP not configured: emails are LOGGED to console (does not crash the app)
- Triggered by: order creation (customer confirmation + admin notification), order status updates
- Templates in `apps/backend/src/modules/notifications/templates/`

### Free SMTP options
- **Brevo** (brevo.com): Free 300 emails/day, no credit card required
- **Gmail**: Requires 2FA + App Password at `myaccount.google.com/apppasswords`

### WhatsApp
- Twilio was removed (paid service)
- Currently: admin gets an email notification instead
- Future: When adding WhatsApp, use Meta's WhatsApp Business Cloud API (free 1000 conversations/month)

---

## 14. Known Remaining Gaps (Next Sprint)

| Gap | Severity | Notes |
|---|---|---|
| Guest checkout has no email input field visible in UI | HIGH | Guest can't get order confirmation emails without email |
| Admin product form has no image upload button | HIGH | Backend endpoint exists (`POST /api/v1/upload/image`), just needs UI button |
| No inventory management page in admin | MEDIUM | No way to set stock levels via UI |
| TypeORM migrations not generated | MEDIUM | `synchronize: development` works for dev; must add proper migrations before scaling |
| Health check doesn't verify Redis | LOW | Only checks DB connection |
| No pagination on wishlist | LOW | Infinite scroll or pagination when wishlist grows large |
| Reviews not gated by purchase | LOW | `isVerified: false` by default; admin must manually verify purchase |
| No SMS notifications | LOW | Twilio SMS dependency exists in package.json but not wired up |

---

## 15. Decisions That Were Made and Why

### Decision 1: Drop Supabase, keep NestJS
**Why:** Supabase migration introduced regressions (broken guest checkout, split auth, empty schema types). NestJS backend is ~65% feature-complete and production-grade. More maintainable as separate apps.

### Decision 2: Single Docker container for both apps
**Why:** Oracle Cloud Always Free ARM VM — simplest deployment, one `docker-compose up`. When traffic grows, can split into separate containers with an nginx load balancer.

### Decision 3: No Twilio (WhatsApp/SMS)
**Why:** Paid service. Replaced WhatsApp admin notification with an email to `ADMIN_EMAIL`. SMS can be added later via Twilio when revenue covers the cost.

### Decision 4: Local disk storage for images
**Why:** Free. Works perfectly with Docker volume for persistence. When scaling to multiple servers, swap to Cloudinary (25GB free) or AWS S3.

### Decision 5: `synchronize: true` only in development
**Why:** Production with `synchronize: true` auto-alters schema on startup — dangerous, can drop columns. Development uses it for convenience. Migration files to be generated when schema stabilizes.

### Decision 6: Role in JWT payload, no DB query in RolesGuard
**Why:** Performance. Every authenticated request would hit the DB to get user role if the guard queries DB. JWT payload already has the role; JwtStrategy fetches user + role on each request anyway. RolesGuard just reads `req.user.role`.

### Decision 7: CartContext over Redux for cart
**Why:** Cart needs localStorage persistence and variant-aware logic. CartContext handles both. Redux cartSlice was dead code — removed to avoid confusion.

### Decision 8: `NEXT_PUBLIC_API_URL` points to Next.js, not NestJS directly
**Why:** Browser can't reliably reach NestJS directly in all deployment scenarios (nginx proxying). All API calls from browser go through Next.js proxy routes → NestJS. `BACKEND_URL` is used server-side only.

---

## 16. Default Credentials (change before production)

| Item | Value | Change? |
|---|---|---|
| Super Admin Phone | `+923204749700` | Optional — set in env |
| Super Admin Password | `superadmin123` | **MUST change before production** |
| JWT Secret | `your-super-secret-jwt-key-for-fruit-mandi-2024` | **MUST change — use `openssl rand -hex 32`** |
| DB Password | `password` | **MUST change for production** |

---

## 17. Adding a New Feature — Checklist

When adding any new backend feature:

- [ ] Create entity in `apps/backend/src/modules/[feature]/entities/[name].entity.ts`
- [ ] Create DTO(s) in `apps/backend/src/modules/[feature]/dto/`
- [ ] Create service in `apps/backend/src/modules/[feature]/[name].service.ts`
- [ ] Create controller in `apps/backend/src/modules/[feature]/[name].controller.ts`
- [ ] Register entity in `TypeOrmModule.forFeature([...])` in the module
- [ ] Register controller in `controllers: [...]` in the module
- [ ] Register service in `providers: [...]` in the module
- [ ] Export service in `exports: [...]` if other modules need it
- [ ] Apply `@UseGuards(JwtAuthGuard, RolesGuard) @Roles(...)` if admin-only
- [ ] Create Next.js proxy route at `apps/web/src/app/api/v1/[feature]/route.ts`
- [ ] Add any new env vars to `env.ts`, `.env`, and `env.template`
- [ ] Update this document

When adding a new frontend page:

- [ ] Create `apps/web/src/app/[route]/page.tsx`
- [ ] Wrap in `<ProtectedRoute>` if auth required
- [ ] Add link in Header or navigation
- [ ] Add `onError` handler to all `<Image>` components
- [ ] Disable form submit buttons during loading (`isLoading` state)
- [ ] Clear sensitive state after success (cart after order, etc.)
- [ ] Update this document
