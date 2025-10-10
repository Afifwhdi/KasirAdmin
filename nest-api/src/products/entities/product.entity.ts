import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  category_id: number;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  stock: string;

  @Column({ type: 'int', unsigned: true })
  cost_price: number;

  @Column({ type: 'int', unsigned: true })
  price: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image: string | null;

  @Column({ type: 'varchar', length: 191, nullable: true })
  sku: string | null;

  @Column({ type: 'varchar', length: 191, nullable: true })
  barcode: string;

  @Column({ type: 'tinyint', width: 1, default: 0 })
  is_plu_enabled: boolean;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'tinyint', width: 1, default: 1 })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', name: 'deleted_at', nullable: true })
  deleted_at: Date;
}
