import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index, ManyToOne, JoinColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../products/entities/category.entity';

@Entity('product_types')
@Index(['isActive', 'sortOrder']) // Composite index for active product types
@Index(['name']) // Index for product type name lookups
export class ProductType {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  name: string;

  @ApiProperty()
  @Column()
  displayName: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  specifications?: {
    fields: Array<{
      id: string;
      name: string;
      label: string;
      type: 'text' | 'number' | 'email' | 'url' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime' | 'color' | 'range' | 'file';
      required: boolean;
      placeholder?: string;
      description?: string;
      options?: Array<{ label: string; value: string }>;
      min?: number;
      max?: number;
      step?: number;
      rows?: number;
      accept?: string;
      validation?: {
        pattern?: string;
        message?: string;
      };
      category?: string;
    }>;
  };

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  pricing?: {
    primaryMethod: 'weight' | 'volume' | 'quantity' | 'size';
    hasWeight: boolean;
    hasVolume: boolean;
    hasQuantity: boolean;
    hasSize: boolean;
    units: string[];
  };

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  requirements?: {
    needsImages: boolean;
    needsCertification: boolean;
    needsLocation: boolean;
    needsExpiryDate: boolean;
    needsBatchNumber: boolean;
    minImages: number;
    maxImages: number;
  };


  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ default: 0 })
  sortOrder: number;

  @ApiProperty()
  @Column({ nullable: true })
  icon?: string;

  @ApiProperty()
  @Column({ nullable: true })
  color?: string;

  // Relationships
  @ApiProperty({ required: true })
  @ManyToOne(() => Category, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ApiProperty()
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
