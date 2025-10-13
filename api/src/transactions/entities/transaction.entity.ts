import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: number;

  @Column({ type: 'bigint', unsigned: true })
  payment_method_id!: number;

  @Column({ type: 'varchar', length: 255 })
  transaction_number!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'int', unsigned: true })
  total!: number;

  @Column({ type: 'int', unsigned: true })
  cash_received!: number;

  // ✅ Gunakan nama kolom sesuai DB
  @Column({ type: 'int', unsigned: true, name: 'change_amount' })
  change_amount!: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'paid', 'cancelled', 'refunded'],
    default: 'paid',
  })
  status!: 'pending' | 'paid' | 'cancelled' | 'refunded';

  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deleted_at?: Date | null;
}
