# Product System Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all dead code, unused fields, and over-engineered structures from the product system (DB schema → NestJS backend → Next.js frontend) while keeping full ability to manage all organic product types.

**Architecture:** Update entities first (TypeORM synchronize:false means DB is untouched until migration), then DTOs/services/controllers, then run one migration to clean the DB, then update the frontend. Each phase leaves the app compilable. Never leave a broken import.

**Tech Stack:** NestJS + TypeORM 0.3 + PostgreSQL (backend), Next.js + React + TypeScript (frontend). Migration runner: `cd apps/backend && yarn migration:run`.

---

## Files Changed

### Backend
| Action | File |
|---|---|
| Modify | `apps/backend/src/modules/product-types/entities/product-type.entity.ts` |
| Modify | `apps/backend/src/modules/product-types/dto/create-product-type.dto.ts` |
| Modify | `apps/backend/src/modules/product-types/product-types.service.ts` |
| Modify | `apps/backend/src/modules/products/entities/product.entity.ts` |
| Modify | `apps/backend/src/modules/products/dto/create-product.dto.ts` |
| Modify | `apps/backend/src/modules/products/products.service.ts` |
| Modify | `apps/backend/src/modules/products/products.controller.ts` |
| Modify | `apps/backend/src/modules/products/products.module.ts` |
| Delete | `apps/backend/src/modules/products/entities/supplier.entity.ts` |
| Delete | `apps/backend/src/modules/products/entities/product-component.entity.ts` |
| Delete | `apps/backend/src/modules/products/controllers/suppliers.controller.ts` |
| Delete | `apps/backend/src/modules/products/services/suppliers.service.ts` |
| Create | `apps/backend/src/migrations/1749470000000-CleanProductSchema.ts` |

### Frontend
| Action | File |
|---|---|
| Modify | `apps/web/src/services/productTypes.ts` |
| Modify | `apps/web/src/components/ui/DynamicField.tsx` |
| Modify | `apps/web/src/components/ui/FieldEditor.tsx` |
| Modify | `apps/web/src/components/ui/FieldTemplates.tsx` |
| Modify | `apps/web/src/components/super-admin/ProductTypesManagement.tsx` |
| Modify | `apps/web/src/components/super-admin/ProductsManagement.tsx` |

---

## Task 1: Simplify ProductType Entity

**Remove:** `name` (slug field), `pricing` (5-field object), `requirements` (dead), `icon` (unused), `allowedUserTypes` (unused).  
**Add:** `units: string[]` (flat array, replaces pricing.units).  
**Change:** `displayName` gets `unique: true`.

**Files:**
- Modify: `apps/backend/src/modules/product-types/entities/product-type.entity.ts`

- [ ] **Step 1: Replace the entire entity file**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../products/entities/category.entity';

export type FieldType = 'text' | 'number' | 'select' | 'checkbox' | 'textarea';

export interface SpecField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: Array<{ label: string; value: string }>;
}

@Entity('product_types')
@Index(['isActive', 'sortOrder'])
export class ProductType {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  displayName: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  units?: string[];

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  specifications?: { fields: SpecField[] };

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ default: 0 })
  sortOrder: number;

  @ApiProperty()
  @Column({ nullable: true })
  color?: string;

  @ManyToOne(() => Category, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column({ name: 'categoryId' })
  categoryId: string;

  @OneToMany('Product', 'productType')
  products: any[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: zero errors from the product-types entity. Fix any import errors before continuing.

---

## Task 2: Simplify ProductType DTO and Service

**Files:**
- Modify: `apps/backend/src/modules/product-types/dto/create-product-type.dto.ts`
- Modify: `apps/backend/src/modules/product-types/product-types.service.ts`

- [ ] **Step 1: Replace create-product-type.dto.ts**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, IsObject, IsIn } from 'class-validator';
import { SpecField } from '../entities/product-type.entity';

export class CreateProductTypeDto {
  @ApiProperty()
  @IsString()
  displayName: string;

  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  units?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  specifications?: { fields: SpecField[] };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
```

- [ ] **Step 2: Update product-types.service.ts — three changes**

Change 1: uniqueness check uses `displayName` not `name`:
```typescript
// In create():
const existingProductType = await this.productTypeRepository.findOne({
  where: { displayName: createProductTypeDto.displayName }
});
if (existingProductType) {
  throw new BadRequestException('Product type with this display name already exists');
}

// In update():
if (updateProductTypeDto.displayName && updateProductTypeDto.displayName !== productType.displayName) {
  const existingProductType = await this.productTypeRepository.findOne({
    where: { displayName: updateProductTypeDto.displayName }
  });
  if (existingProductType) {
    throw new BadRequestException('Product type with this display name already exists');
  }
}
```

Change 2: `validateSpecificationFields` — reduce to 5 types:
```typescript
private validateSpecificationFields(fields: any[]): void {
  if (!Array.isArray(fields)) {
    throw new BadRequestException('Specifications fields must be an array');
  }
  const fieldNames = new Set<string>();
  const fieldIds = new Set<string>();
  const validTypes = ['text', 'number', 'select', 'checkbox', 'textarea'];

  for (const field of fields) {
    if (!field.id || !field.name || !field.label || !field.type) {
      throw new BadRequestException('Each field must have id, name, label, and type');
    }
    if (fieldNames.has(field.name)) {
      throw new BadRequestException(`Duplicate field name: ${field.name}`);
    }
    fieldNames.add(field.name);
    if (fieldIds.has(field.id)) {
      throw new BadRequestException(`Duplicate field ID: ${field.id}`);
    }
    fieldIds.add(field.id);
    if (!validTypes.includes(field.type)) {
      throw new BadRequestException(`Invalid field type: ${field.type}. Allowed: ${validTypes.join(', ')}`);
    }
    if (field.type === 'select' || field.type === 'checkbox') {
      if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
        throw new BadRequestException(`Field "${field.name}" of type ${field.type} must have options`);
      }
    }
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: zero errors.

---

## Task 3: Simplify Product Entity

**Remove from Product entity:** `slug`, `metaTitle`, `metaDescription`, `nutritionInfo`, `isFresh`, `isBundle`, `supplierId`, `marketplaceSupplier`, `weight`, `dimensions`, `viewCount`, `purchaseCount`, `rating`, `reviewCount`.  
**Simplify:** `marketplaceInfo` → `{ supplierName?: string; supplierContact?: string }`.  
**Remove:** `@Check` on rating, `@Index(['slug'])`, `@Index(['name'])`, Supplier + ProductComponent imports.

**Files:**
- Modify: `apps/backend/src/modules/products/entities/product.entity.ts`

- [ ] **Step 1: Replace the entire entity file**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index, Check } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from './category.entity';
import { ProductType } from '../../product-types/entities/product-type.entity';
import { Inventory } from './inventory.entity';
import { Review } from './review.entity';
import { Wishlist } from './wishlist.entity';

@Entity('products')
@Index(['categoryId', 'isAvailable'])
@Index(['inventoryType', 'isAvailable'])
@Index(['createdAt'])
@Check(`"price" >= 0`)
export class Product {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ type: 'text' })
  description: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice?: number;

  @ApiProperty()
  @Column()
  unit: string;

  @ApiProperty()
  @Column({ type: 'json' })
  images: string[];

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  specifications?: Record<string, any>;

  @ApiProperty({ enum: ['draft', 'active', 'archived'] })
  @Column({ type: 'enum', enum: ['draft', 'active', 'archived'], default: 'active' })
  status: 'draft' | 'active' | 'archived';

  @ApiProperty()
  @Column()
  adminId: string;

  @ApiProperty()
  @Column()
  categoryId: string;

  @ApiProperty()
  @Column({ nullable: true })
  productTypeId?: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => ProductType, productType => productType.products, { nullable: true })
  @JoinColumn({ name: 'productTypeId' })
  productType?: ProductType;

  @OneToMany(() => Inventory, inventory => inventory.product)
  inventory: Inventory[];

  @OneToMany(() => Review, review => review.product)
  reviews: Review[];

  @OneToMany(() => Wishlist, wishlist => wishlist.product)
  wishlists: Wishlist[];

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @ApiProperty()
  @Column({ default: false })
  featured: boolean;

  @ApiProperty()
  @Column({ default: false })
  isOrganic: boolean;

  @ApiProperty({ enum: ['marketplace', 'warehouse'] })
  @Column({ type: 'enum', enum: ['marketplace', 'warehouse'], default: 'warehouse' })
  inventoryType: 'marketplace' | 'warehouse';

  @ApiProperty()
  @Column({ default: true })
  isAvailable: boolean;

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  marketplaceInfo?: {
    supplierName?: string;
    supplierContact?: string;
  };

  @ApiProperty()
  @Column({ default: false })
  hasVariants: boolean;

  @ApiProperty()
  @Column({ nullable: true })
  variantName?: string;

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  variants?: Array<{
    name: string;
    price: number;
    originalPrice?: number;
    isAvailable?: boolean;
  }>;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: zero errors. The Supplier and ProductComponent imports are now gone — the module will fail to compile in the next task until we clean it.

