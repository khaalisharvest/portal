# Admin Dashboard Production Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical, important, and minor issues identified in the 2026-06-11 admin dashboard audit to make it production-ready.

**Architecture:** NestJS backend (apps/backend) + Next.js 15 frontend (apps/web). Frontend calls its own BFF proxy routes (`/api/v1/...`) which forward to NestJS. All auth is JWT via `Authorization: Bearer <token>` header. BFF uses shared `proxy()` helper from `src/lib/proxy.ts`.

**Tech Stack:** NestJS + TypeORM (PostgreSQL), Next.js 15 App Router, TypeScript, react-hot-toast for notifications, ConfirmationDialog component for destructive actions.

---

## Task 1: BFF Proxy Routes for Contacts (Critical Blocker)

The contacts page calls `/api/v1/contacts`, `/api/v1/contacts/stats`, `/api/v1/contacts/:id`, and `/api/v1/contacts/:id/read` as relative Next.js URLs. None of these BFF route files exist. In production the calls 404.

**Files:**
- Create: `apps/web/src/app/api/v1/contacts/route.ts`
- Create: `apps/web/src/app/api/v1/contacts/stats/route.ts`
- Create: `apps/web/src/app/api/v1/contacts/[id]/route.ts`
- Create: `apps/web/src/app/api/v1/contacts/[id]/read/route.ts`

- [ ] **Step 1: Create main contacts route (list + create)**

Create `apps/web/src/app/api/v1/contacts/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/contacts', passQuery: true, requireAuth: true });

export const POST = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/contacts', requireAuth: false });
```

- [ ] **Step 2: Create contacts stats route**

Create `apps/web/src/app/api/v1/contacts/stats/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/contacts/stats', requireAuth: true });
```

- [ ] **Step 3: Create contacts [id] route (get + update + delete)**

Create `apps/web/src/app/api/v1/contacts/[id]/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/contacts/${params.id}`, requireAuth: true });

export const PATCH = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/contacts/${params.id}`, requireAuth: true });

export const DELETE = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/contacts/${params.id}`, requireAuth: true });
```

- [ ] **Step 4: Create contacts [id]/read route**

Create `apps/web/src/app/api/v1/contacts/[id]/read/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const PATCH = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/contacts/${params.id}/read`, requireAuth: true });
```

- [ ] **Step 5: Verify routes resolve correctly**

Run: `find apps/web/src/app/api/v1/contacts -type f`

Expected output:
```
apps/web/src/app/api/v1/contacts/route.ts
apps/web/src/app/api/v1/contacts/stats/route.ts
apps/web/src/app/api/v1/contacts/[id]/route.ts
apps/web/src/app/api/v1/contacts/[id]/read/route.ts
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/api/v1/contacts/
git commit -m "fix: add BFF proxy routes for contacts endpoints"
```

---

## Task 2: Fix Inventory Read Side (Critical Blocker)

The inventory page fetches products but `product.inventory` is always `undefined` because the admin products query doesn't join inventory. The Product entity has `@OneToMany(() => Inventory, inventory => inventory.product)`. Fix: add the join in the `findAll` query and update the inventory page to handle the array shape and add proper pagination.

**Files:**
- Modify: `apps/backend/src/modules/products/products.service.ts` (add inventory join in admin query)
- Modify: `apps/web/src/app/admin/products/inventory/page.tsx` (fix inventory read + add pagination)
- Modify: `apps/web/src/app/api/v1/products/admin/route.ts` (verify passQuery is true)

- [ ] **Step 1: Check the admin BFF route passes query params**

Read `apps/web/src/app/api/v1/products/admin/route.ts`. It should have `passQuery: true`. If not, add it.

The file should be:
```typescript
import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const GET = (req: NextRequest) =>
  proxy(req, { path: '/api/v1/products', passQuery: true, requireAuth: true });
```

- [ ] **Step 2: Add inventory join to admin products query in products.service.ts**

In `apps/backend/src/modules/products/products.service.ts`, change line 82 (the baseQuery builder inside `findAll`) from:
```typescript
const baseQuery = this.productRepository.createQueryBuilder('product')
  .leftJoinAndSelect('product.category', 'category')
  .leftJoinAndSelect('product.productType', 'productType');
```
to:
```typescript
const baseQuery = this.productRepository.createQueryBuilder('product')
  .leftJoinAndSelect('product.category', 'category')
  .leftJoinAndSelect('product.productType', 'productType')
  .leftJoinAndSelect('product.inventory', 'inventory', 'inventory.isActive = :active', { active: true });
```

