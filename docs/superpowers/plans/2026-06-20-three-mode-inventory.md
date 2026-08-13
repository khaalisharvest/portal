# Three-Mode Inventory System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the single boolean `isAvailable` flag with a three-mode inventory system — `none` (toggle only), `count` (integer pieces), `weight` (decimal kg/g/liter) — so admins can precisely control stock, users see live availability, and orders are automatically blocked when stock is exhausted.

**Architecture:** Add `inventoryMode` enum to the `Product` entity (default `'none'`, fully backwards-compatible — existing products continue working unchanged). Upgrade the `Inventory` entity's five quantity columns from `INT` to `DECIMAL(10,3)` to support fractional weights. Fix `createOrder()` to use the same pessimistic-lock stock check already present in `createUnifiedOrder()`. The product API already returns full inventory data on every response — the frontend computes `availableStock` from that without any new endpoints. Add a `validate-cart` endpoint for pre-checkout stock checks. Extend the admin inventory page and dashboard with mode-aware UI and analytics.

**Key insight on data flow:** `products.service.ts` `findOne()` already loads `relations: ['category', 'productType', 'inventory']` and `findAll()` already does `leftJoinAndSelect('product.inventory', ...)`. After adding `inventoryMode` to the entity, it auto-appears in every response. No service rewrites needed.

**Tech Stack:** NestJS (TypeORM, PostgreSQL, `synchronize:true` in dev), Next.js 14 App Router, Tailwind CSS, existing Dropdown/Toggle components, `sonner` toasts.

---

## File Map

### Backend — Modified
| File | Changes |
|------|---------|
| `apps/backend/src/modules/products/entities/product.entity.ts` | Add `inventoryMode` column |
| `apps/backend/src/modules/products/entities/inventory.entity.ts` | Change 5 qty columns INT → DECIMAL(10,3) + decimal transformer |
| `apps/backend/src/modules/products/dto/create-product.dto.ts` | Add `inventoryMode` optional field |
| `apps/backend/src/modules/products/dto/update-product.dto.ts` | Add `inventoryMode` if not already extended from Create |
| `apps/backend/src/modules/orders/orders.service.ts` | Add `validateAndReserveStock()` private helper; fix `createOrder()` to use it; fix `Math.floor()` → `Number()` in cancel/deliver |

### Backend — Created
| File | Purpose |
|------|---------|
| `apps/backend/src/migrations/1750400000000-InventoryMode.ts` | Production migration: add `inventory_mode` column + ALTER INT→DECIMAL |

### Frontend Admin — Modified
| File | Changes |
|------|---------|
| `apps/web/src/components/super-admin/ProductsManagement.tsx` | Add inventory mode selector in the form |
| `apps/web/src/app/admin/products/inventory/page.tsx` | Mode badges, decimal inputs for weight, hide stock editor for none-mode products |
| `apps/web/src/components/admin/DashboardOverview.tsx` | Add most-selling panel + precise low-stock list |

### Frontend User — Modified
| File | Changes |
|------|---------|
| `apps/web/src/app/products/[id]/page.tsx` | Compute `availableStock` from existing `product.inventory[0]`, show stock label, cap quantity stepper |
| `apps/web/src/app/cart/page.tsx` | Async `goToCheckout` that calls validate-cart before routing |

### Frontend API Routes — Created
| File | Purpose |
|------|---------|
| `apps/web/src/app/api/v1/products/validate-cart/route.ts` | Proxy POST to backend validate-cart |

### Backend — New endpoint
| Controller | Route | Purpose |
|------------|-------|---------|
| `ProductsController` | `POST /products/validate-cart` (no guard = public) | Batch stock check for cart |

---

## Task 1 — Add `inventoryMode` to Product entity

**Files:**
- Modify: `apps/backend/src/modules/products/entities/product.entity.ts`

`inventoryMode` defaults to `'none'` so every existing product continues to behave exactly as before. No data needs to be back-filled.

- [ ] **Step 1: Add the column and index**

Open `apps/backend/src/modules/products/entities/product.entity.ts`.

After line 13 (the existing `@Index` decorators), add:

```typescript
@Index(['inventoryMode', 'isAvailable'])
```

After the `inventoryType` column block (around line 99), add:

```typescript
  @ApiProperty({ enum: ['none', 'count', 'weight'] })
  @Column({
    type: 'enum',
    enum: ['none', 'count', 'weight'],
    default: 'none',
    name: 'inventory_mode',
  })
  inventoryMode: 'none' | 'count' | 'weight';
```

- [ ] **Step 2: Verify dev auto-sync applied (development only)**

With `synchronize: true` in dev, the column appears automatically on next restart. Check backend logs for any TypeORM error. If you see `column "inventory_mode" already exists`, it is already applied — safe to ignore.

```bash
cd /Users/ram/Desktop/applications/khaalis-harvest
make logs-backend 2>/dev/null | grep -i "inventory_mode\|error" | tail -10
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/products/entities/product.entity.ts
git commit -m "feat(inventory): add inventoryMode column to Product entity (none/count/weight, default none)"
```

---

## Task 2 — Upgrade Inventory entity quantities to DECIMAL

**Files:**
- Modify: `apps/backend/src/modules/products/entities/inventory.entity.ts`
- Create: `apps/backend/src/migrations/1750400000000-InventoryMode.ts`

Changing INT → DECIMAL(10,3) lets weight products store fractional quantities (e.g., 12.500 kg). PostgreSQL performs this column type change safely — existing integer values are preserved as-is (50 → 50.000).

