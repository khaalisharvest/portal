import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';
import { User } from '../../users/entities/user.entity';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

@Entity('reviews')
@Index(['productId', 'status'])   // fast public query: approved reviews per product
@Index(['userId', 'productId'], { unique: true }) // one review per user per product
@Index(['status', 'createdAt'])   // fast admin moderation queue
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
  rating: number;

  @ApiProperty()
  @Column('text', { nullable: true })
  title: string;

  @ApiProperty()
  @Column('text', { nullable: true })
  comment: string;

  @ApiProperty()
  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: ReviewStatus;

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ default: false })
  isVerified: boolean; // auto-set: true when user has a delivered order for this product

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