---

## Task 4: Delete Supplier and ProductComponent — Update Module

**Delete 4 files. Update module to remove all references.**

**Files:**
- Delete: `apps/backend/src/modules/products/entities/supplier.entity.ts`
- Delete: `apps/backend/src/modules/products/entities/product-component.entity.ts`
- Delete: `apps/backend/src/modules/products/controllers/suppliers.controller.ts`
- Delete: `apps/backend/src/modules/products/services/suppliers.service.ts`
- Modify: `apps/backend/src/modules/products/products.module.ts`

- [ ] **Step 1: Delete the four files**

```bash
rm apps/backend/src/modules/products/entities/supplier.entity.ts
rm apps/backend/src/modules/products/entities/product-component.entity.ts
rm apps/backend/src/modules/products/controllers/suppliers.controller.ts
rm apps/backend/src/modules/products/services/suppliers.service.ts
```

- [ ] **Step 2: Replace products.module.ts**

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesController } from './categories.controller';
import { ProductsController } from './products.controller';
import { ReviewsController } from './controllers/reviews.controller';
import { WishlistController } from './controllers/wishlist.controller';
import { UploadController } from './controllers/upload.controller';
import { InventoryController } from './controllers/inventory.controller';
import { CategoriesService } from './categories.service';
import { ProductsService } from './products.service';
import { ReviewsService } from './services/reviews.service';
import { WishlistService } from './services/wishlist.service';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Review } from './entities/review.entity';
import { Wishlist } from './entities/wishlist.entity';
import { Inventory } from './entities/inventory.entity';
import { ProductType } from '../product-types/entities/product-type.entity';
import { SettingsModule } from '../settings/settings.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, ProductType, Review, Wishlist, Inventory]),
    SettingsModule,
    ActivityModule,
  ],
  controllers: [CategoriesController, ProductsController, ReviewsController, WishlistController, UploadController, InventoryController],
  providers: [CategoriesService, ProductsService, ReviewsService, WishlistService],
  exports: [CategoriesService, ProductsService, ReviewsService, WishlistService],
})
export class ProductsModule {}
```

- [ ] **Step 3: Verify TypeScript compiles cleanly**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: zero errors. If there are import errors in reviews or wishlist controllers referencing supplier, fix those references.

---

## Task 5: Clean Product DTO and Fix Controller

**DTO changes:** Remove `adminId` (extracted from JWT in controller), `stockQuantity`, `minStockLevel` (ignored by TypeORM, managed via Inventory entity), `isFresh`, `weight`, `dimensions`, `marketplaceSupplier`, `metaTitle`, `metaDescription`. Simplify `marketplaceInfo`.

**Controller changes:** Extract `adminId` from JWT. Add `GET /admin` endpoint that shows all products regardless of `isAvailable`.

**Files:**
- Modify: `apps/backend/src/modules/products/dto/create-product.dto.ts`
- Modify: `apps/backend/src/modules/products/products.controller.ts`
- Modify: `apps/backend/src/modules/products/products.service.ts`

- [ ] **Step 1: Replace create-product.dto.ts**

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, Min, IsObject, IsIn } from 'class-validator';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  images: string[];

  @ApiProperty()
  @IsString()
  categoryId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  productTypeId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  specifications?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isOrganic?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unit?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  originalPrice?: number;

  @ApiProperty({ required: false, enum: ['marketplace', 'warehouse'] })
  @IsOptional()
  @IsIn(['marketplace', 'warehouse'])
  inventoryType?: 'marketplace' | 'warehouse';

  @ApiProperty({ required: false, enum: ['draft', 'active', 'archived'] })
  @IsOptional()
  @IsIn(['draft', 'active', 'archived'])
  status?: 'draft' | 'active' | 'archived';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  marketplaceInfo?: { supplierName?: string; supplierContact?: string };

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasVariants?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  variantName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  variants?: Array<{ name: string; price: number; originalPrice?: number; isAvailable?: boolean }>;
}
```

- [ ] **Step 2: Update products.service.ts — pass adminId separately**

Change the `create` signature and body:
```typescript
async create(createProductDto: CreateProductDto, adminId: string, performedBy?: { id: string; name: string }): Promise<Product> {
  const product = this.productRepository.create({ ...createProductDto, adminId });
  const savedProduct = await this.productRepository.save(product);
  // ... rest unchanged
```