- [ ] **Step 1: Rewrite inventory.entity.ts**

Replace the entire file content:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index, AfterLoad, AfterInsert, AfterUpdate } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';

const decimalTransformer = {
  to: (v: any) => v,
  from: (v: any) => (v != null ? parseFloat(v) : 0),
};

@Entity('inventory')
@Index(['productId', 'isActive'])
export class Inventory {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0, transformer: decimalTransformer })
  quantity: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0, transformer: decimalTransformer })
  reservedQuantity: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0, transformer: decimalTransformer })
  availableQuantity: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0, transformer: decimalTransformer })
  minimumStock: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0, transformer: decimalTransformer })
  maximumStock: number;

  @ApiProperty()
  @Column({ nullable: true })
  location: string;

  @ApiProperty()
  @Column({ nullable: true })
  batchNumber: string;

  @ApiProperty()
  @Column({ nullable: true })
  expiryDate: Date;

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @AfterLoad()
  @AfterInsert()
  @AfterUpdate()
  computeAvailable() {
    this.availableQuantity = Math.max(0, Number(this.quantity) - Number(this.reservedQuantity));
  }
}
```

- [ ] **Step 2: Create production migration**

Create `apps/backend/src/migrations/1750400000000-InventoryMode.ts`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InventoryMode1750400000000 implements MigrationInterface {
  name = 'InventoryMode1750400000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Add inventoryMode enum + column to products
    await queryRunner.query(
      `DO $$ BEGIN
         CREATE TYPE "public"."products_inventory_mode_enum" AS ENUM('none', 'count', 'weight');
       EXCEPTION WHEN duplicate_object THEN NULL; END $$`
    );
    await queryRunner.query(
      `ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "inventory_mode" "public"."products_inventory_mode_enum" NOT NULL DEFAULT 'none'`
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_products_inventoryMode_isAvailable" ON "products" ("inventory_mode", "isAvailable")`
    );

    // 2. Alter inventory quantity columns from INT to DECIMAL(10,3)
    for (const col of ['quantity', 'reservedQuantity', 'availableQuantity', 'minimumStock', 'maximumStock']) {
      await queryRunner.query(
        `ALTER TABLE "inventory" ALTER COLUMN "${col}" TYPE decimal(10,3) USING "${col}"::decimal(10,3)`
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const col of ['quantity', 'reservedQuantity', 'availableQuantity', 'minimumStock', 'maximumStock']) {
      await queryRunner.query(
        `ALTER TABLE "inventory" ALTER COLUMN "${col}" TYPE int USING ROUND("${col}")::int`
      );
    }
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_products_inventoryMode_isAvailable"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "inventory_mode"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."products_inventory_mode_enum"`);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/products/entities/inventory.entity.ts \
        apps/backend/src/migrations/1750400000000-InventoryMode.ts
git commit -m "feat(inventory): decimal(10,3) quantities in Inventory entity + production migration"
```

---

## Task 3 — Add `inventoryMode` to Product DTOs

**Files:**
- Modify: `apps/backend/src/modules/products/dto/create-product.dto.ts`
- Modify: `apps/backend/src/modules/products/dto/update-product.dto.ts` (only if it is NOT `PartialType(CreateProductDto)`)

The `inventoryMode` column is automatically returned in all product API responses (since it is a plain entity column). This task only adds it to the DTOs so the admin can set it on create/update.

- [ ] **Step 1: Add to CreateProductDto**

In `apps/backend/src/modules/products/dto/create-product.dto.ts`, add `IsIn` to the `class-validator` import line, then add after the `inventoryType` field:

```typescript
  @ApiProperty({ required: false, enum: ['none', 'count', 'weight'] })
  @IsOptional()
  @IsIn(['none', 'count', 'weight'])
  inventoryMode?: 'none' | 'count' | 'weight';
```

- [ ] **Step 2: Check UpdateProductDto**

Open `apps/backend/src/modules/products/dto/update-product.dto.ts`. If it starts with `export class UpdateProductDto extends PartialType(CreateProductDto)`, `inventoryMode` is already included — nothing to do. If it is a separate class with explicit fields, add the same field as in Step 1.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/products/dto/create-product.dto.ts \
        apps/backend/src/modules/products/dto/update-product.dto.ts
git commit -m "feat(inventory): add inventoryMode to product create/update DTOs"
```

---

## Task 4 — Fix order stock validation across all three order paths

**Files:**
- Modify: `apps/backend/src/modules/orders/orders.service.ts`

Three order creation methods exist (`createOrder`, `createGuestOrder`, `createUnifiedOrder`). Only `createGuestOrder` and `createUnifiedOrder` validate stock. `createOrder` only checks `isAvailable`. Also, `Math.floor()` used in cancel/delivery stock release breaks decimal weights (it truncates 2.5 to 2, only releasing 2 units when 2.5 were reserved).

- [ ] **Step 1: Add the shared stock validation helper**

Add this private method to the `OrdersService` class, just before `createOrder()`:

```typescript
private async validateAndReserveStock(
  queryRunner: import('typeorm').QueryRunner,
  product: import('../products/entities/product.entity').Product,
  quantity: number,
): Promise<void> {
  if ((product as any).inventoryMode === 'none' || !(product as any).inventoryMode) {
    // Toggle-only mode: just check the isAvailable flag
    if (!product.isAvailable) {
      throw new BadRequestException(`"${product.name}" is not available`);
    }
    return;
  }

  // count or weight mode: pessimistic write-lock on inventory row
  const inventory = await queryRunner.manager
    .createQueryBuilder(Inventory, 'inv')
    .setLock('pessimistic_write')
    .where('inv.productId = :productId AND inv.isActive = true', { productId: product.id })
    .getOne();

  if (!inventory) {
    throw new BadRequestException(
      `No inventory record found for "${product.name}". Please contact support.`,
    );
  }

  const available = Number(inventory.quantity) - Number(inventory.reservedQuantity);
  const requested = Number(quantity);

  if (available < requested) {
    const unit = (product as any).inventoryMode === 'weight' ? product.unit : 'units';
    throw new BadRequestException(
      `Insufficient stock for "${product.name}". ` +
      `Available: ${available.toFixed(3)} ${unit}, Requested: ${requested} ${unit}.`,
    );
  }

  // Reserve stock (supports decimal)
  await queryRunner.manager.query(
    `UPDATE inventory SET "reservedQuantity" = "reservedQuantity" + $1 WHERE id = $2`,
    [requested, inventory.id],
  );
}
```

- [ ] **Step 2: Fix `createOrder()` — replace `!isAvailable` loop**

In `createOrder()`, find this block (around line 102):

```typescript
      // Check product availability
      for (const product of products) {
        if (!product.isAvailable) {
          throw new BadRequestException(`Product ${product.name} is not available`);
        }
      }
```

Replace it with (keep the `products` variable — it is still used for price resolution below):

```typescript
      // Validate and reserve stock — sort by productId to prevent deadlocks
      const sortedOrderItems = [...createOrderDto.items].sort((a, b) => a.productId.localeCompare(b.productId));
      for (const item of sortedOrderItems) {
        const product = products.find(p => p.id === item.productId)!;
        await this.validateAndReserveStock(queryRunner, product, Number(item.quantity));
      }
```

- [ ] **Step 3: Fix `createGuestOrder()` — replace its stock check with the helper**

In `createGuestOrder()`, find the block that starts (around line 675):

```typescript
      // Check inventory for each item (same as createUnifiedOrder)
      // Sort items by productId to prevent deadlocks on concurrent orders
      const sortedItems = [...createGuestOrderDto.items].sort((a, b) => a.productId.localeCompare(b.productId));
      for (const item of sortedItems) {
        const inventory = await queryRunner.manager
          .createQueryBuilder(Inventory, 'inv')
          .setLock('pessimistic_write')
          .where('inv.productId = :productId', { productId: item.productId })
          .getOne();
        // ... error handling and reserve SQL ...
      }
```

Replace the entire sorted items loop (everything from the `const sortedItems` line through the closing `}` of the for-loop) with:

```typescript
      const sortedGuestItems = [...createGuestOrderDto.items].sort((a, b) => a.productId.localeCompare(b.productId));
      for (const item of sortedGuestItems) {
        const product = products.find(p => p.id === item.productId)!;
        await this.validateAndReserveStock(queryRunner, product, Number(item.quantity));
      }
```

Also remove the old `!product.isAvailable` check loop that precedes it in `createGuestOrder()`.

- [ ] **Step 4: Fix `createUnifiedOrder()` — replace its stock check with the helper**

In `createUnifiedOrder()`, replace the stock check section (around lines 898–931) using the same pattern:

```typescript
      // Validate and reserve stock — sort by productId to prevent deadlocks
      const sortedUnifiedItems = [...orderData.items].sort((a, b) => a.productId.localeCompare(b.productId));
      for (const item of sortedUnifiedItems) {
        const product = products.find(p => p.id === item.productId);
        if (!product) continue;
        await this.validateAndReserveStock(queryRunner, product, Number(item.quantity));
      }
```

Also remove the old `!product.isAvailable` check loop in `createUnifiedOrder()`.

- [ ] **Step 5: Fix decimal truncation bug in `cancelOrder()` and `updateOrderStatus()`**

Find every occurrence of:

```typescript
const qty = Math.floor(Number(item.quantity));
```

There are three: one in `cancelOrder()` and two in `updateOrderStatus()`. Replace ALL three with:

```typescript
const qty = Number(item.quantity);
```

The raw SQL (`GREATEST("reservedQuantity" - $1, 0)`) already handles decimals correctly; only the `Math.floor()` was lossy.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/orders/orders.service.ts
git commit -m "fix(orders): unified stock validation for all order paths; fix decimal truncation in cancel/deliver"
```

---

## Task 5 — Validate-cart endpoint

**Files:**
- Modify: `apps/backend/src/modules/products/products.controller.ts`
- Modify: `apps/backend/src/modules/products/products.service.ts`
- Create: `apps/web/src/app/api/v1/products/validate-cart/route.ts`

The cart page needs to know whether its items are in stock BEFORE routing to checkout. This requires a batch endpoint. **No auth guard needed** — this app exposes public routes by simply omitting `@UseGuards()`, which is what all the existing public GET routes do.

- [ ] **Step 1: Add `findByIds()` to ProductsService**

In `apps/backend/src/modules/products/products.service.ts`, add after the `findOne()` method:

```typescript
async findByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  return this.productRepository.find({
    where: { id: In(ids) },
    relations: ['inventory'],
  });
}
```

Add `In` to the `typeorm` import at the top of the file if not already present.

- [ ] **Step 2: Add validate-cart endpoint to ProductsController**

In `apps/backend/src/modules/products/products.controller.ts`, add this route **before** the `@Get(':id')` route (to avoid NestJS accidentally treating `validate-cart` as an id parameter — though POST vs GET already prevents conflict, placement makes intent clear):

```typescript
  @Post('validate-cart')
  @ApiOperation({ summary: 'Batch stock check for cart items (public)' })
  async validateCart(
    @Body() body: { items: Array<{ productId: string; quantity: number }> },
  ) {
    const ids = body.items.map(i => i.productId);
    const products = await this.productsService.findByIds(ids);

    const issues: Array<{
      productId: string;
      name: string;
      availableStock: number | null;
      requestedQuantity: number;
      inventoryMode: string;
    }> = [];

    for (const item of body.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        issues.push({ productId: item.productId, name: 'Unknown product', availableStock: 0, requestedQuantity: item.quantity, inventoryMode: 'none' });
        continue;
      }

      const mode = (product as any).inventoryMode ?? 'none';

      if (mode === 'none') {
        if (!product.isAvailable) {
          issues.push({ productId: item.productId, name: product.name, availableStock: 0, requestedQuantity: item.quantity, inventoryMode: mode });
        }
        continue;
      }

      const inv = (product as any).inventory?.find((i: any) => i.isActive) ?? null;
      const availableStock = inv ? Math.max(0, Number(inv.quantity) - Number(inv.reservedQuantity)) : 0;
      if (availableStock < Number(item.quantity)) {
        issues.push({ productId: item.productId, name: product.name, availableStock, requestedQuantity: item.quantity, inventoryMode: mode });
      }
    }

    return { valid: issues.length === 0, issues };
  }
