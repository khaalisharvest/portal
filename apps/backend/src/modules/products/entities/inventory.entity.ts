import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';

@Entity('inventory')
@Index(['productId', 'isActive']) // Composite index for performance
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
  @Column('int', { default: 0 })
  quantity: number;

  @ApiProperty()
  @Column('int', { default: 0 })
  reservedQuantity: number; // Reserved for pending orders

  @ApiProperty()
  @Column('int', { default: 0 })
  availableQuantity: number; // Calculated: quantity - reservedQuantity

  @ApiProperty()
  @Column('int', { default: 0 })
  minimumStock: number; // Reorder point

  @ApiProperty()
  @Column('int', { default: 0 })
  maximumStock: number;

  @ApiProperty()
  @Column({ nullable: true })
  location: string; // Warehouse/shelf location

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
  metadata?: Record<string, any>; // Additional inventory data

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
