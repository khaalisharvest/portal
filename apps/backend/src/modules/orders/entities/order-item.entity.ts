import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('order_items')
@Index(['orderId']) // Index for order relation lookups
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @ManyToOne('Order', 'items', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: any;

  // Product fields
  @Column({ nullable: true })
  productId: string;

  // @ManyToOne(() => Product, { onDelete: 'SET NULL', nullable: true })
  // @JoinColumn({ name: 'productId' })
  // product?: Product;

  // Snapshot fields
  @Column({ nullable: true })
  itemName: string; // Product name or bundle name

  @Column({ nullable: true })
  itemImage: string; // Product image or bundle image

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;

  @Column({ nullable: true })
  unit: string;

  @Column('json', { nullable: true })
  specifications: any;

  // Optional components when the purchased item is a bundle product
  @Column('json', { nullable: true })
  components?: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];

  @Column('json', { nullable: true })
  metadata?: Record<string, any>; // Additional item data

  // Variant information
  @Column({ nullable: true })
  selectedVariant?: string; // The variant name that was selected

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  variantPrice?: number; // The price of the selected variant

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  variantOriginalPrice?: number; // The original price of the selected variant

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
