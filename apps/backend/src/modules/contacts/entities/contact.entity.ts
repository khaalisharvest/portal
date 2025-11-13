import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('contacts')
@Index(['status', 'createdAt'])
@Index(['email'])
export class Contact {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column()
  email: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  phone?: string;

  @ApiProperty()
  @Column()
  subject: string;

  @ApiProperty()
  @Column({ type: 'text' })
  message: string;

  @ApiProperty({ enum: ['pending', 'read', 'replied', 'archived'], default: 'pending' })
  @Column({
    type: 'enum',
    enum: ['pending', 'read', 'replied', 'archived'],
    default: 'pending',
  })
  status: 'pending' | 'read' | 'replied' | 'archived';

  @ApiProperty({ required: false })
  @Column({ type: 'text', nullable: true })
  adminResponse?: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  respondedBy?: string; // Admin user ID who responded

  @ApiProperty({ required: false })
  @Column({ type: 'timestamp', nullable: true })
  respondedAt?: Date;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}