Change `findAll` to support showing all products for admin:
```typescript
async findAll(filters: {
  category?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  type?: string;
  includeAll?: boolean;  // <-- add this
}): Promise<{ ... }> {
  // ...
  const baseQuery = this.productRepository.createQueryBuilder('product')
    .leftJoinAndSelect('product.category', 'category')
    .leftJoinAndSelect('product.productType', 'productType');

  // Only filter by isAvailable for public requests
  if (!filters.includeAll) {
    baseQuery.where('product.isAvailable = :isAvailable', { isAvailable: true });
  }
  // ... rest of filters unchanged (but change .andWhere to .andWhere for category/type/search
  // since there's no initial .where() when includeAll=true, use .where() for the first filter
```

Full updated findAll method:
```typescript
async findAll(filters: {
  category?: string;
  featured?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  type?: string;
  includeAll?: boolean;
}): Promise<{ products: Product[]; total: number; page: number; limit: number; totalPages: number; categories: Category[]; productTypes: ProductType[] }> {
  const page = filters.page || 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 12;
  const skip = (page - 1) * limit;

  const baseQuery = this.productRepository.createQueryBuilder('product')
    .leftJoinAndSelect('product.category', 'category')
    .leftJoinAndSelect('product.productType', 'productType');

  const conditions: string[] = [];
  const params: Record<string, any> = {};

  if (!filters.includeAll) {
    conditions.push('product.isAvailable = :isAvailable');
    params.isAvailable = true;
  }
  if (filters.category) {
    const categoryIds = filters.category.split(',').map(id => id.trim());
    conditions.push('product.categoryId IN (:...categoryIds)');
    params.categoryIds = categoryIds;
  }
  if (filters.featured !== undefined) {
    conditions.push('product.featured = :featured');
    params.featured = filters.featured;
  }
  if (filters.type) {
    const typeIds = filters.type.split(',').map(id => id.trim());
    conditions.push('product.productTypeId IN (:...typeIds)');
    params.typeIds = typeIds;
  }
  if (filters.search) {
    conditions.push('(product.name ILIKE :search OR product.description ILIKE :search OR product.tags::text ILIKE :search)');
    params.search = `%${filters.search}%`;
  }

  if (conditions.length > 0) {
    baseQuery.where(conditions.join(' AND '), params);
  }

  const total = await baseQuery.getCount();
  const products = await baseQuery
    .orderBy('product.createdAt', 'DESC')
    .skip(skip)
    .take(limit)
    .getMany();

  const totalPages = Math.ceil(total / limit);
  const categories = await this.getCategories();
  const productTypes = await this.getProductTypes();

  return { products, total, page, limit, totalPages, categories, productTypes };
}
```

- [ ] **Step 3: Replace products.controller.ts**

```typescript
import { Controller, Get, Post, Body, Patch, Put, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../common/guards/roles.guard';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiBearerAuth()
  create(@Request() req, @Body() createProductDto: CreateProductDto) {
    const adminId = req.user.id || req.user.sub;
    return this.productsService.create(createProductDto, adminId, { id: adminId, name: req.user.name || req.user.email });
  }

  // Admin-only list: shows ALL products regardless of isAvailable
  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiBearerAuth()
  async findAllAdmin(
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.productsService.findAll({
      category, search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      type,
      includeAll: true,
    });
  }

  // Public list: only isAvailable products
  @Get()
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'featured', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'type', required: false })
  async findAll(
    @Query('category') category?: string,
    @Query('featured') featured?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    return this.productsService.findAll({
      category,
      featured: featured !== undefined ? featured === 'true' : undefined,
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12,
      type,
    });
  }

  @Get('categories')
  getCategories() {
    return this.productsService.getCategories();
  }

  @Get('categories-with-types')
  getCategoriesWithTypes() {
    return this.productsService.getCategoriesWithTypes();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiBearerAuth()
  update(@Request() req, @Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto, { id: req.user.id, name: req.user.name || req.user.email });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiBearerAuth()
  putUpdate(@Request() req, @Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto, { id: req.user.id, name: req.user.name || req.user.email });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super_admin', 'staff')
  @ApiBearerAuth()
  remove(@Request() req, @Param('id') id: string) {
    return this.productsService.remove(id, { id: req.user.id, name: req.user.name || req.user.email });
  }
}
```

- [ ] **Step 4: Verify compilation**

