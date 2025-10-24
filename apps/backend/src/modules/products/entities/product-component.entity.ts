import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('product_components')
@Unique(['parentProductId', 'childProductId'])
@Index(['parentProductId'])
@Index(['childProductId'])
export class ProductComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  parentProductId: string;

  @ManyToOne(() => Product, product => product.components, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentProductId' })
  parentProduct: Product;

  @Column()
  childProductId: string;

  @ManyToOne(() => Product, product => product.usedInBundles, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'childProductId' })
  childProduct: Product;

  @Column('int', { default: 1 })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


