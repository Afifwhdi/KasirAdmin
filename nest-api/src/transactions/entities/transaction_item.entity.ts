import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('transaction_items')
export class TransactionItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  transaction_id: number;

  @Column({ type: 'bigint', unsigned: true })
  product_id: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  product_name_snapshot: string | null;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  quantity: string;

  @Column({ type: 'int', unsigned: true })
  price: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  subtotal: number;

  @Column({ type: 'int', unsigned: true })
  cost_price: number;

  @Column({ type: 'int', unsigned: true })
  total_profit: number;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;
}