- [ ] **Step 3: Update inventory page to handle array shape and add pagination**

Replace the entire content of `apps/web/src/app/admin/products/inventory/page.tsx` with:

```typescript
'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import toast from 'react-hot-toast';

interface InventoryRecord {
  id?: string;
  productId: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  minimumStock: number;
  location?: string;
  batchNumber?: string;
  expiryDate?: string;
}

interface Product {
  id: string;
  name: string;
  images: string[];
  price: number;
  unit: string;
  inventory: InventoryRecord[];
}

export default function InventoryPage() {
  return (
    <ProtectedRoute requiredRoles={['super_admin', 'staff']}>
      <AdminLayout>
        <InventoryContent />
      </AdminLayout>
    </ProtectedRoute>
  );
}

function InventoryContent() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ quantity: 0, minimumStock: 0, location: '', batchNumber: '', expiryDate: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const LIMIT = 20;

  const fetchProducts = useCallback(async (page = 1) => {
    const token = localStorage.getItem('backend_token');
    try {
      setIsLoading(true);
      const res = await fetch(`/api/v1/products/admin?includeAll=true&limit=${LIMIT}&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      const payload = data.data || data;
      setProducts(payload.products || []);
      setTotalPages(payload.totalPages || 1);
      setTotalProducts(payload.total || 0);
      setCurrentPage(page);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(1); }, [fetchProducts]);

  const handleUpdateInventory = async (productId: string) => {
    const token = localStorage.getItem('backend_token');
    try {
      const res = await fetch(`/api/v1/products/${productId}/inventory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          productId,
          quantity: editForm.quantity,
          minimumStock: editForm.minimumStock,
          location: editForm.location || undefined,
          batchNumber: editForm.batchNumber || undefined,
          expiryDate: editForm.expiryDate || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Inventory updated');
      setEditingId(null);
      fetchProducts(currentPage);
    } catch {
      toast.error('Failed to update inventory');
    }
  };

  const startEdit = (product: Product) => {
    const inv = product.inventory?.[0];
    setEditingId(product.id);
    setEditForm({
      quantity: inv?.quantity ?? 0,
      minimumStock: inv?.minimumStock ?? 10,
      location: inv?.location ?? '',
      batchNumber: inv?.batchNumber ?? '',
      expiryDate: inv?.expiryDate ? inv.expiryDate.split('T')[0] : '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Inventory Management</h1>
          <p className="text-neutral-600 mt-1">Set stock levels for each product ({totalProducts} total)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="text-left px-6 py-4 text-sm font-semibold text-neutral-600">Product</th>
              <th className="text-center px-4 py-4 text-sm font-semibold text-neutral-600">Available</th>
              <th className="text-center px-4 py-4 text-sm font-semibold text-neutral-600">Reserved</th>
              <th className="text-center px-4 py-4 text-sm font-semibold text-neutral-600">Min Stock</th>
              <th className="text-center px-4 py-4 text-sm font-semibold text-neutral-600">Status</th>
              <th className="text-right px-6 py-4 text-sm font-semibold text-neutral-600">Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, idx) => {
              const inv = product.inventory?.[0];
              const available = inv ? (inv.quantity - (inv.reservedQuantity || 0)) : null;
              const isLow = inv && available !== null && available <= (inv.minimumStock || 10);
              const isEditing = editingId === product.id;

              return (
                <motion.tr
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="border-b border-neutral-100 hover:bg-neutral-50"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0] || '/images/placeholder.svg'}
                        alt={product.name}
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }}
                      />
                      <div>
                        <p className="font-medium text-neutral-800 text-sm">{product.name}</p>
                        <p className="text-xs text-neutral-400">PKR {product.price} / {product.unit}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editForm.quantity}
                        onChange={e => setEditForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
                        className="w-20 text-center border border-neutral-300 rounded-lg px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className={`font-semibold ${available === null ? 'text-neutral-400' : isLow ? 'text-red-600' : 'text-green-600'}`}>
                        {available === null ? '∞' : available}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center text-neutral-500 text-sm">
                    {inv?.reservedQuantity ?? 0}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        value={editForm.minimumStock}
                        onChange={e => setEditForm(f => ({ ...f, minimumStock: parseInt(e.target.value) || 0 }))}
                        className="w-20 text-center border border-neutral-300 rounded-lg px-2 py-1 text-sm"
                      />
                    ) : (
                      <span className="text-neutral-500 text-sm">{inv?.minimumStock ?? 10}</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    {inv ? (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {isLow ? 'Low Stock' : 'In Stock'}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full bg-neutral-100 text-neutral-500">Untracked</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isEditing ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleUpdateInventory(product.id)}
                          className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-xs px-3 py-1.5 bg-neutral-200 text-neutral-700 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEdit(product)}
                        className="text-xs px-3 py-1.5 border border-neutral-300 text-neutral-600 rounded-lg hover:border-primary-400 hover:text-primary-600 transition-colors"
                      >
                        Edit Stock
                      </button>
                    )}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="text-center py-12 text-neutral-500">
            <p className="text-4xl mb-3">📦</p>
            <p>No products found. Add products first.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="border-t border-neutral-200 px-6 py-4 flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => fetchProducts(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => fetchProducts(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 text-sm border border-neutral-300 rounded-lg disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/products/products.service.ts \
        apps/web/src/app/admin/products/inventory/page.tsx
git commit -m "fix: join inventory in admin products query; add pagination to inventory page"
```

---

## Task 3: Implement User Types NestJS Backend (Critical Blocker)

The `/admin/settings/user-types` page has a full UI and BFF routes, but the NestJS backend has no module, entity, controller, or service at `super-admin/user-types`. All calls 404.

**Files:**
- Create: `apps/backend/src/modules/user-types/entities/user-type.entity.ts`
- Create: `apps/backend/src/modules/user-types/dto/create-user-type.dto.ts`
- Create: `apps/backend/src/modules/user-types/user-types.service.ts`
- Create: `apps/backend/src/modules/user-types/user-types.controller.ts`
- Create: `apps/backend/src/modules/user-types/user-types.module.ts`
- Modify: `apps/backend/src/app.module.ts` (register UserTypesModule)
- Modify: `apps/web/src/components/super-admin/UserTypesManagement.tsx` (add error toasts)

- [ ] **Step 1: Create UserType entity**

Create `apps/backend/src/modules/user-types/entities/user-type.entity.ts`:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_types')
export class UserType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  permissions: Record<string, boolean>;

  @Column({ type: 'json', nullable: true })
  features: Record<string, boolean>;

  @Column({ type: 'json', nullable: true })
  onboardingSteps: Record<string, string>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

- [ ] **Step 2: Create DTO**

Create `apps/backend/src/modules/user-types/dto/create-user-type.dto.ts`:
```typescript
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, IsObject } from 'class-validator';

export class CreateUserTypeDto {
  @IsString() @IsNotEmpty()
  name: string;

  @IsString() @IsNotEmpty()
  displayName: string;

  @IsString() @IsOptional()
  description?: string;

  @IsObject() @IsOptional()
  permissions?: Record<string, boolean>;

  @IsObject() @IsOptional()
  features?: Record<string, boolean>;

  @IsObject() @IsOptional()
  onboardingSteps?: Record<string, string>;

  @IsBoolean() @IsOptional()
  isActive?: boolean;

  @IsInt() @IsOptional()
  sortOrder?: number;

  @IsString() @IsOptional()
  icon?: string;

  @IsString() @IsOptional()
  color?: string;
}
```

- [ ] **Step 3: Create UserTypes service**

Create `apps/backend/src/modules/user-types/user-types.service.ts`:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserType } from './entities/user-type.entity';
import { CreateUserTypeDto } from './dto/create-user-type.dto';

@Injectable()
export class UserTypesService {
  constructor(
    @InjectRepository(UserType)
    private repo: Repository<UserType>,
  ) {}

  findAll(): Promise<UserType[]> {
    return this.repo.find({ order: { sortOrder: 'ASC', createdAt: 'ASC' } });
  }

  async findOne(id: string): Promise<UserType> {
    const ut = await this.repo.findOne({ where: { id } });
    if (!ut) throw new NotFoundException('User type not found');
    return ut;
  }

  create(dto: CreateUserTypeDto): Promise<UserType> {
    const ut = this.repo.create(dto);
    return this.repo.save(ut);
  }

  async update(id: string, dto: Partial<CreateUserTypeDto>): Promise<UserType> {
    const ut = await this.findOne(id);
    Object.assign(ut, dto);
    return this.repo.save(ut);
  }

  async remove(id: string): Promise<void> {
    const ut = await this.findOne(id);
    await this.repo.remove(ut);
  }
}
```

- [ ] **Step 4: Create UserTypes controller**

Create `apps/backend/src/modules/user-types/user-types.controller.ts`:
```typescript
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';
import { UserTypesService } from './user-types.service';
import { CreateUserTypeDto } from './dto/create-user-type.dto';

@ApiTags('User Types')
@Controller('super-admin/user-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('super_admin')
@ApiBearerAuth()
export class UserTypesController {
  constructor(private service: UserTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List all user types' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a user type' })
  create(@Body() dto: CreateUserTypeDto) {
    return this.service.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user type by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user type' })
  update(@Param('id') id: string, @Body() dto: CreateUserTypeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user type' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
```

- [ ] **Step 5: Create UserTypes module**

Create `apps/backend/src/modules/user-types/user-types.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserType } from './entities/user-type.entity';
import { UserTypesService } from './user-types.service';
import { UserTypesController } from './user-types.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserType])],
  controllers: [UserTypesController],
  providers: [UserTypesService],
})
export class UserTypesModule {}
```

- [ ] **Step 6: Register UserTypesModule in app.module.ts**

In `apps/backend/src/app.module.ts`, add import:
```typescript
import { UserTypesModule } from './modules/user-types/user-types.module';
```

And add `UserTypesModule` to the `imports` array (after `StaffModule`):
```typescript
    StaffModule,
    UserTypesModule,
```

- [ ] **Step 7: Add error toasts to UserTypesManagement.tsx**

In `apps/web/src/components/super-admin/UserTypesManagement.tsx`:

1. Add `import toast from 'react-hot-toast';` at the top.

2. Replace `loadUserTypes` catch block (line ~54):
```typescript
    } catch (error) {
      toast.error('Failed to load user types');
    } finally {
```

3. Replace `handleSubmit` catch block (line ~71):
```typescript
    } catch (error) {
      toast.error(editingType ? 'Failed to update user type' : 'Failed to create user type');
    }
```

4. Replace `handleConfirmDelete` catch block (line ~119):
```typescript
    } catch (error) {
      toast.error('Failed to delete user type');
    } finally {
```

- [ ] **Step 8: Commit**

```bash
git add apps/backend/src/modules/user-types/ \
        apps/backend/src/app.module.ts \
        apps/web/src/components/super-admin/UserTypesManagement.tsx
git commit -m "feat: implement UserTypes backend module; add error toasts to UserTypesManagement"
```

---

## Task 4: Fix N+1 Customer Stats Query (Critical — Performance)

`findCustomersWithPagination` fires 4 DB queries per user (totalOrders, completedOrders, totalSpent, recentOrders), totalling up to 40+ queries per page load of 10 customers. Replace with a single SQL aggregate query.

**Files:**
- Modify: `apps/backend/src/modules/users/users.service.ts`

- [ ] **Step 1: Replace findCustomersWithPagination with a single aggregate query**

In `apps/backend/src/modules/users/users.service.ts`, replace the entire `findCustomersWithPagination` method (lines 97–169) with:

```typescript
  async findCustomersWithPagination(page: number = 1, limit: number = 10, search?: string) {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .select([
        'user.id', 'user.name', 'user.phone', 'user.email',
        'user.role', 'user.isActive', 'user.lastLoginAt', 'user.createdAt',
      ])
      .addSelect('COUNT(DISTINCT o.id)', 'totalOrders')
      .addSelect(
        `COUNT(DISTINCT CASE WHEN o.status = '${OrderStatus.DELIVERED}' THEN o.id END)`,
        'completedOrders',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN o.status = '${OrderStatus.DELIVERED}' THEN o."totalAmount" ELSE 0 END), 0)`,
        'totalSpent',
      )
      .leftJoin('orders', 'o', 'o."userId" = user.id')
      .where('user.role = :role', { role: 'customer' })
      .groupBy(
        'user.id, user.name, user.phone, user.email, user.role, user.isActive, user.lastLoginAt, user.createdAt',
      )
      .orderBy('user.createdAt', 'DESC');

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.phone ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const totalQuery = this.usersRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: 'customer' });
    if (search) {
      totalQuery.andWhere(
        '(user.name ILIKE :search OR user.phone ILIKE :search OR user.email ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    const total = await totalQuery.getCount();

    const rawRows = await queryBuilder.skip((page - 1) * limit).take(limit).getRawMany();

    const recentOrdersMap = new Map<string, any[]>();
    if (rawRows.length > 0) {
      const userIds = rawRows.map(r => r.user_id);
      const recent = await this.orderRepository
        .createQueryBuilder('order')
        .select(['order.id', 'order.orderNumber', 'order.status', 'order.totalAmount', 'order.createdAt', 'order.userId'])
        .where('order.userId IN (:...userIds)', { userIds })
        .orderBy('order.createdAt', 'DESC')
        .getMany();

      for (const o of recent) {
        if (!recentOrdersMap.has(o.userId)) recentOrdersMap.set(o.userId, []);
        const list = recentOrdersMap.get(o.userId);
        if (list.length < 5) list.push(o);
      }
    }

    const users = rawRows.map(r => {
      const totalOrders = parseInt(r.totalOrders, 10) || 0;
      const completedOrders = parseInt(r.completedOrders, 10) || 0;
      const totalSpent = parseFloat(r.totalSpent) || 0;
      return {
        id: r.user_id,
        name: r.user_name,
        phone: r.user_phone,
        email: r.user_email,
        role: r.user_role,
        isActive: r.user_isActive,
        lastLoginAt: r.user_lastLoginAt,
        createdAt: r.user_createdAt,
        orderStats: {
          totalOrders,
          completedOrders,
          totalSpent,
          averageOrderValue: completedOrders > 0 ? totalSpent / completedOrders : 0,
          pendingOrders: totalOrders - completedOrders,
        },
        recentOrders: recentOrdersMap.get(r.user_id) || [],
      };
    });

    return {
      users,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    };
  }
```

Note: The `orders` table name in the raw join (`leftJoin('orders', 'o', ...)`) must match what TypeORM uses. Verify with:
```bash
grep -r "Entity\('orders'\)" apps/backend/src/modules/orders/entities/
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/modules/users/users.service.ts
git commit -m "perf: replace N+1 customer stats queries with single aggregate SQL"
```

---

## Task 5: Staff Edit + Delete (Important)

No way to edit a staff member's details or delete one. Need backend endpoints + BFF routes + UI.

**Files:**
- Modify: `apps/backend/src/modules/staff/staff.controller.ts` (add PATCH /:id and DELETE /:id)
- Create: `apps/web/src/app/api/v1/admin/staff/[id]/route.ts` (add PATCH + DELETE methods)
- Modify: `apps/web/src/app/admin/staff/page.tsx` (add Edit modal + Delete button + toggleStatus error handling)

- [ ] **Step 1: Add PATCH and DELETE to staff controller**

In `apps/backend/src/modules/staff/staff.controller.ts`, add the missing imports at the top:
```typescript
import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
```

Add `UpdateStaffDto` class after `CreateStaffDto`:
```typescript
class UpdateStaffDto {
  @IsString() @IsNotEmpty() @IsOptional() name?: string;
  @IsOptional() phone?: string;
  @IsEmail() @IsOptional() email?: string;
  @IsString() @MinLength(6) @IsOptional() password?: string;
}
```

Add the two new endpoints after `@Patch(':id/status')`:
```typescript
  @Patch(':id')
  @ApiOperation({ summary: 'Update staff member details' })
  async updateStaff(@Param('id') id: string, @Body() dto: UpdateStaffDto) {
    const updates: any = {};
    if (dto.name) updates.name = dto.name;
    if (dto.phone) updates.phone = dto.phone;
    if (dto.email !== undefined) updates.email = dto.email;
    if (dto.password) {
      const bcrypt = await import('bcryptjs');
      updates.password = await bcrypt.hash(dto.password, 10);
    }
    const user = await this.usersService.update(id, updates);
    const { password, ...result } = user as any;
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a staff member permanently' })
  async deleteStaff(@Param('id') id: string) {
    await this.usersService.remove(id);
    return { message: 'Staff member deleted' };
  }
```

- [ ] **Step 2: Add PATCH + DELETE to BFF staff [id] route**

In `apps/web/src/app/api/v1/admin/staff/[id]/route.ts` (this file may only have status sub-routes; check what exists first with `ls apps/web/src/app/api/v1/admin/staff/`).

The existing file at `apps/web/src/app/api/v1/admin/staff/[id]/status/route.ts` handles PATCH for status. We need a sibling route at `[id]/route.ts` for editing and deleting.

Create `apps/web/src/app/api/v1/admin/staff/[id]/route.ts`:
```typescript
import { NextRequest } from 'next/server';
import { proxy } from '@/lib/proxy';

export const PATCH = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/admin/staff/${params.id}`, requireAuth: true });

