import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  ARRAY = 'array'
}

export enum SettingCategory {
  GENERAL = 'general',
  INVENTORY = 'inventory',
  ORDERS = 'orders',
  DELIVERY = 'delivery',
  PAYMENT = 'payment',
  NOTIFICATIONS = 'notifications',
  UI = 'ui',
  SECURITY = 'security',
  PERFORMANCE = 'performance'
}

@Entity('settings')
@Index(['key'], { unique: true })
@Index(['category'])
@Index(['isActive'])
export class Setting {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ unique: true })
  key: string;

  @ApiProperty()
  @Column({ nullable: true })
  name: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty()
  @Column({ type: 'text' })
  value: string;

  @ApiProperty()
  @Column({ type: 'enum', enum: SettingType, nullable: true })
  type: SettingType;

  @ApiProperty()
  @Column({ type: 'enum', enum: SettingCategory, nullable: true })
  category: SettingCategory;

  @ApiProperty()
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty()
  @Column({ default: false })
  isRequired: boolean;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  validation?: string; // JSON string with validation rules

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  defaultValue?: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  options?: string; // JSON string with available options

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  helpText?: string;

  @ApiProperty()
  @Column({ default: 0 })
  sortOrder: number;

  @ApiProperty()
  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
