import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, DeepPartial, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionItem } from './entities/transaction_item.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private transactionItemRepo: Repository<TransactionItem>,
    private readonly dataSource: DataSource,
  ) {}

  findAll() {
    return this.transactionRepo.find({
      order: { created_at: 'DESC' },
    });
  }

  findOne(id: number) {
    return this.transactionRepo.findOne({ where: { id } });
  }

  findItemsByTransaction(id: number) {
    return this.transactionItemRepo.find({
      where: { transaction_id: id },
      order: { id: 'ASC' },
    });
  }

  async create(dto: CreateTransactionDto) {
    if (!dto?.items?.length) {
      throw new BadRequestException('Minimal satu item transaksi diperlukan');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const total = Math.round(Number(dto.total ?? 0));
      const cashReceived = Math.round(Number(dto.cash_received ?? 0));
      const change = Math.round(Number(dto.change ?? 0));

      const transactionData: DeepPartial<Transaction> = {
        payment_method_id: dto.payment_method_id ?? 1,
        transaction_number:
          dto.transaction_number ??
          `TRX${Date.now().toString(36).toUpperCase()}`,
        name: dto.name ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        address: dto.address ?? null,
        notes: dto.notes ?? null,
        total,
        cash_received: cashReceived,
        change,
        status: dto.status ?? 'paid',
        status_offline: 'online',
      };

      const transaction = await manager.save(
        manager.create(Transaction, transactionData),
      );

      for (const item of dto.items) {
        const rawQuantity = Number(item.qty ?? 0);
        const quantity = Number.isFinite(rawQuantity) ? rawQuantity : 0;
        const price = Math.round(Number(item.price ?? 0));
        const subtotal = Math.round(Number(item.subtotal ?? quantity * price));

        const itemData: DeepPartial<TransactionItem> = {
          transaction_id: transaction.id,
          product_id: item.product_id,
          product_name_snapshot: item.product_name ?? null,
          quantity: quantity.toFixed(2),
          price,
          subtotal,
          cost_price: price,
          total_profit: subtotal - price * quantity,
        };

        await manager.save(manager.create(TransactionItem, itemData));

        if (item.product_id && quantity !== 0) {
          await manager
            .createQueryBuilder()
            .update(Product)
            .set({
              stock: () => 'stock - :qty',
              updated_at: () => 'CURRENT_TIMESTAMP',
            })
            .where('id = :productId', { productId: item.product_id })
            .setParameters({ qty: quantity })
            .execute();
        }
      }

      return transaction;
    });

    const items = await this.findItemsByTransaction(result.id);
    return { ...result, items };
  }
}