```bash
cd apps/backend && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: zero TypeScript errors.

- [ ] **Step 5: Restart backend and verify it starts**

Kill the dev server (`pkill -f "nest start"` or Ctrl+C in the terminal), then:
```bash
cd apps/backend && yarn start:dev &
sleep 8
curl -s http://localhost:3000/api/v1/health | grep '"status":"ok"'
```

Expected: `"status":"ok"` in the response.

- [ ] **Step 6: Commit backend entity + service changes**

```bash
git add apps/backend/src/modules/
git commit -m "refactor: clean product system — remove unused entities, fields, dead code"
```

---

## Task 6: Database Migration

**Create and run a single migration** that drops unused columns/tables from the live database to match the cleaned entities.

**Column names in DB match TypeORM default (camelCase property name = column name).** All drops use `IF EXISTS` so they're safe to re-run or run on a fresh DB.

**Files:**
- Create: `apps/backend/src/migrations/1749470000000-CleanProductSchema.ts`

- [ ] **Step 1: Create migrations directory**

```bash
mkdir -p apps/backend/src/migrations
```

- [ ] **Step 2: Create the migration file**

Create `apps/backend/src/migrations/1749470000000-CleanProductSchema.ts`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanProductSchema1749470000000 implements MigrationInterface {
  name = 'CleanProductSchema1749470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── product_components ──────────────────────────────────────────────
    // Drop before suppliers — has FK to products
    await queryRunner.query(`DROP TABLE IF EXISTS "product_components"`);

    // ── products: remove supplierId before dropping suppliers table ──────
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "supplierId"`);

    // ── suppliers ────────────────────────────────────────────────────────
    await queryRunner.query(`DROP TABLE IF EXISTS "suppliers"`);

    // ── products: drop unused columns ────────────────────────────────────
    // rating check constraint must be dropped before column
    await queryRunner.query(`
      DO $$ DECLARE c text;
      BEGIN
        SELECT constraint_name INTO c FROM information_schema.table_constraints
        WHERE table_name = 'products' AND constraint_type = 'CHECK'
          AND constraint_name ILIKE '%rating%';
        IF c IS NOT NULL THEN EXECUTE 'ALTER TABLE products DROP CONSTRAINT "' || c || '"'; END IF;
      END $$
    `);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "slug"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "metaTitle"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "metaDescription"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "nutritionInfo"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "isFresh"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "isBundle"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "marketplaceSupplier"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "weight"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "dimensions"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "viewCount"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "purchaseCount"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "rating"`);
    await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "reviewCount"`);

    // ── product_types: drop unused columns ───────────────────────────────
    // Drop the unique constraint on "name" before dropping the column
    await queryRunner.query(`
      DO $$ DECLARE c text;
      BEGIN
        SELECT constraint_name INTO c FROM information_schema.table_constraints
        WHERE table_name = 'product_types' AND constraint_type = 'UNIQUE'
          AND constraint_name ILIKE '%name%';
        IF c IS NOT NULL THEN EXECUTE 'ALTER TABLE product_types DROP CONSTRAINT "' || c || '"'; END IF;
      END $$
    `);
    await queryRunner.query(`ALTER TABLE "product_types" DROP COLUMN IF EXISTS "name"`);
    await queryRunner.query(`ALTER TABLE "product_types" DROP COLUMN IF EXISTS "pricing"`);
    await queryRunner.query(`ALTER TABLE "product_types" DROP COLUMN IF EXISTS "requirements"`);
    await queryRunner.query(`ALTER TABLE "product_types" DROP COLUMN IF EXISTS "icon"`);

    // ── product_types: add units column ──────────────────────────────────
    await queryRunner.query(`
      ALTER TABLE "product_types" ADD COLUMN IF NOT EXISTS "units" json
    `);

    // ── product_types: make displayName unique ────────────────────────────
    // Deduplicate displayName values before adding unique constraint
    await queryRunner.query(`
      UPDATE "product_types" pt
      SET "displayName" = pt."displayName" || '-' || LEFT(pt.id::text, 4)
      WHERE id NOT IN (
        SELECT MIN(id::text)::uuid FROM "product_types" GROUP BY "displayName"
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "product_types"
      ADD CONSTRAINT "UQ_product_types_displayName" UNIQUE ("displayName")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "product_types" DROP CONSTRAINT IF EXISTS "UQ_product_types_displayName"`);
    await queryRunner.query(`ALTER TABLE "product_types" DROP COLUMN IF EXISTS "units"`);
    await queryRunner.query(`ALTER TABLE "product_types" ADD COLUMN IF NOT EXISTS "icon" character varying`);
    await queryRunner.query(`ALTER TABLE "product_types" ADD COLUMN IF NOT EXISTS "requirements" json`);
    await queryRunner.query(`ALTER TABLE "product_types" ADD COLUMN IF NOT EXISTS "pricing" json`);
    await queryRunner.query(`ALTER TABLE "product_types" ADD COLUMN IF NOT EXISTS "name" character varying`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "reviewCount" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "rating" numeric(3,2) NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "purchaseCount" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "viewCount" integer NOT NULL DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "dimensions" json`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "weight" numeric(10,2)`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "marketplaceSupplier" character varying`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isBundle" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isFresh" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "nutritionInfo" json`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "metaDescription" text`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "metaTitle" character varying`);
    await queryRunner.query(`ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "slug" character varying`);
  }
}
```

- [ ] **Step 3: Register migration in app.module.ts TypeORM config**

Check `apps/backend/src/app.module.ts` for the TypeORM `forRoot` configuration. Add the migrations array if it's missing:
```typescript
// In TypeOrmModule.forRoot(...)  add:
migrations: [__dirname + '/migrations/*{.ts,.js}'],
migrationsRun: false,
```

If TypeORM is configured via a config file (e.g., `database.config.ts`), add the same there.

- [ ] **Step 4: Run the migration**

```bash
cd apps/backend && yarn migration:run
```

Expected output:
```
✅ Migrations completed successfully
```

If it shows "0 migrations ran" the migration was already applied or the path is wrong. Check that the migration file is in `src/migrations/` and the TypeORM config picks it up.

- [ ] **Step 5: Verify DB schema is correct**

```bash
docker exec khaalis-postgres-dev psql -U postgres -d khaalis_harvest -c "\d products" 2>/dev/null | grep -E "Column|Type" | head -30
docker exec khaalis-postgres-dev psql -U postgres -d khaalis_harvest -c "\d product_types" 2>/dev/null | grep -E "Column|Type" | head -20
docker exec khaalis-postgres-dev psql -U postgres -d khaalis_harvest -c "\dt" | grep -E "supplier|component"
```

Expected:
- `products` table: no `slug`, `nutritionInfo`, `isFresh`, `rating`, `supplierId` etc.
- `product_types` table: no `name`, `pricing`, `requirements`. Has `units` column.
- No `suppliers` or `product_components` tables.

- [ ] **Step 6: Verify backend still starts cleanly after migration**

```bash
curl -s http://localhost:3000/api/v1/health | grep '"status":"ok"'
```

---

## Task 7: Update Frontend Type Interfaces

**Three files:** productTypes service, DynamicField component, FieldEditor component.

**Files:**
- Modify: `apps/web/src/services/productTypes.ts`
- Modify: `apps/web/src/components/ui/DynamicField.tsx`
- Modify: `apps/web/src/components/ui/FieldEditor.tsx`

- [ ] **Step 1: Replace productTypes.ts interface section (top of file, before `productTypesApi`)**

Replace everything above `export const productTypesApi` with:

```typescript
const API_BASE = '/api/v1';

export type FieldType = 'text' | 'number' | 'select' | 'checkbox' | 'textarea';

export interface SpecField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: Array<{ label: string; value: string }>;
}