export const DELETE = (req: NextRequest, { params }: { params: { id: string } }) =>
  proxy(req, { path: `/api/v1/admin/staff/${params.id}`, requireAuth: true });
```

- [ ] **Step 3: Add Edit modal, Delete button, and toggleStatus error handling to staff/page.tsx**

In `apps/web/src/app/admin/staff/page.tsx`, make the following changes:

**a) Add new state variables** after `const [selectedStaff, setSelectedStaff] = useState<string | null>(null);`:
```typescript
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', password: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMember, setDeletingMember] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState(false);
```

**b) Fix toggleStatus** to add error handling (replace existing function):
```typescript
  const toggleStatus = async (id: string, isActive: boolean) => {
    try {
      const r = await fetch(`/api/v1/admin/staff/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
        body: JSON.stringify({ isActive }),
      });
      if (r.ok) {
        toast.success(isActive ? 'Staff activated' : 'Staff deactivated');
        fetchStaff();
      } else {
        const e = await r.json();
        toast.error(e.error || 'Failed to update status');
      }
    } catch {
      toast.error('Failed to update status');
    }
  };
```

**c) Add handleEditStaff and handleDeleteStaff functions** after `toggleStatus`:
```typescript
  const openEdit = (member: StaffMember) => {
    setEditingMember(member);
    setEditForm({ name: member.name, phone: member.phone, email: member.email || '', password: '' });
    setShowEditForm(true);
  };

  const handleEditStaff = async () => {
    if (!editingMember || !editForm.name || !editForm.phone) {
      toast.error('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const body: any = { name: editForm.name, phone: editForm.phone, email: editForm.email || undefined };
      if (editForm.password) body.password = editForm.password;
      const r = await fetch(`/api/v1/admin/staff/${editingMember.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: authHeader() },
        body: JSON.stringify(body),
      });
      if (r.ok) {
        toast.success('Staff member updated');
        setShowEditForm(false);
        setEditingMember(null);
        fetchStaff();
      } else {
        const e = await r.json();
        toast.error(e.error || 'Failed to update staff');
      }
    } catch {
      toast.error('Failed to update staff');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingMember) return;
    setDeleting(true);
    try {
      const r = await fetch(`/api/v1/admin/staff/${deletingMember.id}`, {
        method: 'DELETE',
        headers: { Authorization: authHeader() },
      });
      if (r.ok) {
        toast.success('Staff member deleted');
        setShowDeleteConfirm(false);
        setDeletingMember(null);
        fetchStaff();
      } else {
        const e = await r.json();
        toast.error(e.error || 'Failed to delete staff');
      }
    } catch {
      toast.error('Failed to delete staff');
    } finally {
      setDeleting(false);
    }
  };
