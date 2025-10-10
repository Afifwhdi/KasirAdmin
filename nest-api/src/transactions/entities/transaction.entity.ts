import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  payment_method_id: number;

  @Column({ type: 'varchar', length: 255 })
  transaction_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'int', unsigned: true })
  total: number;

  @Column({ type: 'int', unsigned: true })
  cash_received: number;

  @Column({ type: 'int', unsigned: true })
  change: number;

  @CreateDateColumn({ type: 'timestamp', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updated_at: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  idempotency_key: string | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'cancelled', 'refunded'],
    default: 'paid',
  })
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';

  @Column({ type: 'char', length: 36, nullable: true })
  offline_id: string | null;

  @Column({ type: 'varchar', length: 255, default: 'pending_sync' })
  status_offline: string;
}