export interface ProductType {
  id: string;
  displayName: string;
  description?: string;
  categoryId: string;
  color?: string;
  units?: string[];
  specifications?: { fields: SpecField[] };
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductTypeDto {
  displayName: string;
  categoryId: string;
  description?: string;
  color?: string;
  units?: string[];
  specifications?: { fields: SpecField[] };
  isActive?: boolean;
  sortOrder?: number;
}
```

- [ ] **Step 2: Update DynamicField.tsx — simplify DynamicFieldConfig type**

In `apps/web/src/components/ui/DynamicField.tsx`, replace the `DynamicFieldConfig` interface (lines 11–30):

```typescript
export interface FieldOption {
  label: string;
  value: string;
}

export interface DynamicFieldConfig {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  description?: string;
  options?: FieldOption[];
}
```

Then update the `renderField()` switch to only handle 5 types. Replace the entire `renderField` function body:

```typescript
const renderField = () => {
  const baseClasses = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors duration-200 ${
    error ? 'border-red-500' : 'border-gray-300'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

  switch (config.type) {
    case 'text':
      return (
        <input
          type="text"
          id={config.id}
          name={config.name}
          value={value || ''}
          onChange={e => handleChange(e.target.value)}
          disabled={disabled}
          className={baseClasses}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          id={config.id}
          name={config.name}
          value={value || ''}
          onChange={e => handleChange(e.target.value === '' ? '' : Number(e.target.value))}
          disabled={disabled}
          className={baseClasses}
        />
      );
    case 'textarea':
      return (
        <textarea
          id={config.id}
          name={config.name}
          value={value || ''}
          onChange={e => handleChange(e.target.value)}
          disabled={disabled}
          rows={3}
          className={`${baseClasses} resize-none`}
        />
      );
    case 'select':
      return (
        <select
          id={config.id}
          name={config.name}
          value={value || ''}
          onChange={e => handleChange(e.target.value)}
          disabled={disabled}
          className={baseClasses}
        >
          <option value="">Select...</option>
          {(config.options || []).map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    case 'checkbox':
      return (
        <div className="space-y-2">
          {(config.options || []).map(opt => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                value={opt.value}
                checked={Array.isArray(value) ? value.includes(opt.value) : false}
                onChange={e => {
                  const current = Array.isArray(value) ? value : [];
                  handleChange(e.target.checked
                    ? [...current, opt.value]
                    : current.filter((v: string) => v !== opt.value)
                  );
                }}
                disabled={disabled}
                className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
              />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      );
    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={e => handleChange(e.target.value)}
          disabled={disabled}
          className={baseClasses}
        />
      );
  }
};
```

Remove the `isFocused` state and any `onFocus`/`onBlur` wrappers — the simplified renderField doesn't need them. The component's return can simply be:

```typescript
return (
  <div className="space-y-1">
    <label htmlFor={config.id} className="block text-sm font-medium text-gray-700">
      {config.label}
      {config.required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {renderField()}
    {config.description && <p className="text-xs text-gray-500">{config.description}</p>}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);
```

- [ ] **Step 3: Update FieldEditor.tsx — reduce FIELD_TYPES to 5**

Replace the `FIELD_TYPES` array at the top of `FieldEditor.tsx`:

```typescript
const FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number Input' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'select', label: 'Select Dropdown' },
  { value: 'checkbox', label: 'Checkbox Group' },
];
```

Update the `formData` state initial value to remove fields that no longer apply:
```typescript
const [formData, setFormData] = useState<DynamicFieldConfig>({
  id: '',
  name: '',
  label: '',
  type: 'text',
  required: false,
  description: '',
  options: [],
});
```

In the form body of FieldEditor, remove any UI sections for: `placeholder`, `min/max/step`, `rows`, `accept`, `validation pattern/message`, `email/url/color/range/file`-specific sections. Keep only: label, name, type dropdown, required toggle, description, and the options section (shown when type is select or checkbox).

- [ ] **Step 4: Verify TypeScript compiles on frontend**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Fix any type errors from the narrowed `FieldType`. Common fix: cast or update any component that passes a wider string type.

---

## Task 8: Simplify FieldTemplates.tsx

Remove the 696-line file of over-specified templates. Replace with a lean set using only the 5 supported field types.

**File:** `apps/web/src/components/ui/FieldTemplates.tsx`

- [ ] **Step 1: Replace entire FieldTemplates.tsx**

```typescript
import { DynamicFieldConfig } from './DynamicField';

export const NATURAL_PRODUCT_FIELD_TEMPLATES: Record<string, DynamicFieldConfig[]> = {
  fresh_produce: [
    { id: 'variety', name: 'variety', label: 'Variety', type: 'text', required: false, description: 'e.g. Chaunsa, Anwar Ratol' },
    { id: 'origin', name: 'origin', label: 'Origin / Farm', type: 'text', required: false, description: 'Where it was grown' },
    { id: 'season', name: 'season', label: 'Season', type: 'select', required: false, options: [
      { label: 'Summer', value: 'summer' },
      { label: 'Winter', value: 'winter' },
      { label: 'Year-round', value: 'year_round' },
    ]},
    { id: 'quality_grade', name: 'quality_grade', label: 'Quality Grade', type: 'select', required: false, options: [
      { label: 'Premium', value: 'premium' },
      { label: 'Standard', value: 'standard' },
      { label: 'Economy', value: 'economy' },
    ]},
  ],
  dairy: [
    { id: 'fat_content', name: 'fat_content', label: 'Fat Content (%)', type: 'number', required: false },
    { id: 'pasteurized', name: 'pasteurized', label: 'Pasteurized', type: 'select', required: false, options: [
      { label: 'Yes', value: 'yes' },
      { label: 'No (Raw)', value: 'no' },
    ]},
    { id: 'animal_source', name: 'animal_source', label: 'Animal Source', type: 'select', required: false, options: [
      { label: 'Cow', value: 'cow' },
      { label: 'Buffalo', value: 'buffalo' },
      { label: 'Goat', value: 'goat' },
    ]},
    { id: 'shelf_life_days', name: 'shelf_life_days', label: 'Shelf Life (days)', type: 'number', required: false },
  ],
  dry_goods: [
    { id: 'variety', name: 'variety', label: 'Variety / Type', type: 'text', required: false },
    { id: 'origin', name: 'origin', label: 'Origin', type: 'text', required: false },
    { id: 'processing', name: 'processing', label: 'Processing', type: 'select', required: false, options: [
      { label: 'Raw', value: 'raw' },
      { label: 'Roasted', value: 'roasted' },
      { label: 'Ground', value: 'ground' },
      { label: 'Whole', value: 'whole' },
    ]},
    { id: 'shelf_life_months', name: 'shelf_life_months', label: 'Shelf Life (months)', type: 'number', required: false },
  ],
  plants: [
    { id: 'plant_type', name: 'plant_type', label: 'Plant Type', type: 'select', required: false, options: [
      { label: 'Vegetable', value: 'vegetable' },
      { label: 'Fruit', value: 'fruit' },
      { label: 'Herb', value: 'herb' },
      { label: 'Ornamental', value: 'ornamental' },
    ]},
    { id: 'pot_size', name: 'pot_size', label: 'Pot Size', type: 'select', required: false, options: [
      { label: 'Small (4")', value: 'small' },
      { label: 'Medium (6")', value: 'medium' },
      { label: 'Large (10"+)', value: 'large' },
    ]},
    { id: 'sun_requirement', name: 'sun_requirement', label: 'Sun Requirement', type: 'select', required: false, options: [
      { label: 'Full Sun', value: 'full_sun' },
      { label: 'Partial Shade', value: 'partial_shade' },
      { label: 'Full Shade', value: 'full_shade' },
    ]},
    { id: 'care_notes', name: 'care_notes', label: 'Care Notes', type: 'textarea', required: false },
  ],
  honey_jams: [
    { id: 'variety', name: 'variety', label: 'Variety / Flavor', type: 'text', required: false },
    { id: 'origin', name: 'origin', label: 'Region / Origin', type: 'text', required: false },
    { id: 'certifications', name: 'certifications', label: 'Certifications', type: 'checkbox', required: false, options: [
      { label: 'Organic', value: 'organic' },
      { label: 'Natural', value: 'natural' },
      { label: 'No Added Sugar', value: 'no_added_sugar' },
    ]},
    { id: 'shelf_life_months', name: 'shelf_life_months', label: 'Shelf Life (months)', type: 'number', required: false },
  ],
};
```

---

## Task 9: Simplify ProductTypesManagement UI

**Remove:** "Pricing Model" radio-button section (replaced by a simple units text input). Remove `name` field (only `displayName` now). Update `formData` and `handleDelete`.

**File:** `apps/web/src/components/super-admin/ProductTypesManagement.tsx`

- [ ] **Step 1: Update the import line for ProductType**

The `productTypesApi`, `ProductType`, `CreateProductTypeDto` imports now come from the updated service — `name` field is gone. No import change needed unless FieldTemplates import fails.

- [ ] **Step 2: Replace `formData` initial state and type**

```typescript
const [formData, setFormData] = useState<CreateProductTypeDto>({
  displayName: '',
  description: '',
  categoryId: '',
  specifications: { fields: [] },
  units: [],
  isActive: true,
  sortOrder: 0,
  color: '#10B981',
});
```

- [ ] **Step 3: Update `handleEdit` — remove name, remove pricing**

```typescript
const handleEdit = (productType: ProductType) => {
  setEditingType(productType);
  const customFields = productType.specifications?.fields || [];
  setDynamicFields(customFields);
  setFormData({
    displayName: productType.displayName,
    description: productType.description || '',
    categoryId: productType.categoryId || '',
    specifications: productType.specifications || { fields: customFields },
    units: productType.units || [],
    isActive: productType.isActive,
    sortOrder: productType.sortOrder,
    color: productType.color || '#10B981',
  });
  setCategoryId(productType.categoryId || '');
  setShowForm(true);
};
```

- [ ] **Step 4: Update `handleDelete` — use displayName**

```typescript
const handleDelete = (id: string, displayName: string) => {
  setPendingDelete({ id, name: displayName });
  setShowConfirmDialog(true);
};
```

In the table row actions, change the onClick:
```tsx
onClick={() => handleDelete(type.id, type.displayName)}
```

- [ ] **Step 5: Update `resetForm`**

```typescript
const resetForm = () => {
  setFormData({
    displayName: '',
    description: '',
    categoryId: '',
    specifications: { fields: [] },
    units: [],
    isActive: true,
    sortOrder: 0,
    color: '#10B981',
  });
  setDynamicFields([]);
  setEditingType(null);
  setCategoryId('');
  setShowForm(false);
};
```

- [ ] **Step 6: Replace the "Pricing Model" form section with a Units input**

Find the entire `{/* Pricing Model Section */}` block (starts with the card div containing the 4 radio buttons) and replace the whole section with:

```tsx
{/* Units Section */}
<div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
  <div className="px-6 py-4 border-b border-gray-200">
    <h4 className="text-lg font-semibold text-gray-900">Selling Units</h4>
    <p className="text-sm text-gray-600 mt-1">Which units can this product be sold in?</p>
  </div>
  <div className="p-6">
    <div className="flex flex-wrap gap-2 mb-3">
      {(formData.units || []).map((unit, idx) => (
        <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
          {unit}
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, units: (prev.units || []).filter((_, i) => i !== idx) }))}
            className="ml-1 text-orange-600 hover:text-orange-900 font-bold leading-none"
          >×</button>
        </span>
      ))}
    </div>
    <div className="flex gap-2">
      <input
        type="text"
        id="unitInput"
        placeholder="Type a unit and press Enter (e.g. kg, liter, piece, dozen)"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const val = (e.target as HTMLInputElement).value.trim();
            if (val && !(formData.units || []).includes(val)) {
              setFormData(prev => ({ ...prev, units: [...(prev.units || []), val] }));
            }
            (e.target as HTMLInputElement).value = '';
          }
        }}
      />
    </div>
    <p className="text-xs text-gray-500 mt-2">Press Enter to add each unit. These will appear as unit options when creating products of this type.</p>
    {/* Quick-add common units */}
    <div className="flex flex-wrap gap-2 mt-3">
      <span className="text-xs text-gray-500 self-center">Quick add:</span>
      {['kg', 'g', 'liter', 'ml', 'piece', 'dozen', 'pack', 'bunch', 'box', 'bottle', 'jar'].map(u => (
        <button
          key={u}
          type="button"
          onClick={() => {
            if (!(formData.units || []).includes(u)) {
              setFormData(prev => ({ ...prev, units: [...(prev.units || []), u] }));
            }
          }}
          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 transition-colors"
        >
          {u}
        </button>
      ))}
    </div>
  </div>