```

**d) Add Edit and Delete buttons** to each staff card (after the Activate/Deactivate button in the card footer `<div className="mt-3 flex justify-end">`):
```typescript
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={e => { e.stopPropagation(); openEdit(member); }}
                        className="text-xs px-3 py-1 rounded-full border border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setDeletingMember(member); setShowDeleteConfirm(true); }}
                        className="text-xs px-3 py-1 rounded-full border border-red-300 text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); toggleStatus(member.id, !member.isActive); }}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${member.isActive ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}`}
                      >
                        {member.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
```

**e) Add Edit modal and Delete ConfirmationDialog** before the closing `</AdminLayout>` tag. First add import for ConfirmationDialog at the top of the file:
```typescript
import ConfirmationDialog from '@/components/ui/ConfirmationDialog';
```

Then add before `</AdminLayout>`:
```typescript
        {/* Edit Staff Drawer */}
        {showEditForm && editingMember && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black bg-opacity-40" onClick={() => { setShowEditForm(false); setEditingMember(null); }} />
            <div className="w-full max-w-md bg-white flex flex-col shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Edit Staff Member</h3>
                <button onClick={() => { setShowEditForm(false); setEditingMember(null); }} className="text-gray-400 hover:text-gray-600">
                  <Icon name="close" className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone <span className="text-red-500">*</span></label>
                  <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="+923001234567" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span></label>
                  <input type="password" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="Min. 6 characters" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                <button onClick={() => { setShowEditForm(false); setEditingMember(null); }}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleEditStaff} disabled={saving}
                  className="px-5 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-green-500 rounded-lg hover:opacity-90 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        <ConfirmationDialog
          isOpen={showDeleteConfirm}
          onClose={() => { setShowDeleteConfirm(false); setDeletingMember(null); }}
          onConfirm={confirmDelete}
          title="Delete Staff Member"
          message={`Are you sure you want to permanently delete "${deletingMember?.name}"? This cannot be undone.`}
          confirmText={deleting ? 'Deleting...' : 'Delete'}
          cancelText="Cancel"
          type="danger"
        />
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/staff/staff.controller.ts \
        apps/web/src/app/api/v1/admin/staff/[id]/route.ts \
        apps/web/src/app/admin/staff/page.tsx
git commit -m "feat: add staff edit and delete; fix toggleStatus error handling"
```

---

## Task 6: Fix Contacts Respond — Auto-Set Status to 'replied'

When admin submits a response, the PATCH body only sends `adminResponse` but not `status: 'replied'`. After responding, the contact stays in `read` status.

**Files:**
- Modify: `apps/web/src/app/admin/contacts/page.tsx`

- [ ] **Step 1: Fix handleSubmitResponse to include status: 'replied'**

In `apps/web/src/app/admin/contacts/page.tsx`, in the `handleSubmitResponse` function, replace:
```typescript
        body: JSON.stringify({ adminResponse: responseText.trim() }),
```
with:
```typescript
        body: JSON.stringify({ adminResponse: responseText.trim(), status: 'replied' }),
```

Also update the local state after success so the selected contact reflects the new status. Replace the success block:
```typescript
      if (response.ok) {
        toast.success('Response saved successfully');
        setShowResponseModal(false);
        setResponseText('');
        await fetchContacts();
        await fetchStats();
      }
```
with:
```typescript
      if (response.ok) {
        toast.success('Response saved successfully');
        setShowResponseModal(false);
        setResponseText('');
        if (selectedContact) {
          setSelectedContact({ ...selectedContact, adminResponse: responseText.trim(), status: 'replied' });
        }
        await fetchContacts();
        await fetchStats();
      }
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/admin/contacts/page.tsx
git commit -m "fix: set status to replied when admin submits contact response"
```

---

## Task 7: Fix Orders Pagination Sliding Window

The orders table pagination uses `Math.min(5, totalPages)` which hardcodes only pages 1–5, breaking for orders lists with more than 5 pages.

**Files:**
- Modify: `apps/web/src/components/super-admin/OrdersManagement.tsx`

- [ ] **Step 1: Replace hardcoded pagination with sliding window**

In `apps/web/src/components/super-admin/OrdersManagement.tsx`, locate the pagination rendering (around line 594):

Replace:
```typescript
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        currentPage === page
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
```

with:
```typescript
                {(() => {
                  const delta = 2;
                  const start = Math.max(1, currentPage - delta);
                  const end = Math.min(totalPages, currentPage + delta);
                  return Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium ${
                        currentPage === page
                          ? 'bg-orange-500 text-white border-orange-500'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ));
                })()}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/super-admin/OrdersManagement.tsx