```

Add `Post, Body` to the imports from `@nestjs/common` at the top of the controller if not already there.

- [ ] **Step 3: Create Next.js BFF route**

Create `apps/web/src/app/api/v1/products/validate-cart/route.ts`. First read `apps/web/src/lib/proxy.ts` to confirm the `createProxy` function signature — it should accept a `NextRequest` and a backend path string. Then:

```typescript
import { NextRequest } from 'next/server';
import { createProxy } from '@/lib/proxy';

export async function POST(req: NextRequest) {
  return createProxy(req, '/products/validate-cart');
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/products/products.controller.ts \
        apps/backend/src/modules/products/products.service.ts \
        apps/web/src/app/api/v1/products/validate-cart/route.ts
git commit -m "feat(inventory): add validate-cart batch stock check endpoint"
```

---

## Task 6 — Admin: Product form inventory mode selector

**Files:**
- Modify: `apps/web/src/components/super-admin/ProductsManagement.tsx`

- [ ] **Step 1: Add `inventoryMode` to formData state**

Find the `useState` initializer for `formData` (around line 120). Add:

```typescript
inventoryMode: 'none' as 'none' | 'count' | 'weight',
```

- [ ] **Step 2: Populate inventoryMode on edit**

In `handleEdit()`, inside `setFormData({...})`, add:

```typescript
inventoryMode: (product.inventoryMode as 'none' | 'count' | 'weight') || 'none',
```

- [ ] **Step 3: Reset inventoryMode on resetForm**

In `resetForm()`, inside the `setFormData({...})` call, add:

```typescript
inventoryMode: 'none',
```

- [ ] **Step 4: Include inventoryMode in API payload**

In `handleSubmit()`, inside the `productData` object, add:

```typescript
inventoryMode: formData.inventoryMode,
```

- [ ] **Step 5: Add the inventory mode selector to the form JSX**

Inside the `<form>` element, add a new section after the closing `</div>` of the "Basic Information" section and before the "Variant Settings" section:

```tsx
                {/* Inventory Tracking Mode */}
                <div>
                  <h4 className="text-sm font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                    Inventory Tracking
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      {
                        value: 'none' as const,
                        label: 'Toggle Only',
                        desc: 'Just Available / Unavailable. No stock counting.',
                      },
                      {
                        value: 'count' as const,
                        label: 'Count',
                        desc: 'Track stock by piece, pack, box, dozen, etc.',
                      },
                      {
                        value: 'weight' as const,
                        label: 'Weight',
                        desc: 'Track stock by kg, g, liter, ml, etc.',
                      },
                    ]).map(mode => (
                      <button
                        key={mode.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, inventoryMode: mode.value }))}
                        className={`p-3 rounded-xl border-2 text-left transition-colors cursor-pointer ${
                          formData.inventoryMode === mode.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-neutral-200 hover:border-primary-300 bg-white'
                        }`}
                      >
                        <div className={`text-sm font-semibold mb-0.5 ${
                          formData.inventoryMode === mode.value ? 'text-primary-700' : 'text-neutral-800'
                        }`}>
                          {mode.label}
                        </div>
                        <div className="text-xs text-neutral-500 leading-tight">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                  {formData.inventoryMode !== 'none' && (
                    <p className="text-xs text-neutral-500 mt-2">
                      After saving, go to the <strong>Inventory</strong> page to set the initial stock quantity for this product.
                    </p>
                  )}
                </div>
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/super-admin/ProductsManagement.tsx
git commit -m "feat(admin): inventory mode selector (none/count/weight) in product create/edit drawer"
```

---

## Task 7 — Admin: Inventory page — mode-aware UI and decimal support

**Files:**
- Modify: `apps/web/src/app/admin/products/inventory/page.tsx`

- [ ] **Step 1: Update the Product interface**

Find `interface Product` near the top. Add:

```typescript
  inventoryMode: 'none' | 'count' | 'weight';
  isAvailable: boolean;