</div>
```

- [ ] **Step 7: Remove `name` field from the Basic Information form section**

Find the "Product Type Name" input (the one with regex `.replace(/[^a-z0-9-_]/g, '')`) and delete that entire `<div>` block. The form should now only have: Category, Display Name, Color, Description.

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

---

## Task 10: Simplify ProductsManagement UI

This is the largest change. Clean `formData`, fix bugs, remove dead code.

**File:** `apps/web/src/components/super-admin/ProductsManagement.tsx`

- [ ] **Step 1: Update the `Product` interface at the top of the file**

```typescript
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  images: string[];
  categoryId: string;
  productTypeId?: string;
  adminId: string;
  inventoryType: 'marketplace' | 'warehouse';
  isAvailable: boolean;
  unit: string;
  featured: boolean;
  isOrganic: boolean;
  marketplaceInfo?: { supplierName?: string; supplierContact?: string };
  specifications?: Record<string, any>;
  tags?: string[];
  hasVariants?: boolean;
  variantName?: string;
  variants?: Array<{ name: string; price: number; originalPrice?: number; isAvailable?: boolean }>;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}
```

- [ ] **Step 2: Replace `formData` initial state — remove all dead fields**

```typescript
const [formData, setFormData] = useState({
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  images: [] as string[],
  categoryId: '',
  productTypeId: '',
  inventoryType: 'warehouse' as 'warehouse' | 'marketplace',
  isAvailable: true,
  unit: 'kg',
  featured: false,
  isOrganic: false,
  status: 'active' as 'draft' | 'active' | 'archived',
  tags: '',
  supplierName: '',
  supplierContact: '',
  hasVariants: false,
  variantName: '',
  variants: [] as Array<{ name: string; price: number; originalPrice?: number; isAvailable?: boolean }>,
});
```

- [ ] **Step 3: Update `handleImageUpload` and image state to use arrays**

Since `images` is now `string[]` in formData, update all image handling:

Replace image comma-split parsing everywhere with direct array operations:
```typescript
// In the image upload handler:
const url = await handleImageUpload(file);
setFormData(prev => ({ ...prev, images: [...prev.images, url] }));