git commit -m "fix: orders pagination sliding window — show current ± 2 pages instead of hardcoded 1-5"
```

---

## Task 8: Add Error Toast to DashboardOverview API Failure

Dashboard shows zeros silently on API failure. Import toast and show an error.

**Files:**
- Modify: `apps/web/src/components/admin/DashboardOverview.tsx`

- [ ] **Step 1: Add toast import and error handling**

In `apps/web/src/components/admin/DashboardOverview.tsx`, add import:
```typescript
import toast from 'react-hot-toast';
```

Replace the error handling in `fetchDashboardData`:
```typescript
      } else {
        console.error('Failed to fetch dashboard data:', response.status);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
```
with:
```typescript
      } else {
        toast.error('Failed to load dashboard data');
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    }
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/admin/DashboardOverview.tsx
git commit -m "fix: show error toast on dashboard stats fetch failure"
```

---

## Task 9: Fix Customer Role Filter Dropdown

The role filter dropdown in the customers page sends a `role` param, but the backend `findCustomersWithPagination` ignores it (always queries `role = 'customer'`). The dropdown shows `super_admin` and `staff` options which make no sense for the customers endpoint. Remove the broken filter rather than partially fixing it.

**Files:**
- Modify: `apps/web/src/app/admin/customers/page.tsx`

- [ ] **Step 1: Remove the non-functional role filter from customers page**

In `apps/web/src/app/admin/customers/page.tsx`, find the `filterRole` state and all references. Remove:
1. The `filterRole` state declaration
2. The `filterRole` inclusion in the fetch params
3. The Role Filter dropdown JSX in the filter section

Concretely, if there's a state `const [filterRole, setFilterRole] = useState('');`, remove it.

Find the params construction (look for `filterRole` being added to URLSearchParams) and remove that line.

Find the role filter `<Dropdown>` or `<select>` element in the filter UI and remove it.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/app/admin/customers/page.tsx
git commit -m "fix: remove non-functional role filter from customers page (backend ignores the param)"
```