```

- [ ] **Step 2: Fix parseInt → parseFloat in edit handlers**

Find all uses of `parseInt(e.target.value)` in the edit form handlers and replace each with `parseFloat(e.target.value)`. There should be two: one for `quantity` and one for `minimumStock`.

- [ ] **Step 3: Add inventory mode badge next to each product name**

In the product row rendering (the cell that shows the product name and image), add after the product name `<div>`:

```tsx
<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ml-2 ${
  product.inventoryMode === 'weight'
    ? 'bg-blue-100 text-blue-700'
    : product.inventoryMode === 'count'
    ? 'bg-primary-100 text-primary-700'
    : 'bg-neutral-100 text-neutral-500'
}`}>
  {product.inventoryMode === 'weight'
    ? '⚖ Weight'
    : product.inventoryMode === 'count'
    ? '# Count'
    : '● Toggle'}
</span>
```

- [ ] **Step 4: For `none` mode rows, hide stock editor and show status text**

In the cell that shows "available quantity" and the "Edit Stock" button, wrap the existing content in a conditional:

```tsx
{product.inventoryMode === 'none' ? (
  <div className="text-xs text-neutral-400 italic">Toggle only — no stock tracking</div>
) : (
  /* existing available quantity cell content */
)}
```

For the "Edit Stock" button cell, similarly:

```tsx
{product.inventoryMode === 'none' ? (
  <span className="text-xs text-neutral-400">—</span>
) : (
  /* existing edit button */
)}
```

- [ ] **Step 5: Add step and unit label to the edit form quantity inputs**

In the inline edit form (or modal), the quantity input needs `step` and `min` based on the mode. Since the currently-editing product's mode needs to be known, store the editing product in state:

Add state:
```typescript
const [editingProduct, setEditingProduct] = useState<Product | null>(null);
```

When the edit button is clicked, set `editingProduct` to the product being edited.

Then in the quantity input:
```tsx
<input
  type="number"
  min="0"
  step={editingProduct?.inventoryMode === 'weight' ? '0.001' : '1'}
  value={editForm.quantity}
  onChange={e => setEditForm(f => ({ ...f, quantity: parseFloat(e.target.value) || 0 }))}
  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
/>
<span className="text-sm text-neutral-500 ml-1">{editingProduct?.unit ?? ''}</span>
```

- [ ] **Step 6: Display available quantity with correct decimal format**

Find where `available` is rendered as a number. Replace with:

```tsx
{editingProduct?.inventoryMode === 'weight' || product.inventoryMode === 'weight'
  ? `${Number(available).toFixed(2)} ${product.unit}`
  : Number(available).toLocaleString()}
```

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/admin/products/inventory/page.tsx
git commit -m "feat(admin): inventory page — mode badges, decimal weights, hide stock editor for toggle-only products"
```

---

## Task 8 — User: Product detail page — live stock display and quantity constraints

**Files:**
- Modify: `apps/web/src/app/products/[id]/page.tsx`

The product API already returns `inventory: Inventory[]` and `inventoryMode`. The frontend just needs to USE it.

- [ ] **Step 1: Add inventory types to the Product interface**

At the top of `page.tsx`, find the `Product` interface or type. Add:

```typescript
  inventoryMode?: 'none' | 'count' | 'weight';
  inventory?: Array<{
    isActive: boolean;
    quantity: number;
    reservedQuantity: number;
    minimumStock: number;
  }>;
```

- [ ] **Step 2: Compute effective availability constants**

After `product` is resolved (right after the loading check), add these computed values. Place them where `quantity` state and other derived values are calculated:

```typescript
// Compute available stock from inventory record (already in the API response)
const activeInv = product.inventory?.find(i => i.isActive) ?? null;
const availableStock: number | null = activeInv
  ? Math.max(0, Number(activeInv.quantity) - Number(activeInv.reservedQuantity))
  : null;

const effectiveIsAvailable =
  product.inventoryMode === 'count' || product.inventoryMode === 'weight'
    ? (availableStock ?? 0) > 0 && product.isAvailable
    : product.isAvailable;

const maxQuantity =
  product.inventoryMode === 'count' || product.inventoryMode === 'weight'
    ? availableStock ?? 500
    : 500;

