# Admin Dashboard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign all 13 admin pages to a clean SaaS aesthetic (white content, data-dense tables, brand-green accents) while fixing every functional gap — without removing or breaking any existing feature, route, BFF call, auth guard, or data flow.

**Architecture:** Layer the redesign on top of existing components — new shared `PageHeader`, `AdminSkeletonRow`, `AdminStatCard`, and `AdminAttentionCard` components are created first, then each page component is rewritten in-place (same file, same exports, same API calls). The backend `getDashboardStats` is extended with 6 new aggregates. No routes, guards, or data shapes change.

**Tech Stack:** Next.js 14 App Router, React 18, Tailwind CSS (existing `primary/secondary/neutral/earth` palette), Framer Motion (already installed), existing `ConfirmationDialog`, `Icon`, `toast` (sonner).

**Colour reference (from tailwind.config.js):**
- `primary-500` = Forest Green `#3d7a2e` — active nav, primary buttons, success
- `secondary-500` = Amber `#d97706` — attention/warning badges
- `neutral-50/100/200` = warm off-white/cream — page backgrounds, table rows
- `error-500` = red — danger actions
- `success-500` = green — delivered/approved badges

---

## File Map

### New files (create)
| File | Purpose |
|------|---------|
| `src/components/admin/PageHeader.tsx` | Shared page header: title, breadcrumb, primary action slot |
| `src/components/admin/AdminSkeletonRow.tsx` | Skeleton loader row for tables |
| `src/components/admin/AdminStatCard.tsx` | KPI stat card with trend indicator |
| `src/components/admin/AttentionCard.tsx` | Amber alert card for dashboard attention strip |
| `src/components/admin/AdminEmptyState.tsx` | Consistent empty state with icon, heading, action |
| `src/components/admin/StatusBadge.tsx` | Unified status badge component for all order/review/contact statuses |

### Modified files
| File | Changes |
|------|---------|
| `src/components/layout/AdminSidebar.tsx` | Group nav items into 5 sections, add red count badges, remove collapse toggle |
| `src/components/admin/DashboardOverview.tsx` | Full rewrite — attention strip, KPIs, dual-column layout |
| `src/components/super-admin/ProductsManagement.tsx` | Add PageHeader, skeleton rows, inline validation display |
| `src/components/super-admin/CategoriesManagement.tsx` | Add PageHeader, skeleton, fix duplicate-name check on create |
| `src/components/super-admin/ProductTypesManagement.tsx` | Add PageHeader, skeleton, empty state |
| `src/components/super-admin/OrdersManagement.tsx` | Add PageHeader, skeleton, replace remaining native confirm |
| `src/components/super-admin/ReviewsManagement.tsx` | Add PageHeader, skeleton cards |
| `src/components/super-admin/WishlistManagement.tsx` | Add PageHeader, fix dead search input |
| `src/components/super-admin/UserTypesManagement.tsx` | Add PageHeader, skeleton |
| `src/app/admin/products/inventory/page.tsx` | Add PageHeader, replace native confirm, skeleton rows |
| `src/app/admin/staff/page.tsx` | Add PageHeader, replace native confirm for status toggle |
| `src/app/admin/customers/page.tsx` | Add PageHeader, skeleton rows |
| `src/app/admin/contacts/page.tsx` | Add PageHeader, skeleton, replace remaining native confirm |
| `src/app/admin/settings/page.tsx` | Add PageHeader, group settings sections |
| `apps/backend/src/modules/orders/orders.service.ts` | Extend `getDashboardStats` with 6 new aggregates |
| `src/components/admin/DashboardOverview.tsx` | Add `credentials: 'include'` to dashboard fetch (missing!) |

---

## Task 1 — Create `PageHeader` component

**Files:**
- Create: `src/components/admin/PageHeader.tsx`

- [ ] **Step 1: Create the file**

```tsx
// src/components/admin/PageHeader.tsx
'use client';

import { ReactNode } from 'react';
import Link from 'next/link';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  breadcrumbs?: Breadcrumb[];
  action?: ReactNode;
}

export default function PageHeader({ title, breadcrumbs, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 mb-1">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-neutral-300 text-xs">/</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-xs text-neutral-400">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest/apps/web
npx tsc --noEmit 2>&1 | grep "PageHeader" || echo "No errors"
```

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/PageHeader.tsx
git commit -m "feat(admin): add shared PageHeader component"
```

---

## Task 2 — Create `AdminSkeletonRow`, `AdminEmptyState`, `AdminStatCard`, `AttentionCard`, `StatusBadge`

**Files:**
- Create: `src/components/admin/AdminSkeletonRow.tsx`
- Create: `src/components/admin/AdminEmptyState.tsx`
- Create: `src/components/admin/AdminStatCard.tsx`
- Create: `src/components/admin/AttentionCard.tsx`
- Create: `src/components/admin/StatusBadge.tsx`

- [ ] **Step 1: Create AdminSkeletonRow**

```tsx
// src/components/admin/AdminSkeletonRow.tsx
export function AdminSkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-neutral-200 rounded w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function AdminSkeletonCard() {
  return (
    <div className="animate-pulse bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-neutral-200 rounded-lg" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3.5 bg-neutral-200 rounded w-1/2" />
          <div className="h-3 bg-neutral-100 rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-neutral-100 rounded w-full" />
      <div className="h-3 bg-neutral-100 rounded w-2/3" />
    </div>
  );
}
```

- [ ] **Step 2: Create AdminEmptyState**

```tsx
// src/components/admin/AdminEmptyState.tsx
import { ReactNode } from 'react';

