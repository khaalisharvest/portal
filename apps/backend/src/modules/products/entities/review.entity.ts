import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
@Index(['productId', 'isActive']) // Composite index for performance
@Index(['userId', 'productId'], { unique: true }) // One review per user per product
export class Review {
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
  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty()
  @Column('int', { default: 5 })
  rating: number; // 1-5 stars

  @ApiProperty()
  @Column('text', { nullable: true })
  title: string;

  @ApiProperty()
  @Column('text', { nullable: true })
  comment: string;

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  images: string[]; // Review images

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  pros: string[]; // What they liked

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  cons: string[]; // What they didn't like

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ default: false })
  isVerified: boolean; // Verified purchase

  @ApiProperty()
  @Column({ default: 0 })
  helpfulCount: number; // How many found this helpful

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>; // Additional review data

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