// Remove image by index:
setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }));
```

- [ ] **Step 4: Update `handleEdit` — restore selectedProductType and dynamic fields**

```typescript
const handleEdit = (product: Product) => {
  setEditingProduct(product);

  // Restore dynamic fields for the product's type
  const type = productTypes.find(pt => pt.id === product.productTypeId) || null;
  setSelectedProductType(type);
  setDynamicFields(type?.specifications?.fields || []);

  setFormData({
    name: product.name,
    description: product.description,
    price: product.price.toString(),
    originalPrice: product.originalPrice?.toString() || '',
    images: product.images || [],
    categoryId: product.categoryId,
    productTypeId: product.productTypeId || '',
    inventoryType: product.inventoryType || 'warehouse',
    isAvailable: product.isAvailable,
    unit: product.unit || 'kg',
    featured: product.featured || false,
    isOrganic: product.isOrganic || false,
    status: product.status || 'active',
    tags: (product.tags || []).join(', '),
    supplierName: product.marketplaceInfo?.supplierName || '',
    supplierContact: product.marketplaceInfo?.supplierContact || '',
    hasVariants: product.hasVariants || false,
    variantName: product.variantName || '',
    variants: product.variants || [],
  });

  // Populate any dynamic spec fields from saved specifications
  if (type?.specifications?.fields && product.specifications) {
    type.specifications.fields.forEach(field => {
      if (product.specifications![field.name] !== undefined) {
        handleDynamicFieldChange(field.name, product.specifications![field.name]);
      }
    });
  }

  categoryDropdown.setValue(product.categoryId);
  productTypeDropdown.setValue(product.productTypeId || '');
  unitDropdown.setValue(product.unit || 'kg');
  inventoryTypeDropdown.setValue(product.inventoryType || 'warehouse');
  setShowForm(true);
};
```

- [ ] **Step 5: Update `resetForm`**

```typescript
const resetForm = () => {
  setFormData({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    images: [],
    categoryId: '',
    productTypeId: '',
    inventoryType: 'warehouse',
    isAvailable: true,
    unit: 'kg',
    featured: false,
    isOrganic: false,
    status: 'active',
    tags: '',
    supplierName: '',
    supplierContact: '',
    hasVariants: false,
    variantName: '',
    variants: [],
  });
  categoryDropdown.clear();
  productTypeDropdown.clear();
  unitDropdown.setValue('kg');
  inventoryTypeDropdown.setValue('warehouse');
  setSelectedProductType(null);
  setDynamicFields([]);
  setFormErrors({});
  setEditingProduct(null);
  setShowForm(false);
};
```

- [ ] **Step 6: Update `handleSubmit` — clean payload, no adminId, only dynamic specs**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    // Build dynamic specifications from ProductType fields only
    const dynamicSpecs: Record<string, any> = {};
    if (selectedProductType?.specifications?.fields?.length) {
      selectedProductType.specifications.fields.forEach(field => {
        const value = (formData as any)[field.name];
        if (value !== undefined && value !== '') {
          dynamicSpecs[field.name] = field.type === 'number' ? Number(value) : value;
        }
      });
    }

    const productData: Record<string, any> = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : undefined,
      images: formData.images,
      categoryId: formData.categoryId || undefined,
      productTypeId: formData.productTypeId || undefined,
      inventoryType: formData.inventoryType,
      isAvailable: formData.isAvailable,
      unit: formData.unit,
      featured: formData.featured,
      isOrganic: formData.isOrganic,
      status: formData.status,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      specifications: Object.keys(dynamicSpecs).length > 0 ? dynamicSpecs : undefined,
      marketplaceInfo: formData.inventoryType === 'marketplace' ? {
        supplierName: formData.supplierName || undefined,
        supplierContact: formData.supplierContact || undefined,
      } : undefined,
      hasVariants: formData.hasVariants,
      variantName: formData.hasVariants ? formData.variantName : undefined,
      variants: formData.hasVariants
        ? formData.variants.filter(v => v.name && v.price > 0)
        : undefined,
    };

    const url = editingProduct ? `/api/v1/products/${editingProduct.id}` : `/api/v1/products`;
    const method = editingProduct ? 'PUT' : 'POST';
    const token = localStorage.getItem('backend_token');

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(productData),
    });

    if (response.ok) {
      toast.success(editingProduct ? 'Product updated' : 'Product created');
      fetchProducts();
      resetForm();
    } else {
      const err = await response.json();
      toast.error(err.message || 'Failed to save product');
    }
  } catch (error) {
    toast.error('An error occurred while saving');
  }
};
```

- [ ] **Step 7: Update `fetchProducts` to use the admin endpoint**

```typescript
const fetchProducts = async (page = currentPage, search = searchTerm, category = selectedCategory, type = selectedProductTypeFilter) => {
  try {
    setLoading(true);
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', itemsPerPage.toString());
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (type) params.append('type', type);

    const response = await fetch(`/api/v1/products/admin?${params}`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('backend_token')}` },
    });
    const data = await response.json();
    setProducts(data.data?.products || data.products || []);
    setTotalPages(data.data?.totalPages || data.totalPages || 1);
    setTotalProducts(data.data?.total || data.total || 0);
  } catch (error) {
    toast.error('Failed to load products');
  } finally {
    setLoading(false);
  }
};
```

- [ ] **Step 8: Fix unit dropdown — show type units or all units as fallback**

```typescript
const ALL_UNITS = ['kg', 'g', 'lb', 'oz', 'liter', 'ml', 'piece', 'dozen', 'pack', 'bunch', 'box', 'basket', 'bag', 'bottle', 'jar', 'plant', 'seedling'];

// In the form, replace the unit Dropdown options:
options={(selectedProductType?.units?.length
  ? selectedProductType.units.map(u => ({ value: u, label: u }))
  : ALL_UNITS.map(u => ({ value: u, label: u }))
)}
```

- [ ] **Step 9: Fix pagination — show window around current page**

Replace the pagination buttons generation:
```tsx
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

- [ ] **Step 10: Update form — remove hardcoded spec fields, update marketplace section**

Remove the entire old "Specifications" and "Nutrition Info" form sections (the hardcoded quality/variety/origin/certification/calories/fiber/sugar fields). These are gone — dynamic fields from ProductType handle them.

