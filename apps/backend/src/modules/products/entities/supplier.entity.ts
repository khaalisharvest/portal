import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';

@Entity('suppliers')
@Index(['isActive', 'isVerified']) // Composite index for performance
export class Supplier {
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
  @Column('text', { nullable: true })
  description: string;

  @ApiProperty()
  @Column()
  contactPerson: string;

  @ApiProperty()
  @Column()
  phone: string;

  @ApiProperty()
  @Column({ nullable: true })
  email: string;

  @ApiProperty()
  @Column('text')
  address: string;

  @ApiProperty()
  @Column()
  city: string;

  @ApiProperty()
  @Column()
  state: string;

  @ApiProperty()
  @Column()
  country: string;

  @ApiProperty()
  @Column({ nullable: true })
  postalCode: string;

  @ApiProperty()
  @Column({ nullable: true })
  website: string;

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  socialMedia: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  certifications: string[]; // Organic, ISO, etc.

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  specializations: string[]; // Fruits, Vegetables, Plants, etc.

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ default: false })
  isVerified: boolean;

  @ApiProperty()
  @Column({ default: 0 })
  rating: number;

  @ApiProperty()
  @Column({ default: 0 })
  reviewCount: number;

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>; // Additional supplier data

  // Relationships
  @OneToMany(() => Product, product => product.supplier)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