---

## Task 10: Payment Status Confirmation Dialog

Clicking a payment status option applies it immediately without confirmation, even for irreversible changes like `refunded`.

**Files:**
- Modify: `apps/web/src/components/super-admin/OrdersManagement.tsx`

- [ ] **Step 1: Add pendingPaymentStatus state and confirmation dialog**

In `apps/web/src/components/super-admin/OrdersManagement.tsx`:

**a) Add state** (near the other state declarations):
```typescript
  const [pendingPaymentStatus, setPendingPaymentStatus] = useState<{ orderId: string; status: string } | null>(null);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
```

**b) Replace direct `updatePaymentStatus` call with a confirmation step**:

Find where `updatePaymentStatus` is called from the UI (it will be inside the payment status dropdown `onChange` handler). Change the inline call so it sets pending state instead:
```typescript
onChange={(value) => {
  const newStatus = Array.isArray(value) ? value[0] : value;
  if (newStatus && newStatus !== order.paymentStatus) {
    setPendingPaymentStatus({ orderId: order.id, status: newStatus });
    setShowPaymentConfirm(true);
  }
}}
```

**c) Add ConfirmationDialog** before the final closing tag of the component's JSX return:
```typescript
      <ConfirmationDialog
        isOpen={showPaymentConfirm}
        onClose={() => { setShowPaymentConfirm(false); setPendingPaymentStatus(null); }}
        onConfirm={() => {
          if (pendingPaymentStatus) {
            updatePaymentStatus(pendingPaymentStatus.orderId, pendingPaymentStatus.status);
          }
          setShowPaymentConfirm(false);
          setPendingPaymentStatus(null);
        }}
        title="Update Payment Status"
        message={`Change payment status to "${pendingPaymentStatus?.status}"? This action may be irreversible.`}
        confirmText="Yes, Update"
        cancelText="Cancel"
        type="warning"
      />
```