Update the "Inventory Settings" marketplace sub-form to use `supplierName` and `supplierContact`:
```tsx
{formData.inventoryType === 'marketplace' && (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Name</label>
      <input
        type="text"
        value={formData.supplierName}
        onChange={e => setFormData(prev => ({ ...prev, supplierName: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
        placeholder="Supplier or vendor name"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Supplier Contact</label>
      <input
        type="text"
        value={formData.supplierContact}
        onChange={e => setFormData(prev => ({ ...prev, supplierContact: e.target.value }))}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
        placeholder="Phone or email"
      />
    </div>
  </div>
)}
```

- [ ] **Step 11: Remove all console.log statements**

Search and remove all `console.log` calls:
```bash
grep -n "console.log" apps/web/src/components/super-admin/ProductsManagement.tsx
```

Delete each line found.

- [ ] **Step 12: Update the image handling in the form**

The images input field (`formData.images` is now `string[]`):
```tsx
{/* Image thumbnails */}
{formData.images.map((url, idx) => (
  <div key={idx} className="relative w-20 h-20">
    <img src={url} alt="" className="w-full h-full object-cover rounded-lg"
      onError={e => { (e.target as HTMLImageElement).src = '/images/placeholder.svg'; }} />
    <button
      type="button"
      onClick={() => setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
    >×</button>
  </div>
))}

{/* URL text input for pasting */}
<input
  type="text"
  placeholder="Paste image URL and press Enter"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
  onKeyDown={e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const url = (e.target as HTMLInputElement).value.trim();
      if (url) {
        setFormData(prev => ({ ...prev, images: [...prev.images, url] }));
        (e.target as HTMLInputElement).value = '';
      }
    }
  }}
/>
```

- [ ] **Step 13: Verify TypeScript compiles cleanly**

```bash
cd apps/web && npx tsc --noEmit 2>&1 | grep -E "error TS" | head -20
```

Expected: zero errors.

---

## Task 11: End-to-End Verification

- [ ] **Step 1: Verify backend starts without errors**

```bash
tail -20 /tmp/khaalis-dev.log | grep -E "error|Error|started|ready"
```

Expected: `🚀 Khaalis Harvest API Server running on http://localhost:3000` — no error lines.

- [ ] **Step 2: Verify health endpoint**

```bash
curl -s http://localhost:3000/api/v1/health
```

Expected: `{"success":true,"data":{"status":"ok","database":"up","redis":"up",...}}`

- [ ] **Step 3: Create a category via API**

```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@khaalisharvest.pk","password":"superadmin123"}' | \
  grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

curl -s -X POST http://localhost:3000/api/v1/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Fresh Produce","description":"Fresh fruits and vegetables"}' | python3 -m json.tool | grep '"id"'
```

Expected: response with an `id` UUID.

- [ ] **Step 4: Create a product type via API**

```bash
CATEGORY_ID=<id from step 3>
curl -s -X POST http://localhost:3000/api/v1/product-types \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"displayName\":\"Mango\",\"categoryId\":\"$CATEGORY_ID\",\"units\":[\"kg\",\"piece\",\"dozen\"],\"color\":\"#F59E0B\",\"specifications\":{\"fields\":[{\"id\":\"variety\",\"name\":\"variety\",\"label\":\"Variety\",\"type\":\"text\",\"required\":false}]}}" | python3 -m json.tool | grep '"id"'
```

Expected: response with an `id` UUID. No `name` field in response.

- [ ] **Step 5: Create a product via API**

```bash
PRODUCT_TYPE_ID=<id from step 4>
curl -s -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Chaunsa Mango\",\"description\":\"Sweet summer mango\",\"price\":250,\"unit\":\"kg\",\"images\":[],\"categoryId\":\"$CATEGORY_ID\",\"productTypeId\":\"$PRODUCT_TYPE_ID\",\"isOrganic\":true,\"specifications\":{\"variety\":\"Chaunsa\"}}" | python3 -m json.tool | grep '"id"'
```

Expected: response with product `id`. No `slug`, `nutritionInfo`, `rating` in response.

- [ ] **Step 6: Verify admin product list returns all products (including unavailable)**

```bash
curl -s "http://localhost:3000/api/v1/products/admin" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | grep '"total"'
```

Expected: returns count including any unavailable products.

- [ ] **Step 7: Open the admin UI and verify**

Navigate to `http://localhost:3001/admin/products/types`. Verify:
- Form shows only: Category, Display Name, Color, Description, Units (tag input), Custom Fields
- No "Pricing Model" radio buttons
- Units quick-add buttons work
- Creating a product type with fields works

Navigate to `http://localhost:3001/admin/products`. Verify:
- All products show (including unavailable)
- "Add Product" form: no hardcoded quality/variety/calories/fiber fields
- Selecting a ProductType with custom fields shows them in the form
- Editing an existing product shows its dynamic fields populated
- Creating a product saves and appears in the list
- Pagination works correctly when > 5 pages

- [ ] **Step 8: Final commit**

```bash
git add apps/
git commit -m "refactor: complete product system cleanup — simplified schema, unified specs, fixed admin list and form bugs"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] `ProductType.pricing` (5 fields) → replaced with `units: string[]`
- [x] `ProductType.requirements` deleted
- [x] `ProductType.name` deleted, `displayName` unique
- [x] `Product.nutritionInfo` deleted (merged into `specifications`)
- [x] `Product.isFresh` deleted
- [x] `Product.isBundle` + `ProductComponent` entity deleted
- [x] `Supplier` entity + service + controller deleted
- [x] `Product.marketplaceSupplier` deleted, `marketplaceInfo` simplified
- [x] `Product.slug/metaTitle/metaDescription` deleted
- [x] `Product.viewCount/purchaseCount/rating/reviewCount` deleted
- [x] DTO `stockQuantity/minStockLevel` deleted
- [x] Hardcoded spec fields removed from `formData`
- [x] `adminId` extracted from JWT (removed from DTO)
- [x] Admin `findAll` shows all products (no `isAvailable` filter)
- [x] `handleEdit` restores dynamic fields
- [x] Unit dropdown shows type units or all units as fallback
- [x] Pagination shows window around current page
- [x] Console.logs removed
- [x] Image handling uses `string[]` not comma-string
- [x] Error toasts on submit failure
- [x] Database migration drops all removed columns/tables
- [x] 15 field types → 5 field types across DynamicField + FieldEditor + backend validation

**Potential issues:**
- If `migrate.ts` uses `AppModule`'s DataSource config rather than `data-source.ts`, migrations must also be registered in `app.module.ts` TypeORM config. Check Task 6 Step 3.
- The `handleDynamicFieldChange` stores spec field values at the top level of `formData` (e.g., `formData.variety`). On `handleEdit`, restoring these requires iterating the product's `specifications` object. Task 10 Step 4 handles this.
- `FieldEditor.tsx` uses `motion` from framer-motion. After removing unused field type sections, verify the animation wrapper still works.
