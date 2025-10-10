import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'char', length: 36, unique: true })
  uuid: string;

  @Index()
  @Column({ type: 'bigint', unsigned: true })
  product_id: number;

  @Column('decimal', { precision: 10, scale: 2 })
  change_qty: number;

  @Column({ type: 'varchar', length: 100 })
  source: string;

  @Column({ type: 'char', length: 36, nullable: true })
  reference_uuid: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at: Date;
}
