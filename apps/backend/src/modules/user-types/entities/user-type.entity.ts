import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('user_types')
export class UserType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  displayName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  permissions: Record<string, boolean>;

  @Column({ type: 'json', nullable: true })
  features: Record<string, boolean>;

  @Column({ type: 'json', nullable: true })
  onboardingSteps: Record<string, string>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
