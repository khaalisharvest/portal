import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Product } from './product.entity';
import { ProductType } from '../../product-types/entities/product-type.entity';

@Entity('product_categories')
@Index(['active', 'sortOrder']) // Composite index for active categories
@Index(['name']) // Index for category name lookups
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string;

  @Column({ default: true })
  active: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @OneToMany(() => Product, product => product.category)
  products: Product[];

  @OneToMany(() => ProductType, productType => productType.category)
  productTypes: ProductType[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}