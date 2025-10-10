import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionItem } from '../transactions/entities/transaction_item.entity';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Category, Transaction, TransactionItem]),
  ],
  controllers: [SyncController],
  providers: [SyncService],
})
export class SyncModule {}
