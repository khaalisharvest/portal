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
