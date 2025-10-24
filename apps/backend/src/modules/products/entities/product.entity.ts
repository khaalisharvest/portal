import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany, Index, Check } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from './category.entity';
import { ProductType } from '../../product-types/entities/product-type.entity';
import { Inventory } from './inventory.entity';
import { Review } from './review.entity';
import { Wishlist } from './wishlist.entity';
import { Supplier } from './supplier.entity';
import { ProductComponent } from './product-component.entity';

@Entity('products')
@Index(['categoryId', 'isAvailable']) // Essential for filtering
@Index(['inventoryType', 'isAvailable']) // Essential for inventory type filtering
@Index(['createdAt']) // Essential for sorting
@Index(['name']) // Essential for search
@Index(['slug'])
@Check(`"price" >= 0`) // Essential business rule
@Check(`"rating" >= 0 AND "rating" <= 5`) // Essential business rule
export class Product {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty({ description: 'SEO-friendly unique identifier' })
  @Column({ unique: true, nullable: true })
  slug: string;

  @ApiProperty()
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  metaTitle?: string;

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  metaDescription?: string;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice?: number;

  @ApiProperty()
  @Column()
  unit: string; // kg, liter, piece, etc.

  @ApiProperty()
  @Column({ type: 'json' })
  images: string[];

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  specifications?: Record<string, any>; // Flexible key-value pairs for any product type

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  nutritionInfo?: Record<string, any>; // Flexible key-value pairs for nutrition, care info, etc.

  @ApiProperty({ enum: ['draft', 'active', 'archived'] })
  @Column({ type: 'enum', enum: ['draft', 'active', 'archived'], default: 'active' })
  status: 'draft' | 'active' | 'archived';

  @ApiProperty()
  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @ApiProperty()
  @Column({ type: 'int', default: 0 })
  reviewCount: number;

  @ApiProperty()
  @Column()
  adminId: string; // Only admin can manage products

  @ApiProperty()
  @Column()
  categoryId: string;

  @ApiProperty()
  @Column({ nullable: true })
  productTypeId?: string;

  @ApiProperty()
  @Column({ nullable: true })
  supplierId?: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToOne(() => ProductType, productType => productType.products, { nullable: true })
  @JoinColumn({ name: 'productTypeId' })
  productType?: ProductType;

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplierId' })
  supplier?: Supplier;

  // Relationships
  @OneToMany(() => Inventory, inventory => inventory.product)
  inventory: Inventory[];

  @OneToMany(() => Review, review => review.product)
  reviews: Review[];

  @OneToMany(() => Wishlist, wishlist => wishlist.product)
  wishlists: Wishlist[];

  // Bundle composition (treat bundles as products)
  @OneToMany(() => ProductComponent, component => component.parentProduct, { cascade: true })
  components?: ProductComponent[];

  @OneToMany(() => ProductComponent, component => component.childProduct)
  usedInBundles?: ProductComponent[];

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  tags?: string[];

  @ApiProperty()
  @Column({ default: false })
  featured: boolean;

  @ApiProperty()
  @Column({ default: false })
  isOrganic: boolean;

  @ApiProperty()
  @Column({ default: false })
  isFresh: boolean; // Fresh vs frozen/dried

  @ApiProperty({ description: 'Marks this product as a bundle composed of other products' })
  @Column({ default: false })
  isBundle: boolean;

  @ApiProperty()
  @Column({ 
    type: 'enum', 
    enum: ['marketplace', 'warehouse'], 
    default: 'warehouse' 
  })
  inventoryType: 'marketplace' | 'warehouse'; // How inventory is managed

  @ApiProperty()
  @Column({ default: true })
  isAvailable: boolean; // For marketplace products - simple availability

  @ApiProperty()
  @Column({ nullable: true })
  marketplaceSupplier?: string; // For marketplace products - external supplier info

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  marketplaceInfo?: {
    supplierName?: string;
    supplierContact?: string;
    estimatedDeliveryTime?: string; // e.g., "2-3 days", "Same day"
    minimumOrderQuantity?: number;
    maximumOrderQuantity?: number;
    leadTime?: number; // Hours to get the product
  };

  @ApiProperty()
  @Column({ default: 0 })
  viewCount: number; // Track product views

  @ApiProperty()
  @Column({ default: 0 })
  purchaseCount: number; // Track purchases

  @ApiProperty()
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  weight: number; // Physical weight for shipping

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string; // cm, inches, etc.
  };

  // ===== VARIANT FIELDS =====
  @ApiProperty({ description: 'Whether this product has variants', required: false })
  @Column({ default: false })
  hasVariants: boolean;

  @ApiProperty({ description: 'Variant name (e.g., "Size", "Quality", "Leaf Size")', required: false })
  @Column({ nullable: true })
  variantName?: string;

  @ApiProperty({ description: 'Product variants with options', type: 'array', required: false })
  @Column({ type: 'json', nullable: true })
  variants?: Array<{
    name: string; // e.g., "Large", "Small", "Premium"
    price: number;
    originalPrice?: number;
    isAvailable?: boolean;
  }>;

  // Relationships (removed ProductVariant relationship - using JSON variants instead)

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