const quantityStep = product.inventoryMode === 'weight' ? 0.5 : 1;
```

- [ ] **Step 3: Replace `!product.isAvailable` with `!effectiveIsAvailable` on buttons**

Find every instance of `!product.isAvailable` used in the `disabled` prop of "Add to Basket" and "Buy Now" buttons. Replace each with `!effectiveIsAvailable`. There are typically two buttons (around lines 690 and 718).

- [ ] **Step 4: Cap the quantity stepper**

Find the quantity increment `onClick` handler. Replace with:

```typescript
onClick={() => setQuantity(q => Math.min(Number((q + quantityStep).toFixed(3)), maxQuantity))}
```

Find the decrement handler. Replace with:

```typescript
onClick={() => setQuantity(q => Math.max(Number((q - quantityStep).toFixed(3)), quantityStep))}
```

Add `min`, `max`, `step` attributes to the quantity `<input>` if there is one:

```tsx
min={quantityStep}
max={maxQuantity || undefined}
step={quantityStep}
```

- [ ] **Step 5: Add live stock label near the product availability area**

Find the section around line 478 where `!product.isAvailable` shows an "Out of Stock" badge. Add a stock level indicator after it:

```tsx
{(product.inventoryMode === 'count' || product.inventoryMode === 'weight') && availableStock !== null && (
  <div className="mt-2">
    {availableStock === 0 ? (
      <span className="text-sm font-medium text-error-600">Out of stock</span>
    ) : availableStock <= (product.inventoryMode === 'weight' ? 5 : 10) ? (
      <span className="text-sm font-medium text-secondary-600">
        {product.inventoryMode === 'weight'
          ? `Only ${Number(availableStock).toFixed(2)} ${product.unit} left`
          : `Only ${availableStock} left in stock`}
      </span>
    ) : (
      <span className="text-sm text-primary-600">
        {product.inventoryMode === 'weight'
          ? `${Number(availableStock).toFixed(2)} ${product.unit} available`
          : `${availableStock} in stock`}
      </span>
    )}
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/products/\[id\]/page.tsx
git commit -m "feat(store): product detail shows live stock, quantity capped, auto-disables when OOS"
```

---

## Task 9 — User: Cart pre-checkout stock validation

**Files:**
- Modify: `apps/web/src/app/cart/page.tsx`

- [ ] **Step 1: Add stock validation state**

At the top of the cart component (or functional component body), add:

```typescript
const [stockIssues, setStockIssues] = useState<Array<{
  productId: string;
  name: string;
  availableStock: number | null;
  requestedQuantity: number;
  inventoryMode: string;
}>>([]);
const [validatingStock, setValidatingStock] = useState(false);
```

- [ ] **Step 2: Replace `goToCheckout` with async version**

Find the existing `goToCheckout` function. Replace it entirely:

```typescript
const goToCheckout = async () => {
  if (state.items.length === 0) {
    toast.error('Your basket is empty');
    return;
  }

  const hasUnavailable = state.items.some(i => !i.isAvailable);
  if (hasUnavailable) {
    toast.error('Some items are unavailable. Please remove them before checking out.');
    return;
  }

  setValidatingStock(true);
  try {
    const res = await fetch('/api/v1/products/validate-cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: state.items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      }),
    });
    const data = await res.json();

    if (!data.valid) {
      setStockIssues(data.issues);
      toast.error('Some items have stock issues — see below.');
      return;
    }

    setStockIssues([]);
    router.push('/checkout');
  } catch {
    // Network error — let backend catch it at checkout time
    router.push('/checkout');
  } finally {
    setValidatingStock(false);
  }
};
```

- [ ] **Step 3: Show stock issue warnings in the cart UI**

After the cart item list (find where cart items are rendered), add:

```tsx
{stockIssues.length > 0 && (
  <div className="mt-4 p-4 bg-error-50 border border-error-200 rounded-xl">
    <p className="text-sm font-semibold text-error-700 mb-2">
      Stock issues — please adjust quantities before continuing:
    </p>
    <ul className="space-y-1">
      {stockIssues.map(issue => (
        <li key={issue.productId} className="text-sm text-error-600">
          <strong>{issue.name}</strong>:{' '}
          {issue.availableStock === 0 || issue.availableStock === null
            ? 'Out of stock'
            : `Only ${
                issue.inventoryMode === 'weight'
                  ? `${Number(issue.availableStock).toFixed(2)}`
                  : issue.availableStock
              } available, you requested ${issue.requestedQuantity}`}
        </li>
      ))}
    </ul>
  </div>
)}
```

- [ ] **Step 4: Show loading state on the checkout button**

Find the "Proceed to Checkout" button. Update its `disabled` and label:

```tsx
<button
  onClick={goToCheckout}
  disabled={validatingStock || state.items.length === 0}
  className="btn-cta w-full disabled:opacity-50 disabled:cursor-not-allowed"
>
  {validatingStock ? 'Checking stock…' : 'Proceed to Checkout'}
</button>
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/cart/page.tsx
git commit -m "feat(store): cart validates live stock before checkout, shows specific issues per product"
```

---

## Task 10 — Dashboard: Most-selling products + precise low-stock list

**Files:**
- Modify: `apps/backend/src/modules/orders/orders.service.ts`
- Modify: `apps/web/src/components/admin/DashboardOverview.tsx`

- [ ] **Step 1: Add two new queries to `getDashboardStats()`**

In `orders.service.ts`, find the `getDashboardStats()` method. Add these two queries to the end of the existing `Promise.all([...])` array:

```typescript
    // Most-selling products last 30 days (use explicit join — avoids relying on OrderItem.order relation)
    this.orderItemRepository
      .createQueryBuilder('item')
      .select('item.productId', 'productId')
      .addSelect('item.itemName', 'name')
      .addSelect('item.itemImage', 'image')
      .addSelect('item.unit', 'unit')
      .addSelect('SUM(item.quantity)', 'totalSold')
      .leftJoin(Order, 'ord', 'ord.id = item.orderId')
      .where('ord.status NOT IN (:...excluded)', { excluded: ['cancelled', 'refunded'] })
      .andWhere("ord.createdAt > NOW() - INTERVAL '30 days'")
      .groupBy('item.productId')
      .addGroupBy('item.itemName')
      .addGroupBy('item.itemImage')
      .addGroupBy('item.unit')
      .orderBy('"totalSold"', 'DESC')
      .limit(5)
      .getRawMany(),

    // Low-stock products (count/weight mode only, where available <= minimumStock)
    this.productRepository
      .createQueryBuilder('p')
      .select(['p.id', 'p.name', 'p.unit', 'p.inventoryMode'])
      .addSelect(['inv.quantity', 'inv.reservedQuantity', 'inv.minimumStock'])
      .leftJoin('p.inventory', 'inv', 'inv."isActive" = true')
      .where('p.inventoryMode IN (:...modes)', { modes: ['count', 'weight'] })
      .andWhere('inv.id IS NOT NULL')
      .andWhere('inv."minimumStock" > 0')
      .andWhere('(inv.quantity - inv."reservedQuantity") <= inv."minimumStock"')
      .orderBy('(inv.quantity - inv."reservedQuantity")', 'ASC')
      .limit(8)
      .getMany(),
```

Add `Order` to the import at the top of the file if not already present (it should already be there).

- [ ] **Step 2: Destructure the two new results**

Add `mostSelling` and `lowStockProducts` to the destructuring of the `Promise.all` result, matching the order in which you added them to the array.

- [ ] **Step 3: Add them to the return object**

```typescript
    return {
      // ... all existing fields unchanged ...
      mostSelling: (mostSelling as any[]).map(r => ({
        productId: r.productId,
        name: r.name,
        image: r.image,
        unit: r.unit,
        totalSold: Number(r.totalSold),
      })),
      lowStockProducts: (lowStockProducts as any[]).map(p => {
        const inv = p.inventory?.[0] ?? null;
        const available = inv ? Math.max(0, Number(inv.quantity) - Number(inv.reservedQuantity)) : 0;
        return {
          id: p.id,
          name: p.name,
          unit: p.unit,
          inventoryMode: p.inventoryMode,
          available,
          minimumStock: inv ? Number(inv.minimumStock) : 0,
        };
      }),
    };
```

- [ ] **Step 4: Update DashboardOverview types and state**

In `apps/web/src/components/admin/DashboardOverview.tsx`, update `DashboardStats`:

```typescript
interface DashboardStats {
  // ... existing fields unchanged ...
  mostSelling: Array<{ productId: string; name: string; image: string; unit: string; totalSold: number }>;
  lowStockProducts: Array<{ id: string; name: string; unit: string; inventoryMode: string; available: number; minimumStock: number }>;
}
```

Update `EMPTY_STATS`:

```typescript
const EMPTY_STATS: DashboardStats = {
  // ... existing empty values unchanged ...
  mostSelling: [],
  lowStockProducts: [],
};
```

Update `setStats` in `fetchDashboardData`:

```typescript
mostSelling: data.mostSelling || [],
lowStockProducts: data.lowStockProducts || [],
```

- [ ] **Step 5: Add most-selling panel and low-stock list to dashboard JSX**

In the right column section (after the pending reviews panel), add:

```tsx
{/* Most Selling Products */}
<div className="bg-white rounded-xl border border-neutral-200">
  <div className="flex items-center justify-between px-5 py-3 border-b border-neutral-100">
    <h2 className="text-sm font-semibold text-neutral-800">Top Sellers — Last 30 Days</h2>
    <Link href="/admin/products" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
      View all →
    </Link>
  </div>
  <div className="divide-y divide-neutral-50">
    {loading ? (
      Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="px-5 py-3 animate-pulse flex gap-3">
          <div className="w-8 h-8 bg-neutral-200 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-neutral-200 rounded w-2/3" />
            <div className="h-2.5 bg-neutral-100 rounded w-1/3" />
          </div>
        </div>
      ))
    ) : stats.mostSelling.length === 0 ? (
      <p className="px-5 py-4 text-xs text-neutral-400">No sales data yet</p>
    ) : (
      stats.mostSelling.map((product, i) => (
        <div key={product.productId} className="flex items-center gap-3 px-5 py-3">
          <span className="text-xs font-bold text-neutral-400 w-4 flex-shrink-0">{i + 1}</span>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex-shrink-0" />
          )}
          <p className="text-xs font-medium text-neutral-800 truncate flex-1">{product.name}</p>
          <span className="text-xs font-semibold text-primary-700 flex-shrink-0">
            {product.totalSold % 1 === 0
              ? product.totalSold
              : Number(product.totalSold).toFixed(2)}{' '}
            {product.unit}
          </span>
        </div>
      ))
    )}
  </div>