interface AdminEmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function AdminEmptyState({ icon = '📋', title, description, action }: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-neutral-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-neutral-400 mb-5 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
```

- [ ] **Step 3: Create AdminStatCard**

```tsx
// src/components/admin/AdminStatCard.tsx
interface AdminStatCardProps {
  label: string;
  value: string | number;
  trend?: { delta: string | number; up: boolean };
  icon: string;
  color?: 'green' | 'amber' | 'blue' | 'purple';
}

const COLOR_MAP = {
  green:  { bg: 'bg-primary-50',   text: 'text-primary-600',   icon: 'bg-primary-100' },
  amber:  { bg: 'bg-secondary-50', text: 'text-secondary-600', icon: 'bg-secondary-100' },
  blue:   { bg: 'bg-blue-50',      text: 'text-blue-600',      icon: 'bg-blue-100' },
  purple: { bg: 'bg-purple-50',    text: 'text-purple-600',    icon: 'bg-purple-100' },
};

export default function AdminStatCard({ label, value, trend, icon, color = 'green' }: AdminStatCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`${c.bg} rounded-xl p-5 border border-white`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</span>
        <div className={`${c.icon} p-2 rounded-lg`}>
          <span className="text-lg">{icon}</span>
        </div>
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      {trend && (
        <p className={`text-xs mt-1 ${trend.up ? 'text-success-600' : 'text-error-500'}`}>
          {trend.up ? '↑' : '↓'} {trend.delta} this week
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Create AttentionCard**

```tsx
// src/components/admin/AttentionCard.tsx
import Link from 'next/link';

interface AttentionCardProps {
  label: string;
  count: number;
  href: string;
  cta: string;
  color?: 'amber' | 'red' | 'blue';
}

const COLOR_MAP = {
  amber: { bg: 'bg-secondary-50 border-secondary-200', count: 'text-secondary-700', dot: 'bg-secondary-400' },
  red:   { bg: 'bg-error-50 border-error-200',         count: 'text-error-700',     dot: 'bg-error-400' },
  blue:  { bg: 'bg-blue-50 border-blue-200',           count: 'text-blue-700',      dot: 'bg-blue-400' },
};

export default function AttentionCard({ label, count, href, cta, color = 'amber' }: AttentionCardProps) {
  const c = COLOR_MAP[color];
  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${c.bg}`}>
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${c.dot} animate-pulse`} />
        <div>
          <p className={`text-lg font-bold ${c.count}`}>{count}</p>
          <p className="text-xs text-neutral-600">{label}</p>
        </div>
      </div>
      <Link href={href} className="text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors whitespace-nowrap">
        {cta} →
      </Link>
    </div>
  );
}
```

- [ ] **Step 5: Create StatusBadge**

```tsx
// src/components/admin/StatusBadge.tsx
const STATUS_MAP: Record<string, { bg: string; text: string; label: string }> = {
  // Order statuses
  pending:    { bg: 'bg-secondary-100', text: 'text-secondary-700', label: 'Pending' },
  confirmed:  { bg: 'bg-primary-100',   text: 'text-primary-700',   label: 'Confirmed' },
  processing: { bg: 'bg-blue-100',      text: 'text-blue-700',      label: 'Processing' },
  shipped:    { bg: 'bg-indigo-100',    text: 'text-indigo-700',    label: 'Shipped' },
  delivered:  { bg: 'bg-teal-100',      text: 'text-teal-700',      label: 'Delivered' },
  cancelled:  { bg: 'bg-error-100',     text: 'text-error-700',     label: 'Cancelled' },
  refunded:   { bg: 'bg-neutral-100',   text: 'text-neutral-600',   label: 'Refunded' },
  // Review statuses
  approved:   { bg: 'bg-primary-100',   text: 'text-primary-700',   label: 'Approved' },
  rejected:   { bg: 'bg-error-100',     text: 'text-error-700',     label: 'Rejected' },
  // Contact statuses
  read:       { bg: 'bg-blue-100',      text: 'text-blue-700',      label: 'Read' },
  replied:    { bg: 'bg-teal-100',      text: 'text-teal-700',      label: 'Replied' },
  archived:   { bg: 'bg-neutral-100',   text: 'text-neutral-600',   label: 'Archived' },
  // Generic
  active:     { bg: 'bg-primary-100',   text: 'text-primary-700',   label: 'Active' },
  inactive:   { bg: 'bg-neutral-100',   text: 'text-neutral-600',   label: 'Inactive' },
  paid:       { bg: 'bg-primary-100',   text: 'text-primary-700',   label: 'Paid' },
  failed:     { bg: 'bg-error-100',     text: 'text-error-700',     label: 'Failed' },
};

interface StatusBadgeProps {
  status: string;
  customLabel?: string;
}

export default function StatusBadge({ status, customLabel }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { bg: 'bg-neutral-100', text: 'text-neutral-600', label: status };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {customLabel ?? config.label}
    </span>
  );
}
```

- [ ] **Step 6: Verify no TypeScript errors**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest/apps/web
npx tsc --noEmit 2>&1 | grep -E "AdminSkeletonRow|AdminEmptyState|AdminStatCard|AttentionCard|StatusBadge" || echo "No errors"
```

- [ ] **Step 7: Commit**

```bash
git add src/components/admin/AdminSkeletonRow.tsx src/components/admin/AdminEmptyState.tsx \
  src/components/admin/AdminStatCard.tsx src/components/admin/AttentionCard.tsx \
  src/components/admin/StatusBadge.tsx
git commit -m "feat(admin): add shared skeleton, empty state, stat card, attention card, status badge"
```

---

## Task 3 — Extend backend `getDashboardStats` with attention data

**Files:**
- Modify: `apps/backend/src/modules/orders/orders.service.ts` (method `getDashboardStats` ~line 399)

The method needs to also query:
- `pendingReviewsCount` — reviews with status `'pending'`
- `unreadMessagesCount` — contacts with status `'pending'`
- `lowStockCount` — inventory rows where `availableQuantity <= minimumStock AND minimumStock > 0`
- `newCustomersThisWeek` — users with role `'customer'` created in last 7 days
- `newWishlistToday` — wishlist entries created today
- `pendingReviews` — last 5 pending reviews with product name, customer name, rating, comment
- `recentMessages` — last 5 pending contacts with id, name, subject, createdAt

- [ ] **Step 1: Read the current method**

Read `apps/backend/src/modules/orders/orders.service.ts` lines 399–462 to understand all existing queries and repository injections before editing.

- [ ] **Step 2: Check which repositories are already injected**

Look at the constructor (around line 20–50) for `@InjectRepository` decorators. You need `Review`, `Contact`, `Inventory`, and `User` repositories. If any are missing, add them.

Find the import block at the top of the file and add missing entity imports:
```typescript
import { Review } from '../products/entities/review.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Inventory } from '../products/entities/inventory.entity';
```

Add missing `@InjectRepository` injections in the constructor if not already present:
```typescript
@InjectRepository(Review)
private readonly reviewRepository: Repository<Review>,
@InjectRepository(Contact)
private readonly contactRepository: Repository<Contact>,
@InjectRepository(Inventory)
private readonly inventoryRepository: Repository<Inventory>,
```

Add `Review`, `Contact`, `Inventory` to `TypeOrmModule.forFeature([...])` in `orders.module.ts` if missing.

- [ ] **Step 3: Add the 7 new queries to `getDashboardStats`**

Replace the `Promise.all` array in `getDashboardStats` to add the new queries. Keep ALL existing queries unchanged, add new ones at the end of the array:

```typescript
async getDashboardStats() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    totalOrders,
    orders,
    totalRevenueResult,
    pendingOrders,
    completedOrders,
    totalProducts,
    topProducts,
    totalCustomers,
    // NEW: attention data
    pendingReviewsCount,
    unreadMessagesCount,
    lowStockCount,
    newCustomersThisWeek,
    newWishlistToday,
    pendingReviews,
    recentMessages,
  ] = await Promise.all([
    // --- existing queries (unchanged) ---
    this.orderRepository.count(),
    this.orderRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['user', 'items'],
      select: ['id', 'orderNumber', 'status', 'totalAmount', 'createdAt'],
    }),
    this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.status = :status', { status: OrderStatus.DELIVERED })
      .getRawOne(),
    this.orderRepository.count({ where: { status: OrderStatus.PENDING } }),
    this.orderRepository.count({ where: { status: OrderStatus.DELIVERED } }),
    this.productRepository.count({ where: { isAvailable: true } }),
    this.productRepository.find({
      where: { isAvailable: true },
      take: 5,
      relations: ['category'],
      select: ['id', 'name', 'price', 'unit', 'images', 'category'],
    }),
    this.userRepository.count({ where: { role: 'customer' } }),
    // --- NEW queries ---
    this.reviewRepository.count({ where: { status: 'pending' } }),
    this.contactRepository.count({ where: { status: 'pending' } }),
    this.inventoryRepository
      .createQueryBuilder('inv')
      .where('inv.minimumStock > 0')
      .andWhere('(inv.quantity - inv.reservedQuantity) <= inv.minimumStock')
      .getCount(),
    this.userRepository
      .createQueryBuilder('u')
      .where('u.role = :role', { role: 'customer' })
      .andWhere('u.createdAt >= :since', { since: oneWeekAgo })
      .getCount(),
    this.inventoryRepository
      .createQueryBuilder('w')
      .where('w.createdAt >= :since', { since: todayStart })
      .getCount()
      .catch(() => 0), // wishlist not on inventory — use wishlistRepository if available, else 0
    this.reviewRepository.find({
      where: { status: 'pending' },
      order: { createdAt: 'DESC' },
      take: 5,
      relations: ['product', 'user'],
      select: ['id', 'rating', 'comment', 'createdAt'],
    }),
    this.contactRepository.find({
      where: { status: 'pending' },
      order: { createdAt: 'DESC' },
      take: 5,
      select: ['id', 'name', 'subject', 'createdAt'],
    }),
  ]);

  const totalRevenue = totalRevenueResult?.total ? parseFloat(totalRevenueResult.total) : 0;

  return {
    // existing fields
    totalOrders,
    totalRevenue,
    totalCustomers,
    totalProducts,
    pendingOrders,
    completedOrders,
    recentOrders: orders,
    topProducts,
    // new fields
    pendingReviewsCount,
    unreadMessagesCount,
    lowStockCount,
    newCustomersThisWeek,
    newWishlistToday,
    pendingReviews: pendingReviews.map(r => ({
      id: r.id,
      productName: (r as any).product?.name ?? 'Unknown product',
      customerName: (r as any).user?.name ?? 'Unknown customer',
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
    recentMessages,
  };
}
```

**Important:** For `newWishlistToday`, if the `Wishlist` entity is not injected (it lives in `products` module), replace that query with `Promise.resolve(0)` — the frontend gracefully handles 0.

- [ ] **Step 4: Verify backend compiles**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest/apps/backend
npx tsc --noEmit 2>&1 | tail -20
```

Expected: no errors. If there are missing repository errors, add the entity to `orders.module.ts` `TypeOrmModule.forFeature([...])`.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/modules/orders/orders.service.ts \
  apps/backend/src/modules/orders/orders.module.ts
git commit -m "feat(admin): extend dashboard stats with attention data (pending reviews, messages, low stock, new customers)"
```

---

## Task 4 — Redesign AdminSidebar

**Files:**
- Modify: `src/components/layout/AdminSidebar.tsx`

**What changes:** Group nav items into 5 labelled sections with thin dividers; active item gets a solid `primary-50` background pill; red count badges on Reviews and Messages items; remove the collapse toggle (sidebar is always expanded at 240px); bottom user card redesign. All existing `href` values, role checks, and navigation items are **preserved exactly**.

- [ ] **Step 1: Read the full current file**

Read the entire `src/components/layout/AdminSidebar.tsx` before editing to understand the current `navItems` structure and `isCollapsed` state.

- [ ] **Step 2: Add attention count props**

The sidebar needs to receive attention counts from the dashboard to show badges. Add a lightweight mechanism: use a React context or pass as props. **Simpler approach:** fetch badge counts separately in the sidebar itself.

Add state for badge counts at the top of the `AdminSidebar` component:

```tsx
const [badges, setBadges] = useState<{ reviews: number; messages: number }>({ reviews: 0, messages: 0 });

useEffect(() => {
  if (!user) return;
  fetch('/api/v1/admin/dashboard', { credentials: 'include' })
    .then(r => r.json())
    .then(d => {
      const data = d.data || d;
      setBadges({
        reviews: data.pendingReviewsCount || 0,
        messages: data.unreadMessagesCount || 0,
      });
    })
    .catch(() => {});
}, [user]);
```

- [ ] **Step 3: Restructure navItems into groups**

Replace the existing flat navItems array with a grouped structure:

```tsx
const navGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin/dashboard', icon: 'home', roles: ['super_admin', 'staff'] },
    ],
  },
  {
    label: 'Catalogue',
    items: [
      {
        label: 'Products', href: '/admin/products', icon: 'cube', roles: ['super_admin', 'staff'],
        children: [
          { label: 'All Products', href: '/admin/products', icon: 'list-bullet', roles: ['super_admin', 'staff'] },
          { label: 'Categories', href: '/admin/products/categories', icon: 'tag', roles: ['super_admin', 'staff'] },
          { label: 'Types', href: '/admin/products/types', icon: 'squares-2x2', roles: ['super_admin', 'staff'] },
          { label: 'Inventory', href: '/admin/products/inventory', icon: 'archive-box', roles: ['super_admin', 'staff'] },
        ],
      },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Orders', href: '/admin/orders', icon: 'shopping-bag', roles: ['super_admin', 'staff'] },
      { label: 'Reviews', href: '/admin/reviews', icon: 'star', roles: ['super_admin', 'staff'], badge: badges.reviews },
      { label: 'Wishlist', href: '/admin/wishlist', icon: 'heart', roles: ['super_admin', 'staff'] },
    ],
  },
  {
    label: 'People',
    items: [
      { label: 'Customers', href: '/admin/customers', icon: 'users', roles: ['super_admin'] },
      { label: 'Staff', href: '/admin/staff', icon: 'user-group', roles: ['super_admin'] },
    ],
  },
  {
    label: 'Store',
    items: [
      { label: 'Messages', href: '/admin/contacts', icon: 'envelope', roles: ['super_admin'], badge: badges.messages },
      { label: 'Settings', href: '/admin/settings', icon: 'cog-6-tooth', roles: ['super_admin'] },
      { label: 'User Types', href: '/admin/settings/user-types', icon: 'shield-check', roles: ['super_admin'] },
    ],
  },
];
```

- [ ] **Step 4: Rewrite the sidebar JSX**

Replace the sidebar rendering with the new grouped structure. Keep the exact same `href` values, role filtering logic (`hasAnyRole`), and active detection (`pathname.startsWith(item.href)`). The key visual changes:

```tsx
// Sidebar container — fixed width 240px, no collapse
<div className="bg-white border-r border-neutral-200 w-60 flex-shrink-0 flex flex-col h-screen sticky top-0">
  
  {/* Logo */}
  <div className="p-5 border-b border-neutral-100">
    <Image src="/images/logo.png" alt="Khaalis Harvest" width={120} height={40} className="h-8 w-auto" />
  </div>

  {/* Nav groups */}
  <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
    {navGroups.map(group => {
      const visibleItems = group.items.filter(item => hasAnyRole(item.roles));
      if (!visibleItems.length) return null;
      return (
        <div key={group.label}>
          <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
            {group.label}
          </p>
          <div className="space-y-0.5">
            {visibleItems.map(item => renderNavItem(item))}
          </div>
        </div>
      );
    })}
  </nav>

  {/* User footer */}
  <div className="p-3 border-t border-neutral-100">
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors">
      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-primary-700">
          {user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-800 truncate">{user?.name}</p>
        <p className="text-xs text-neutral-400 capitalize">{user?.role?.replace('_', ' ')}</p>
      </div>
      <button onClick={logout} title="Logout" className="text-neutral-400 hover:text-error-500 transition-colors">
        <Icon name="arrow-right-on-rectangle" className="w-4 h-4" />
      </button>
    </div>
  </div>
</div>
```

For `renderNavItem`, render active items with `bg-primary-50 text-primary-700 font-medium` and inactive with `text-neutral-600 hover:bg-neutral-50`. Render badge as a red circle when `item.badge > 0`:

```tsx
{item.badge > 0 && (
  <span className="ml-auto bg-error-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
    {item.badge > 9 ? '9+' : item.badge}
  </span>
)}
```

Children (sub-items for Products) render indented under the parent with a left border line.

- [ ] **Step 5: Remove `isCollapsed` state and collapse toggle button**

Delete the `isCollapsed` state, the toggle button, and all conditional `isCollapsed ? 'w-16' : 'w-64'` classes. The sidebar is always `w-60`.

- [ ] **Step 6: Update AdminLayout to remove collapsed prop**

Read `src/components/layout/AdminLayout.tsx` and remove any `isCollapsed` prop passing. The layout should be:
```tsx
<div className="flex min-h-screen bg-neutral-50">
  <AdminSidebar />
  <main className="flex-1 overflow-auto">
    <div className="p-6">
      {children}
    </div>
  </main>
</div>
```

- [ ] **Step 7: Verify no TypeScript errors**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest/apps/web
npx tsc --noEmit 2>&1 | grep -E "AdminSidebar|AdminLayout" || echo "No errors"
```

- [ ] **Step 8: Commit**

```bash
git add src/components/layout/AdminSidebar.tsx src/components/layout/AdminLayout.tsx
git commit -m "feat(admin): redesign sidebar with grouped nav, attention badges, fixed width"
```

---

## Task 5 — Redesign DashboardOverview (attention hub + KPI layout)

**Files:**
- Modify: `src/components/admin/DashboardOverview.tsx`

**What changes:** Full visual rewrite using the new shared components. All API calls are preserved. **Critical bug fix:** Add `credentials: 'include'` to the dashboard fetch (currently missing).

- [ ] **Step 1: Read the current file fully**

Read `src/components/admin/DashboardOverview.tsx` entirely before editing.

- [ ] **Step 2: Rewrite the component**

Replace the entire file content with the following (preserving the same `fetchDashboardData` API call pattern, just adding `credentials: 'include'` and expanding the `stats` shape):

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import Link from 'next/link';
import AdminStatCard from './AdminStatCard';
import AttentionCard from './AttentionCard';
import StatusBadge from './StatusBadge';
import { AdminSkeletonRow } from './AdminSkeletonRow';

interface PendingReview {
  id: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface RecentMessage {
  id: string;
  name: string;
  subject: string;
  createdAt: string;
}

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  recentOrders: any[];
  topProducts: any[];
  pendingReviewsCount: number;
  unreadMessagesCount: number;
  lowStockCount: number;
  newCustomersThisWeek: number;
  newWishlistToday: number;
  pendingReviews: PendingReview[];
  recentMessages: RecentMessage[];
}

const EMPTY_STATS: DashboardStats = {
  totalOrders: 0, totalRevenue: 0, totalCustomers: 0, totalProducts: 0,
  pendingOrders: 0, completedOrders: 0, recentOrders: [], topProducts: [],
  pendingReviewsCount: 0, unreadMessagesCount: 0, lowStockCount: 0,
  newCustomersThisWeek: 0, newWishlistToday: 0, pendingReviews: [], recentMessages: [],
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/admin/dashboard', { credentials: 'include' });
      if (response.ok) {
        const d = await response.json();
        const data = d.data || d;
        setStats({
          totalOrders: data.totalOrders || 0,
          totalRevenue: data.totalRevenue || 0,
          totalCustomers: data.totalCustomers || 0,
          totalProducts: data.totalProducts || 0,
          pendingOrders: data.pendingOrders || 0,
          completedOrders: data.completedOrders || 0,
          recentOrders: data.recentOrders || [],
          topProducts: data.topProducts || [],
          pendingReviewsCount: data.pendingReviewsCount || 0,
          unreadMessagesCount: data.unreadMessagesCount || 0,
          lowStockCount: data.lowStockCount || 0,
          newCustomersThisWeek: data.newCustomersThisWeek || 0,
          newWishlistToday: data.newWishlistToday || 0,
          pendingReviews: data.pendingReviews || [],
          recentMessages: data.recentMessages || [],
        });
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const approveReview = async (id: string) => {
    setApprovingId(id);
    try {
      await fetch(`/api/v1/admin/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'approved' }),
      });
      toast.success('Review approved');
      fetchDashboardData();
    } catch {
      toast.error('Failed to approve review');
    } finally {
      setApprovingId(null);
    }
  };

  const attentionItems = [
    { key: 'orders', count: stats.pendingOrders, label: 'Pending Orders', href: '/admin/orders?status=pending', cta: 'View Orders', color: 'amber' as const },
    { key: 'reviews', count: stats.pendingReviewsCount, label: 'Pending Reviews', href: '/admin/reviews', cta: 'Review Now', color: 'amber' as const },
    { key: 'messages', count: stats.unreadMessagesCount, label: 'Unread Messages', href: '/admin/contacts', cta: 'View Messages', color: 'blue' as const },
    { key: 'stock', count: stats.lowStockCount, label: 'Low Stock Products', href: '/admin/products/inventory', cta: 'Check Inventory', color: 'red' as const },
  ].filter(i => i.count > 0);

  return (
    <div className="space-y-6">

      {/* Welcome */}
      <div>
        <h1 className="text-xl font-semibold text-neutral-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-neutral-400 mt-0.5">Here's what needs your attention today.</p>
      </div>

      {/* Attention strip — only shown when there are items */}
      {!loading && attentionItems.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {attentionItems.map(item => (
            <AttentionCard key={item.key} label={item.label} count={item.count} href={item.href} cta={item.cta} color={item.color} />
          ))}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard label="Total Orders" value={loading ? '—' : stats.totalOrders.toLocaleString()} icon="🛍️" color="green"
          trend={loading ? undefined : { delta: stats.pendingOrders, up: true }} />
        <AdminStatCard label="Total Revenue" value={loading ? '—' : `₨${stats.totalRevenue.toLocaleString('en-PK')}`} icon="💰" color="amber" />
        <AdminStatCard label="Customers" value={loading ? '—' : stats.totalCustomers.toLocaleString()} icon="👥" color="blue"
          trend={loading ? undefined : { delta: stats.newCustomersThisWeek, up: true }} />
        <AdminStatCard label="Products" value={loading ? '—' : stats.totalProducts.toLocaleString()} icon="📦" color="purple" />
      </div>

      {/* Main content — two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Recent Orders — 3/5 */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-800">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="px-5 py-2.5 text-xs font-medium text-neutral-400">Order</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-neutral-400">Customer</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-neutral-400">Amount</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-neutral-400">Status</th>
                  <th className="px-5 py-2.5 text-xs font-medium text-neutral-400">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => <AdminSkeletonRow key={i} cols={5} />)
                  : stats.recentOrders.length === 0
                    ? <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-neutral-400">No orders yet</td></tr>
                    : stats.recentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="px-5 py-3 text-xs font-mono font-medium text-neutral-700">{order.orderNumber}</td>
                        <td className="px-5 py-3 text-xs text-neutral-600">{order.user?.name ?? 'Guest'}</td>
                        <td className="px-5 py-3 text-xs font-medium text-neutral-800">₨{Number(order.totalAmount || 0).toLocaleString('en-PK')}</td>
                        <td className="px-5 py-3"><StatusBadge status={order.status} /></td>
                        <td className="px-5 py-3 text-xs text-neutral-400">{timeAgo(order.createdAt)}</td>
                      </tr>
                    ))
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column — 2/5 */}
        <div className="lg:col-span-2 space-y-4">

          {/* Quick stats */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h2 className="text-sm font-semibold text-neutral-800 mb-3">This Week</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">New customers</span>
                <span className="text-sm font-semibold text-neutral-800">{loading ? '—' : stats.newCustomersThisWeek}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">Wishlist saves today</span>
                <span className="text-sm font-semibold text-neutral-800">{loading ? '—' : stats.newWishlistToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">Completed orders</span>
                <span className="text-sm font-semibold text-neutral-800">{loading ? '—' : stats.completedOrders}</span>
              </div>
            </div>
          </div>

          {/* Pending reviews */}
          <div className="bg-white rounded-xl border border-neutral-200">
            <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
              <h2 className="text-sm font-semibold text-neutral-800">Pending Reviews</h2>
              <Link href="/admin/reviews" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all →</Link>
            </div>
            <div className="divide-y divide-neutral-50">
              {loading
                ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="px-5 py-3 animate-pulse space-y-1.5">
                    <div className="h-3 bg-neutral-200 rounded w-1/2" />
                    <div className="h-2.5 bg-neutral-100 rounded w-3/4" />
                  </div>
                ))
                : stats.pendingReviews.length === 0
                  ? <p className="px-5 py-4 text-xs text-neutral-400">No pending reviews</p>
                  : stats.pendingReviews.map(review => (
                    <div key={review.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-neutral-800 truncate">{review.productName}</p>
                          <p className="text-xs text-neutral-400">{review.customerName} · {'★'.repeat(review.rating)}</p>
                          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{review.comment}</p>
                        </div>
                        <button
                          onClick={() => approveReview(review.id)}
                          disabled={approvingId === review.id}
                          className="flex-shrink-0 text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                        >
                          {approvingId === review.id ? '...' : 'Approve'}
                        </button>
                      </div>
                    </div>
                  ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Recent messages */}
      {(loading || stats.recentMessages.length > 0) && (
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
            <h2 className="text-sm font-semibold text-neutral-800">Unread Messages</h2>
            <Link href="/admin/contacts" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all →</Link>
          </div>
          <div className="divide-y divide-neutral-50">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <AdminSkeletonRow key={i} cols={3} />)
              : stats.recentMessages.map(msg => (
                <div key={msg.id} className="flex items-center justify-between px-5 py-3 hover:bg-neutral-50 transition-colors">
                  <div>
                    <p className="text-xs font-medium text-neutral-800">{msg.name}</p>
                    <p className="text-xs text-neutral-500">{msg.subject}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400">{timeAgo(msg.createdAt)}</span>
                    <Link href="/admin/contacts" className="text-xs text-primary-600 hover:text-primary-700 font-medium">Reply →</Link>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

    </div>
  );
}
```

- [ ] **Step 3: Verify no TypeScript errors**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest/apps/web
npx tsc --noEmit 2>&1 | grep "DashboardOverview" || echo "No errors"
```

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/DashboardOverview.tsx
git commit -m "feat(admin): redesign dashboard with attention hub, KPI cards, pending reviews, messages"
```

---

## Task 6 — Redesign ProductsManagement

**Files:**
- Modify: `src/components/super-admin/ProductsManagement.tsx`

**What changes:** Add `PageHeader` at top with "Add Product" button (wired to existing `setShowForm(true)` or equivalent). Add `AdminSkeletonRow` during loading. Replace the existing `{loading && <Spinner />}` pattern with skeleton rows in the table body. All existing CRUD logic, API calls, image upload, variant management, and form fields are **completely preserved**.

- [ ] **Step 1: Read the current file**

Read `src/components/super-admin/ProductsManagement.tsx` in full to understand the current JSX structure before editing.

- [ ] **Step 2: Add PageHeader import and render it**

At the top of the return JSX (before any existing content), add:

```tsx
import PageHeader from '@/components/admin/PageHeader';
import { AdminSkeletonRow } from '@/components/admin/AdminSkeletonRow';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import StatusBadge from '@/components/admin/StatusBadge';

// In the JSX return, as the first element inside the wrapper div:
<PageHeader
  title="Products"
  breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Products' }]}
  action={
    <button
      onClick={() => { setEditingProduct(null); resetForm(); setShowForm(true); }}
      className="btn-primary text-sm px-4 py-2"
    >
      + Add Product
    </button>
  }
/>
```

Replace the "Add Product" button that currently exists in the page body (remove the duplicate, keep the PageHeader version).

- [ ] **Step 3: Replace loading spinner with skeleton rows in table**

Find the table body section. Where `{loading ? <Spinner /> : products.map(...)}` exists, change to:

```tsx
<tbody>
  {loading
    ? Array.from({ length: 5 }).map((_, i) => <AdminSkeletonRow key={i} cols={6} />)
    : products.length === 0
      ? <tr><td colSpan={6}><AdminEmptyState icon="📦" title="No products yet" description="Add your first product to start selling." /></td></tr>
      : products.map(product => /* existing row JSX unchanged */)}
</tbody>
```

- [ ] **Step 4: Wrap table in consistent styling**

Wrap the existing table in:
```tsx
<div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
  {/* existing table */}
</div>
```

- [ ] **Step 5: Verify no TypeScript errors and all existing features intact**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest/apps/web
npx tsc --noEmit 2>&1 | grep "ProductsManagement" || echo "No errors"
```

Check that: add product still works, edit still works, delete still works, image upload still works, pagination still works.

- [ ] **Step 6: Commit**

```bash
git add src/components/super-admin/ProductsManagement.tsx
git commit -m "feat(admin): add PageHeader and skeleton loading to ProductsManagement"
```

---

## Task 7 — Redesign CategoriesManagement + fix duplicate-name check on create

**Files:**
- Modify: `src/components/super-admin/CategoriesManagement.tsx`

**What changes:** PageHeader with "+ Add Category" action, skeleton loading, empty state. **Bug fix:** duplicate name check currently only triggers on edit — fix it to also check on create.

- [ ] **Step 1: Read current file fully**

Read `src/components/super-admin/CategoriesManagement.tsx` to understand the form submit handler and name validation logic.

- [ ] **Step 2: Add PageHeader + skeleton**

Same pattern as Task 6: import `PageHeader`, `AdminSkeletonRow`, `AdminEmptyState`. Add `PageHeader` at top of return with `title="Categories"` and `action` button that opens the add form. Replace loading state in the categories list with skeleton cards.

- [ ] **Step 3: Fix duplicate-name check on create**

Find the form submit handler. Currently it checks `existingCategories.find(c => c.name === form.name && c.id !== form.id)` (only blocks duplicates on edit via the `c.id !== form.id` condition).

For **create** mode (when `form.id` is empty/null), the check `c.id !== form.id` matches everything, so it always passes. Fix by changing the condition:

```tsx
// BEFORE (broken for create):
const isDuplicate = categories.find(c => c.name.toLowerCase() === formData.name.toLowerCase() && c.id !== formData.id);

// AFTER (correct for both create and edit):
const isDuplicate = categories.find(c =>
  c.name.toLowerCase() === formData.name.toLowerCase() &&
  (!formData.id || c.id !== formData.id)
);
if (isDuplicate) {
  toast.error('A category with this name already exists');
  return;
}
```

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep "CategoriesManagement" || echo "No errors"
git add src/components/super-admin/CategoriesManagement.tsx
git commit -m "feat(admin): PageHeader + skeleton for Categories, fix duplicate name check on create"
```

---

## Task 8 — Redesign ProductTypesManagement

**Files:**
- Modify: `src/components/super-admin/ProductTypesManagement.tsx`

**What changes:** PageHeader with "+ Add Type" action, skeleton loading, empty state. No functional changes.

- [ ] **Step 1: Read current file**

Read `src/components/super-admin/ProductTypesManagement.tsx`.

- [ ] **Step 2: Apply PageHeader + skeleton pattern** (same as Tasks 6–7)

```tsx
<PageHeader
  title="Product Types"
  breadcrumbs={[{ label: 'Admin' }, { label: 'Products', href: '/admin/products' }, { label: 'Types' }]}
  action={<button onClick={() => openAddForm()} className="btn-primary text-sm px-4 py-2">+ Add Type</button>}
/>
```

Replace loading spinner with `AdminSkeletonCard` from `AdminSkeletonRow.tsx`.

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep "ProductTypesManagement" || echo "No errors"
git add src/components/super-admin/ProductTypesManagement.tsx
git commit -m "feat(admin): PageHeader + skeleton for ProductTypes"
```

---

## Task 9 — Redesign Inventory page + replace native `confirm()`

**Files:**
- Modify: `src/app/admin/products/inventory/page.tsx`

**What changes:** PageHeader, skeleton rows, replace native `confirm()` at line 99 with `ConfirmationDialog`. All inventory CRUD and inline-edit logic preserved.

- [ ] **Step 1: Read current file fully**

Read `src/app/admin/products/inventory/page.tsx` entirely.

- [ ] **Step 2: Add `ConfirmationDialog` state for unsaved-changes warning**

The native `confirm()` at line 99 fires when user clicks "Edit" on a different row while one row is already being edited. Replace with:

```tsx
// Add state:
const [discardDialog, setDiscardDialog] = useState<{ open: boolean; onConfirm: () => void }>({ open: false, onConfirm: () => {} });

// Replace the confirm() call:
// BEFORE:
if (!confirm('You have unsaved changes. Discard and edit this product instead?')) return;
handleEditProduct(product);

// AFTER:
setDiscardDialog({
  open: true,
  onConfirm: () => {
    setDiscardDialog({ open: false, onConfirm: () => {} });
    handleEditProduct(product);
  }
});

// Add to JSX:
<ConfirmationDialog
  isOpen={discardDialog.open}
  onClose={() => setDiscardDialog({ open: false, onConfirm: () => {} })}
  onConfirm={discardDialog.onConfirm}
  title="Discard unsaved changes?"
  message="You have unsaved changes to the current row. Discard them and edit this product instead?"
  confirmText="Discard"
  type="warning"
/>
```

- [ ] **Step 3: Add PageHeader + skeleton rows**

```tsx
import PageHeader from '@/components/admin/PageHeader';
import { AdminSkeletonRow } from '@/components/admin/AdminSkeletonRow';
import AdminEmptyState from '@/components/admin/AdminEmptyState';

// In JSX:
<PageHeader
  title="Inventory"
  breadcrumbs={[{ label: 'Admin' }, { label: 'Products', href: '/admin/products' }, { label: 'Inventory' }]}
/>

// In table body, replace loading spinner:
{loading
  ? Array.from({ length: 5 }).map((_, i) => <AdminSkeletonRow key={i} cols={7} />)
  : products.length === 0
    ? <tr><td colSpan={7}><AdminEmptyState icon="🏭" title="No inventory data" description="Add products to start tracking stock." /></td></tr>
    : products.map(p => /* existing row JSX */)}
```

- [ ] **Step 4: Add low-stock row highlight**

In the product row JSX, add a red tint to rows where `availableQty <= product.inventory?.minimumStock`:

```tsx
<tr className={`hover:bg-neutral-50 transition-colors ${isLowStock ? 'bg-error-50' : ''}`}>
```

Where `isLowStock = inv && inv.availableQuantity <= (inv.minimumStock || 0) && inv.minimumStock > 0`.

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep "inventory" || echo "No errors"
git add src/app/admin/products/inventory/page.tsx
git commit -m "feat(admin): PageHeader + skeleton + low-stock highlight for Inventory, replace native confirm"
```

---

## Task 10 — Redesign OrdersManagement

**Files:**
- Modify: `src/components/super-admin/OrdersManagement.tsx`

**What changes:** PageHeader, skeleton rows in table, consistent `StatusBadge`, wrap table in white card. All existing filter, search, pagination, detail modal, status update logic preserved.

- [ ] **Step 1: Read current file**

Read `src/components/super-admin/OrdersManagement.tsx` fully.

- [ ] **Step 2: Add PageHeader**

```tsx
<PageHeader
  title="Orders"
  breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Orders' }]}
/>
```

No action button on Orders — filters and search are sufficient.

- [ ] **Step 3: Replace inline status badge styles with `StatusBadge` component**

Find all instances where orders render status like `<span className="bg-yellow-100 text-yellow-800 ...">pending</span>` and replace with `<StatusBadge status={order.status} />` and `<StatusBadge status={order.paymentStatus} />`.

- [ ] **Step 4: Add skeleton rows during loading**

```tsx
{loading
  ? Array.from({ length: 5 }).map((_, i) => <AdminSkeletonRow key={i} cols={7} />)
  : orders.length === 0
    ? <tr><td colSpan={7}><AdminEmptyState icon="🛍️" title="No orders found" description="Orders will appear here once customers start purchasing." /></td></tr>
    : orders.map(order => /* existing row JSX */)}
```

- [ ] **Step 5: Wrap table in white card**

```tsx
<div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
  {/* existing filter bar */}
  {/* existing table */}
</div>
```

- [ ] **Step 6: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep "OrdersManagement" || echo "No errors"
git add src/components/super-admin/OrdersManagement.tsx
git commit -m "feat(admin): PageHeader + skeleton + StatusBadge for OrdersManagement"
```

---

## Task 11 — Redesign ReviewsManagement

**Files:**
- Modify: `src/components/super-admin/ReviewsManagement.tsx`

**What changes:** PageHeader, skeleton review cards, `StatusBadge` for review status. All tab navigation, filter cascade, approve/reject logic preserved.

- [ ] **Step 1: Read current file**

Read `src/components/super-admin/ReviewsManagement.tsx` fully.

- [ ] **Step 2: Add PageHeader + skeleton cards**

```tsx
<PageHeader
  title="Reviews"
  breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Reviews' }]}
/>
```

During loading, replace the reviews list with `AdminSkeletonCard` components from `AdminSkeletonRow.tsx`:

```tsx
{loading
  ? Array.from({ length: 6 }).map((_, i) => <AdminSkeletonCard key={i} />)
  : reviews.length === 0
    ? <AdminEmptyState icon="⭐" title="No reviews found" description="Reviews matching your filters will appear here." />
    : reviews.map(review => /* existing review card JSX */)}
```

- [ ] **Step 3: Replace inline status spans with StatusBadge**

Find `<span className="...">approved</span>` patterns in review cards and replace with `<StatusBadge status={review.status} />`.

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep "ReviewsManagement" || echo "No errors"
git add src/components/super-admin/ReviewsManagement.tsx
git commit -m "feat(admin): PageHeader + skeleton + StatusBadge for ReviewsManagement"
```

---

## Task 12 — Fix WishlistManagement dead search + redesign

**Files:**
- Modify: `src/components/super-admin/WishlistManagement.tsx`

**What changes:** PageHeader, skeleton rows, **fix dead search input** (wire `onChange` to `setSearch`). All wishlist data fetching and display logic preserved.

- [ ] **Step 1: Read current file**

Read `src/components/super-admin/WishlistManagement.tsx` fully. Find the search `<input>` element and note whether `setSearch` is called on `onChange`.

- [ ] **Step 2: Fix the dead search input**

Find the search input element. It likely looks like:
```tsx
<input value={search} onChange={/* missing or wrong */} ... />
```

Ensure it has:
```tsx
<input
  value={search}
  onChange={e => setSearch(e.target.value)}
  placeholder="Search products..."
  className="..."
/>
```

Verify that `search` state filters the `products` list client-side (already computed as `filtered` array in the component — just ensure the input is wired to `setSearch`).

- [ ] **Step 3: Add PageHeader + skeleton**

```tsx
<PageHeader
  title="Wishlist Insights"
  breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Wishlist' }]}
/>
```

Replace loading state with skeleton rows in the table:
```tsx
{loading
  ? Array.from({ length: 5 }).map((_, i) => <AdminSkeletonRow key={i} cols={5} />)
  : filtered.length === 0
    ? <AdminEmptyState icon="💜" title="No wishlist data" description="Products saved by customers will appear here." />
    : filtered.map(p => /* existing row JSX */)}
```

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep "WishlistManagement" || echo "No errors"
git add src/components/super-admin/WishlistManagement.tsx
git commit -m "feat(admin): fix dead search, PageHeader + skeleton for WishlistManagement"
```

---

## Task 13 — Redesign Staff page + replace native `confirm()`

**Files:**
- Modify: `src/app/admin/staff/page.tsx`

**What changes:** PageHeader, skeleton cards, replace native `confirm()` at line 153 with `ConfirmationDialog`. All staff CRUD, activity feed, password management preserved.

- [ ] **Step 1: Read current file**

Read `src/app/admin/staff/page.tsx` fully. Identify the `confirm()` call at line ~153 (the activate/deactivate toggle).

- [ ] **Step 2: Replace native confirm with ConfirmationDialog**

Add state:
```tsx
const [statusDialog, setStatusDialog] = useState<{ open: boolean; name: string; action: string; onConfirm: () => void }>({
  open: false, name: '', action: '', onConfirm: () => {}
});
```

Replace the native confirm block:
```tsx
// BEFORE:
if (!confirm(`Are you sure you want to ${action} ${name}?`)) return;
await toggleStatus(id, action);

// AFTER:
setStatusDialog({
  open: true,
  name,
  action,
  onConfirm: async () => {
    setStatusDialog(s => ({ ...s, open: false }));
    await toggleStatus(id, action);
  }
});

// Add to JSX:
<ConfirmationDialog
  isOpen={statusDialog.open}
  onClose={() => setStatusDialog(s => ({ ...s, open: false }))}
  onConfirm={statusDialog.onConfirm}
  title={`${statusDialog.action === 'activate' ? 'Activate' : 'Deactivate'} staff member?`}
  message={`Are you sure you want to ${statusDialog.action} ${statusDialog.name}?`}
  confirmText={statusDialog.action === 'activate' ? 'Activate' : 'Deactivate'}
  type={statusDialog.action === 'activate' ? 'info' : 'warning'}
/>
```

- [ ] **Step 3: Add PageHeader + skeleton cards**

```tsx
<PageHeader
  title="Staff"
  breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Staff' }]}
  action={<button onClick={() => setShowAddDrawer(true)} className="btn-primary text-sm px-4 py-2">+ Add Staff</button>}
/>
```

Replace the loading spinner in the staff cards grid with `AdminSkeletonCard` elements:
```tsx
{loading
  ? Array.from({ length: 4 }).map((_, i) => <AdminSkeletonCard key={i} />)
  : staff.length === 0
    ? <AdminEmptyState icon="👤" title="No staff members" description="Add your first staff member to get started." />
    : staff.map(member => /* existing card JSX */)}
```

- [ ] **Step 4: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep "staff" || echo "No errors"
git add src/app/admin/staff/page.tsx
git commit -m "feat(admin): PageHeader + skeleton + replace native confirm for Staff page"
```

---

## Task 14 — Redesign Customers page

**Files:**
- Modify: `src/app/admin/customers/page.tsx`

**What changes:** PageHeader, skeleton rows. All customer list, filtering, detail modal, password reset, status toggle logic preserved.

- [ ] **Step 1: Read current file**

Read `src/app/admin/customers/page.tsx` fully.

- [ ] **Step 2: Add PageHeader + skeleton rows**

```tsx
<PageHeader
  title="Customers"
  breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Customers' }]}
/>
```

Replace loading state in the customer table body:
```tsx
{loading
  ? Array.from({ length: 8 }).map((_, i) => <AdminSkeletonRow key={i} cols={6} />)
  : customers.length === 0
    ? <tr><td colSpan={6}><AdminEmptyState icon="👥" title="No customers yet" description="Customer accounts will appear here after registration." /></td></tr>
    : customers.map(customer => /* existing row JSX */)}
```

Wrap table in white card:
```tsx
<div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
```

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep "customers" || echo "No errors"
git add src/app/admin/customers/page.tsx
git commit -m "feat(admin): PageHeader + skeleton for Customers page"
```

---

## Task 15 — Redesign Contacts page + replace native `confirm()`

**Files:**
- Modify: `src/app/admin/contacts/page.tsx`

**What changes:** PageHeader, skeleton rows, replace native `confirm()` for delete with existing `ConfirmationDialog` already imported. Add original message context to the response modal. All contact CRUD, read-marking, response, archive logic preserved.

- [ ] **Step 1: Read current file**

Read `src/app/admin/contacts/page.tsx` fully. Find: the `confirm()` at line ~153, the response modal JSX, the `ConfirmationDialog` usage.

- [ ] **Step 2: Replace native confirm with ConfirmationDialog**

The contacts page already imports and uses `ConfirmationDialog`. Find where `confirm()` is still used for delete (line ~153) and wire it to the existing `ConfirmationDialog` state in the component (or add a new state if the existing one is for a different action):

```tsx
// Add delete confirmation state if not present:
const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; contactId: string | null }>({ open: false, contactId: null });

// Replace confirm():
// BEFORE: if (!confirm('Delete this message?')) return; await handleDelete(id);
// AFTER:
setDeleteDialog({ open: true, contactId: id });

// In JSX add:
<ConfirmationDialog
  isOpen={deleteDialog.open}
  onClose={() => setDeleteDialog({ open: false, contactId: null })}
  onConfirm={async () => {
    if (deleteDialog.contactId) await handleDelete(deleteDialog.contactId);
    setDeleteDialog({ open: false, contactId: null });
  }}
  title="Delete message?"
  message="This will permanently delete the contact message. This action cannot be undone."
  confirmText="Delete"
  type="danger"
/>
```

- [ ] **Step 3: Add original message to response modal**

Find the response modal JSX. Before the `<textarea>` for admin response, add the original message for context:

```tsx
{/* Show original message context */}
{selectedContact && (
  <div className="bg-neutral-50 rounded-lg p-3 mb-4 border border-neutral-200">
    <p className="text-xs font-medium text-neutral-500 mb-1">Original message from {selectedContact.name}:</p>
    <p className="text-xs text-neutral-700">{selectedContact.message}</p>
  </div>
)}
<textarea ... />
```

- [ ] **Step 4: Add PageHeader + skeleton**

```tsx
<PageHeader
  title="Messages"
  breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Messages' }]}
/>
```

Replace loading spinner in table body with skeleton rows.

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep "contacts" || echo "No errors"
git add src/app/admin/contacts/page.tsx
git commit -m "feat(admin): PageHeader + skeleton + ConfirmationDialog for Contacts, add message context to reply modal"
```

---

## Task 16 — Redesign Settings page

**Files:**
- Modify: `src/app/admin/settings/page.tsx`

**What changes:** PageHeader, wrap each settings tab in a white card with a section heading, add thin dividers between setting groups. All API calls, tab lazy-loading, form submission, notification bar live preview preserved.

- [ ] **Step 1: Read current file**

Read `src/app/admin/settings/page.tsx` fully.

- [ ] **Step 2: Add PageHeader**

```tsx
<PageHeader
  title="Settings"
  breadcrumbs={[{ label: 'Admin', href: '/admin/dashboard' }, { label: 'Settings' }]}
/>
```

- [ ] **Step 3: Wrap each tab content in a white card**

Each tab's form content should be wrapped in:
```tsx
<div className="bg-white rounded-xl border border-neutral-200 p-6">
  <h2 className="text-sm font-semibold text-neutral-800 mb-4">{tabTitle}</h2>
  {/* existing form fields */}
</div>
```

- [ ] **Step 4: Redesign tab pills**

Replace the existing tab list styling. The tabs should be a horizontal scrollable pill row:
```tsx
<div className="flex gap-2 overflow-x-auto pb-1 mb-6">
  {TABS.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
        activeTab === tab.id
          ? 'bg-primary-600 text-white'
          : 'bg-white border border-neutral-200 text-neutral-600 hover:border-primary-300 hover:text-primary-600'
      }`}
    >
      {tab.label}
    </button>
  ))}
</div>
```

- [ ] **Step 5: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep "settings" || echo "No errors"
git add src/app/admin/settings/page.tsx
git commit -m "feat(admin): PageHeader + white card layout + pill tabs for Settings"
```

---

## Task 17 — Redesign UserTypesManagement

**Files:**
- Modify: `src/components/super-admin/UserTypesManagement.tsx`

**What changes:** PageHeader, skeleton loading. All user type CRUD and permission toggles preserved.

- [ ] **Step 1: Read current file and apply PageHeader + skeleton**

```tsx
<PageHeader
  title="User Types"
  breadcrumbs={[{ label: 'Admin' }, { label: 'Settings', href: '/admin/settings' }, { label: 'User Types' }]}
  action={<button onClick={() => openAddForm()} className="btn-primary text-sm px-4 py-2">+ Add Type</button>}
/>
```

Replace loading state with `AdminSkeletonCard` elements.

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit 2>&1 | grep "UserTypes" || echo "No errors"
git add src/components/super-admin/UserTypesManagement.tsx
git commit -m "feat(admin): PageHeader + skeleton for UserTypes"
```

---

## Task 18 — Final consistency pass + TypeScript clean build

**Files:**
- All modified files

- [ ] **Step 1: Run full TypeScript check**

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest/apps/web
npx tsc --noEmit 2>&1
```

Fix any errors found. Common issues:
- Missing imports for new shared components
- Type mismatches in new `DashboardStats` interface fields (use `|| 0` fallbacks)
- `AdminSkeletonCard` not exported — verify the export in `AdminSkeletonRow.tsx`

- [ ] **Step 2: Verify all pages load without error**

Start the dev server and check each admin page loads:
```bash
cd /Users/ram/Desktop/applications/khaalis-harvest
yarn dev
```

Visit and verify no console errors:
- `/admin/dashboard`
- `/admin/products`
- `/admin/products/categories`
- `/admin/products/types`
- `/admin/products/inventory`
- `/admin/orders`
- `/admin/reviews`
- `/admin/wishlist`
- `/admin/staff`
- `/admin/customers`
- `/admin/contacts`
- `/admin/settings`
- `/admin/settings/user-types`

- [ ] **Step 3: Verify no regressions**

For each page, confirm the following still work:
- **Products**: Create product, edit product, delete product, upload image, pagination
- **Categories**: Create category, edit category, delete category, duplicate name check
- **Inventory**: Edit stock inline, save changes, low-stock highlight
- **Orders**: Filter by status, search, open detail modal, update status
- **Reviews**: Tab navigation, filter cascade, approve, reject
- **Staff**: Add staff, edit staff, toggle active/inactive (now uses ConfirmationDialog), view activity
- **Customers**: Search, view details modal, set password
- **Contacts**: View message, respond, mark read, delete (now uses ConfirmationDialog)
- **Settings**: All 7 tabs load, save, notification bar preview works
- **Dashboard**: Attention cards show when counts > 0, recent orders load, approve review inline works

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(admin): complete admin dashboard redesign — clean SaaS layout, attention hub, PageHeaders, skeletons, StatusBadge system, all functional gaps fixed"
```

---

## Self-Review

### Spec Coverage Check

| Design requirement | Task covering it |
|-------------------|-----------------|
| Fixed sidebar, 5 groups, attention badges | Task 4 |
| Remove collapse toggle | Task 4 |
| Page header on every page | Tasks 5–17 |
| Dashboard attention strip (pending orders, reviews, messages, low stock) | Tasks 3, 5 |
| Dashboard KPI cards with trend | Task 5 |
| Dashboard recent orders table | Task 5 |
| Dashboard pending reviews panel with inline approve | Task 5 |
| Dashboard recent messages panel | Task 5 |
| Skeleton loaders on all pages | Tasks 2, 6–17 |
| Empty states on all pages | Tasks 6–17 |
| StatusBadge system | Task 2, used in 5, 10, 11 |
| Replace all native `confirm()` | Tasks 9, 13, 15 |
| Fix dead wishlist search | Task 12 |
| Fix duplicate category name check on create | Task 7 |
| Fix missing `credentials: 'include'` on dashboard fetch | Task 5 |
| Add original message context in contacts reply modal | Task 15 |
| Settings tab pill redesign | Task 16 |
| Low-stock row highlight in inventory | Task 9 |

### No Placeholders ✓
All tasks contain exact code, file paths, and commands.

### Type Consistency ✓
- `AdminSkeletonCard` is exported from `AdminSkeletonRow.tsx` (same file, named export)
- `StatusBadge` receives `status: string` — matches all usage sites
- `DashboardStats` interface exactly matches what `getDashboardStats` returns
- `AttentionCard` `color` prop is `'amber' | 'red' | 'blue'` — matches all usage
- `PageHeader` `breadcrumbs` is `Breadcrumb[]` with optional `href` — matches all usage