Note: Check what `type` values `ConfirmationDialog` supports. If `warning` is not a valid type, use `danger`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/super-admin/OrdersManagement.tsx
git commit -m "fix: add confirmation dialog before payment status change"
```

---

## Task 11: Remove Orphaned SuppliersManagement Dead Code

`SuppliersManagement.tsx` has a full UI component that calls `/api/v1/suppliers` (no backend, no BFF route, no sidebar link). It is dead code. Deleting it is cleaner than letting it silently fail.

**Files:**
- Delete: `apps/web/src/components/super-admin/SuppliersManagement.tsx`

- [ ] **Step 1: Verify no imports before deleting**

Run: `grep -r "SuppliersManagement" apps/web/src --include="*.tsx" --include="*.ts"`

Expected: No results (or only the component file itself). If something imports it, remove that import first.

- [ ] **Step 2: Delete the file**

```bash
rm apps/web/src/components/super-admin/SuppliersManagement.tsx
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove orphaned SuppliersManagement dead code (no backend, no BFF, no nav link)"
```

---

## Self-Review Checklist

- [x] Task 1 covers all 4 contacts BFF routes needed by `contacts/page.tsx` (list, stats, [id], [id]/read)
- [x] Task 2 adds inventory JOIN and fixes the array shape mismatch (`inventory[0]` vs `inventory`)
- [x] Task 3 creates the full NestJS module stack (entity, DTO, service, controller, module) + registers it + fixes silent catch blocks
- [x] Task 4 replaces N+1 with a single query + one bulk recentOrders query = 2 total queries per page
- [x] Task 5 covers all three layers: backend endpoints, BFF routes, and frontend UI (edit modal + delete confirm + error handling)
- [x] Task 6 is a one-line fix but also fixes the local state update
- [x] Task 7 sliding window: shows `currentPage - 2` to `currentPage + 2`, clamped to valid range
- [x] Task 8 adds toast import and replaces two silent catch paths
- [x] Task 9 removes the filter rather than partially fixing it (backend ignoring the param is the root cause)
- [x] Task 10 adds confirmation before payment status change with proper state cleanup
- [x] Task 11 verifies no lingering imports before delete
