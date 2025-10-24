import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index, Check } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsPhoneNumber, IsEnum, IsOptional, IsBoolean, IsString, MinLength, MaxLength, IsNumber, Min, Max } from 'class-validator';
import { Order } from '../../orders/entities/order.entity';
import { Address } from '../../orders/entities/address.entity';
import { Review } from '../../products/entities/review.entity';
import { Wishlist } from '../../products/entities/wishlist.entity';

@Entity('users')
@Index(['role', 'isActive']) // Composite index for user filtering
@Index(['phone']) // Index for phone lookups
@Index(['email']) // Index for email lookups
@Index(['lastLoginAt']) // Index for login tracking
@Check(`"loginAttempts" >= 0 AND "loginAttempts" <= 10`) // Login attempts constraint
@Check(`"role" IN ('customer', 'admin', 'super_admin')`) // Role constraint
export class User {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty()
  @Column({ unique: true })
  phone: string;

  @ApiProperty()
  @Column({ nullable: true, unique: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @Column()
  password: string;

  @ApiProperty()
  @Column({ 
    type: 'enum', 
    enum: ['customer', 'admin', 'super_admin'],
    default: 'customer' 
  })
  role: string;

  @ApiProperty()

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ nullable: true })
  profileImage?: string;

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  @IsOptional()
  address?: {
    street?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    coordinates?: { lat: number; lng: number };
  };

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  @IsOptional()
  preferences?: {
    language?: string;
    notifications?: boolean;
    deliveryTime?: string;
  };

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  @IsOptional()
  verification?: {
    isVerified: boolean;
    verifiedAt?: Date;
    verificationMethod?: string;
  };

  @ApiProperty()
  @Column({ nullable: true })
  lastLoginAt?: Date;

  @ApiProperty()
  @Column({ default: 0 })
  loginAttempts: number;

  @ApiProperty()
  @Column({ nullable: true })
  lockedUntil?: Date;

  // Relationships
  @OneToMany(() => Order, order => order.user)
  orders: Order[];

  @OneToMany(() => Address, address => address.user)
  addresses: Address[];

  @OneToMany(() => Review, review => review.user)
  reviews: Review[];

  @OneToMany(() => Wishlist, wishlist => wishlist.user)
  wishlists: Wishlist[];

  // @OneToMany(() => Analytics, analytics => analytics.user)
  // analytics: Analytics[];

  // @OneToMany(() => Notification, notification => notification.user)
  // notifications: Notification[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