</div>

{/* Low Stock Alert */}
{!loading && stats.lowStockProducts.length > 0 && (
  <div className="bg-white rounded-xl border border-error-200">
    <div className="flex items-center justify-between px-5 py-3 border-b border-error-100">
      <h2 className="text-sm font-semibold text-error-700">⚠ Low Stock</h2>
      <Link
        href="/admin/products/inventory"
        className="text-xs text-error-600 hover:text-error-700 font-medium"
      >
        Manage →
      </Link>
    </div>
    <div className="divide-y divide-neutral-50">
      {stats.lowStockProducts.map(product => (
        <div key={product.id} className="flex items-center justify-between px-5 py-3">
          <span className="text-xs font-medium text-neutral-800 truncate flex-1">{product.name}</span>
          <span className="text-xs text-error-600 font-semibold flex-shrink-0 ml-2">
            {product.inventoryMode === 'weight'
              ? `${Number(product.available).toFixed(2)} ${product.unit}`
              : `${product.available} left`}
          </span>
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/orders/orders.service.ts \
        apps/web/src/components/admin/DashboardOverview.tsx
git commit -m "feat(dashboard): most-selling products panel + precise low-stock list with inventory modes"
```

---

## Task 11 — End-to-end verification

- [ ] **Step 1: Smoke test toggle-only mode (inventoryMode = 'none')**

1. Confirm existing product with no `inventoryMode` set defaults to `none` in the API response.
2. Set `isAvailable = false` → product shows Out of Stock on product detail, "Add to Basket" is disabled.
3. Place an order for an available toggle-only product → succeeds, NO inventory record required.

- [ ] **Step 2: Smoke test count mode**

1. Create product with `inventoryMode = 'count'`.
2. Set inventory on Inventory page: `quantity = 5`.
3. Product detail shows "5 in stock". Quantity stepper max is 5.
4. Try to add 6 → stepper caps at 5.
5. Place order for 3 → inventory: `reservedQuantity = 3`, `availableQuantity = 2`.
6. Mark order delivered → `quantity = 2`, `reservedQuantity = 0`.
7. Set `quantity = 0` on Inventory page → product detail shows "Out of stock", button disabled.

- [ ] **Step 3: Smoke test weight mode**

1. Create product with `inventoryMode = 'weight'`, `unit = 'kg'`.
2. Set inventory: `quantity = 12.500`.
3. Product detail shows "12.50 kg available". Quantity stepper uses step = 0.5.
4. Add 10.5 kg to cart → cart shows the item.
5. Go to checkout → validate-cart passes.
6. Place order → `reservedQuantity = 10.5`, `availableQuantity = 2.0`.
7. Cancel order → `reservedQuantity = 0`, `availableQuantity = 12.5`. (Verify no truncation.)
8. Set `quantity = 0.2`, `minimumStock = 1` → Low Stock panel on dashboard shows this product.

- [ ] **Step 4: Verify cart validation**

1. Add a count-mode product to cart with quantity 5 (only 3 in stock).
2. Click "Proceed to Checkout".
3. Validate-cart returns `valid: false`, stock issues panel appears in cart.
4. Reduce quantity to 2 → click again → proceeds to checkout.

- [ ] **Step 5: Verify dashboard analytics**

1. Place 3 orders with product A and 1 order with product B.
2. Dashboard "Top Sellers" shows product A first with `totalSold = 3`.
3. Cancelled orders do not count.

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat(inventory): three-mode inventory system complete — none/count/weight, live stock, auto-gating, analytics"
```

---

## File Map — Final Summary

| File | Task | Status |
|------|------|--------|
| `product.entity.ts` | T1 | Add `inventoryMode` column |
| `inventory.entity.ts` | T2 | DECIMAL columns + transformer |
| `1750400000000-InventoryMode.ts` | T2 | Production migration |
| `create-product.dto.ts` | T3 | Add `inventoryMode` field |
| `update-product.dto.ts` | T3 | Add `inventoryMode` field (if not PartialType) |
| `orders.service.ts` | T4, T10 | Stock helper, fix 3 paths, fix Math.floor, most-selling + low-stock queries |
| `products.service.ts` | T5 | `findByIds()` method |
| `products.controller.ts` | T5 | `POST /products/validate-cart` |
| `validate-cart/route.ts` | T5 | Next.js BFF proxy |
| `ProductsManagement.tsx` | T6 | Inventory mode selector |
| `inventory/page.tsx` | T7 | Mode badges, decimal, hide none-mode |
| `products/[id]/page.tsx` | T8 | Live stock, stepper cap, OOS gate |
| `cart/page.tsx` | T9 | Async checkout, stock issues panel |
| `DashboardOverview.tsx` | T10 | Most-selling + low-stock panels |

## Self-Review

### Spec Coverage

| Requirement | Task(s) |
|-------------|---------|
| None mode — toggle only | T1, T4 (helper mode branch), T8 (`effectiveIsAvailable`) |
| Count mode — integer stock | T1, T2, T4, T7, T8 |
| Weight mode — decimal stock | T1, T2, T4, T7, T8 |
| Auto-block order when stock = 0 | T4 backend + T8 frontend |
| Admin sets inventory mode on product | T3 (DTO), T6 (form UI) |
| Admin manages stock quantities (decimal) | T7 (inventory page) |
| User sees live stock on product page | T8 |
| Cart validates stock before checkout | T9 |
| Order creates → reserves stock | T4 (all 3 paths) |
| Order delivered → decrements stock | T4 (Math.floor fix) |
| Order cancelled → releases reserved | T4 (Math.floor fix) |
| Dashboard — low stock alert | T10 |
| Dashboard — most-selling analytics | T10 |
| Production migration (safe, no data loss) | T2 |
| Backwards compatible (default = 'none') | T1 (column default), T4 (fallback in helper) |
| Variant availability still works | Unchanged — variants use existing isAvailable per-variant; stock tracks at product level |

### No Placeholders ✓
Every task has exact file paths, exact code, exact git commands.

### Type Consistency ✓
- `inventoryMode: 'none' | 'count' | 'weight'` consistent across entity, DTO, frontend interfaces
- `availableStock: number | null` — `null` means no inventory record (none mode or not yet set up)
- `validateAndReserveStock(queryRunner, product, quantity: number)` — same signature used in all three order paths
- `mostSelling[].totalSold` — always `Number(r.totalSold)` to convert from PostgreSQL string
- `lowStockProducts[].available` — always `Math.max(0, qty - reserved)` (decimal-safe)
- Frontend `decimalTransformer` in inventory entity ensures all quantity values are JS `number`, not strings
