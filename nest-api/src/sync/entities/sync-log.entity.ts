import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type SyncLogType = 'upload' | 'download';
export type SyncLogStatus = 'success' | 'error';

@Entity('sync_logs')
export class SyncLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: 'varchar', length: 20 })
  type: SyncLogType;

  @Column({ type: 'varchar', length: 20 })
  status: SyncLogStatus;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'json', nullable: true })
  payload?: Record<string, any>;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
