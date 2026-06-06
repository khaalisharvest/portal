import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('activity_logs')
@Index(['staffId'])
@Index(['createdAt'])
@Index(['entityType', 'entityId'])
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  staffId: string;

  @Column()
  staffName: string;

  @Column()
  action: string;

  @Column()
  entityType: string;

  @Column({ nullable: true })
  entityId: string;

  @Column({ nullable: true })
  entityLabel: string;

  @Column({ type: 'json', nullable: true })
  details: Record<string, any>;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'staffId' })
  staff: User;

  @CreateDateColumn()
  createdAt: Date;
}
