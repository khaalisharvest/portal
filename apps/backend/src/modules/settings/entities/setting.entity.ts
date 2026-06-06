import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  ARRAY = 'array',
}

@Entity('settings')
@Index(['key'], { unique: true })
@Index(['category'])
@Index(['isActive'])
export class Setting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  key: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text' })
  value: string;

  @Column({ type: 'enum', enum: SettingType, nullable: true })
  type: SettingType;

  @Column({ default: 'system' })
  category: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: false })
  isRequired: boolean;

  @Column({ type: 'text', nullable: true })
  validation?: string;

  @Column({ type: 'text', nullable: true })
  defaultValue?: string;

  @Column({ type: 'text', nullable: true })
  options?: string;

  @Column({ type: 'text', nullable: true })
  helpText?: string;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'json', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
