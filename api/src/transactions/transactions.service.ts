import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionItem } from './entities/transaction_item.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { Product } from '../products/entities/product.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepo: Repository<TransactionItem>,
    @InjectRepository(PaymentMethod)
    private readonly paymentMethodRepo: Repository<PaymentMethod>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(query?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.transactionRepo
      .createQueryBuilder('trx')
      .leftJoinAndSelect(
        'payment_methods',
        'pm',
        'trx.payment_method_id = pm.id',
      )
      .select([
        'trx.id AS id',
        'trx.transaction_number AS transaction_number',
        'trx.name AS name',
        'trx.total AS total',
        'trx.cash_received AS cash_received',
        'trx.change_amount AS change_amount',
        'trx.created_at AS created_at',
        'trx.status AS status',
        'trx.payment_method_id AS payment_method_id',
        'pm.name AS payment_method_name',
      ]);

    // Search filter
    if (query?.search) {
      queryBuilder.where(
        'trx.transaction_number LIKE :search OR trx.id LIKE :search',
        { search: `%${query.search}%` },
      );
    }

    // Status filter
    if (query?.status) {
      queryBuilder.andWhere('trx.status = :status', { status: query.status });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    interface RawTransactionRow {
      id: number;
      transaction_number: string;
      name: string | null;
      total: number;
      cash_received: number;
      change_amount: number;
      created_at: Date;
      status: string;
      payment_method_id: number;
      payment_method_name: string | null;
    }

    const rows = await queryBuilder
      .orderBy('trx.created_at', 'DESC')
      .limit(limit)
      .offset(skip)
      .getRawMany<RawTransactionRow>();

    const data = rows.map((row) => ({
      id: row.id,
      transaction_number: row.transaction_number,
      nama_customer: row.name || 'Umum',
      total_harga: row.total,
      nominal_bayar: row.cash_received,
      kembalian: row.change_amount,
      transaksi_dibuat: row.created_at,
      pembayaran: row.payment_method_name || 'Tidak Diketahui',
      status:
        row.status === 'paid'
          ? 'Lunas'
          : row.status === 'pending'
            ? 'Menunggu'
            : row.status === 'cancelled'
              ? 'Dibatalkan'
              : 'Refund',
    }));

    return {
      status: 'success',
      message: 'Transaksi retrieved successfully',
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const trx = await this.transactionRepo.findOne({
      where: { id },
    });
    if (!trx) throw new BadRequestException('Transaksi tidak ditemukan');

    const paymentMethod = await this.paymentMethodRepo.findOne({
      where: { id: trx.payment_method_id },
    });

    const items = await this.transactionItemRepo.find({
      where: { transaction_id: id },
      order: { id: 'ASC' },
    });

    return {
      status: 'success',
      message: 'Transaksi details retrieved successfully',
      data: {
        id: trx.id,
        transaction_number: trx.transaction_number,
        total_harga: trx.total,
        nominal_bayar: trx.cash_received,
        kembalian: trx.change_amount,
        transaksi_dibuat: trx.created_at,
        pembayaran: paymentMethod?.name || 'Tidak Diketahui',
        status:
          trx.status === 'paid'
            ? 'Lunas'
            : trx.status === 'pending'
              ? 'Menunggu'
              : trx.status === 'cancelled'
                ? 'Dibatalkan'
                : 'Refund',
        pelanggan: {
          nama: trx.name || 'Umum',
        },
        items,
      },
    };
  }

  async create(dto: CreateTransactionDto) {
    console.log(`[CREATE] Incoming transaction: ${dto.transaction_number}, status: ${dto.status}`);
    
    // CRITICAL: Check if transaction exists FIRST, outside transaction scope
    let existingTransaction = await this.transactionRepo.findOne({
      where: { transaction_number: dto.transaction_number },
    });

    console.log(`[CREATE] Existing transaction found: ${!!existingTransaction}`);
    if (existingTransaction) {
      console.log(`[CREATE] Will UPDATE transaction ID: ${existingTransaction.id}, current status: ${existingTransaction.status}`);
    } else {
      console.log(`[CREATE] Will CREATE new transaction`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // If exists, lock it for update within transaction
      if (existingTransaction) {
        existingTransaction = await queryRunner.manager
          .createQueryBuilder(Transaction, 'trx')
          .where('trx.transaction_number = :transaction_number', {
            transaction_number: dto.transaction_number,
          })
          .setLock('pessimistic_write')
          .getOne();
      }

      let savedTransaction: Transaction;

      if (existingTransaction) {
        existingTransaction.payment_method_id = dto.payment_method_id;
        existingTransaction.name = dto.name || 'Umum';
        existingTransaction.total = dto.total;
        existingTransaction.cash_received = dto.cash_received;
        existingTransaction.change_amount = dto.change_amount;
        existingTransaction.status = dto.status || existingTransaction.status;
        existingTransaction.updated_at = new Date();

        savedTransaction = await queryRunner.manager.save(
          Transaction,
          existingTransaction,
        );

        await queryRunner.manager.delete(TransactionItem, {
          transaction_id: savedTransaction.id,
        });
      } else {
        const transaction = this.transactionRepo.create({
          payment_method_id: dto.payment_method_id,
          transaction_number: dto.transaction_number,
          name: dto.name || 'Umum',
          total: dto.total,
          cash_received: dto.cash_received,
          change_amount: dto.change_amount,
          status: dto.status || 'paid',
          created_at: new Date(),
          updated_at: new Date(),
        });

        savedTransaction = await queryRunner.manager.save(
          Transaction,
          transaction,
        );
      }

      for (const item of dto.items) {
        const transactionItem = this.transactionItemRepo.create({
          transaction_id: savedTransaction.id,
          product_id: item.product_id,
          product_name_snapshot: item.product_name_snapshot ?? null,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal ?? Math.round(item.price * item.quantity),
          cost_price: item.cost_price ?? 0,
          total_profit: item.total_profit ?? 0,
        });

        await queryRunner.manager.save(TransactionItem, transactionItem);
        
        // CRITICAL: Only decrement stock on NEW transaction, not on UPDATE
        if (!existingTransaction) {
          await queryRunner.manager.decrement(
            Product,
            { id: item.product_id },
            'stock',
            item.quantity,
          );
        }
      }

      await queryRunner.commitTransaction();

      return {
        status: 'success',
        message: existingTransaction ? 'Transaction updated successfully' : 'Transaction created successfully',
        data: {
          id: savedTransaction.id,
          transaction_number: savedTransaction.transaction_number,
          total: savedTransaction.total,
          updated: !!existingTransaction,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      throw new BadRequestException('Failed to create transaction: ' + message);
    } finally {
      await queryRunner.release();
    }
  }

  async updateStatus(
    id: number,
    status: 'pending' | 'paid' | 'cancelled' | 'refunded',
  ) {
    const transaction = await this.transactionRepo.findOne({
      where: { id },
    });
    if (!transaction) {
      throw new BadRequestException('Transaksi tidak ditemukan');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      transaction.status = status;
      transaction.updated_at = new Date();
      await queryRunner.manager.save(Transaction, transaction);

      if (status === 'refunded') {
        const transactionItems = await this.transactionItemRepo.find({
          where: { transaction_id: id },
        });

        for (const item of transactionItems) {
          await queryRunner.manager.increment(
            Product,
            { id: item.product_id },
            'stock',
            item.quantity,
          );
        }
      }

      await queryRunner.commitTransaction();

      return {
        status: 'success',
        message:
          status === 'refunded'
            ? 'Transaksi berhasil direfund dan stock dikembalikan'
            : 'Status transaksi berhasil diupdate',
        data: {
          id: transaction.id,
          status: transaction.status,
        },
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      const message =
        error instanceof Error ? error.message : JSON.stringify(error);
      throw new BadRequestException('Failed to update status: ' + message);
    } finally {
      await queryRunner.release();
    }
  }

  async payBon(id: number, cashReceived: number, changeAmount: number) {
    const transaction = await this.transactionRepo.findOne({
      where: { id },
    });
    if (!transaction) {
      throw new BadRequestException('Transaksi tidak ditemukan');
    }

    if (transaction.status !== 'pending') {
      throw new BadRequestException(
        'Hanya transaksi pending yang bisa dibayar',
      );
    }

    transaction.status = 'paid';
    transaction.cash_received = cashReceived;
    transaction.change_amount = changeAmount;
    transaction.updated_at = new Date();

    await this.transactionRepo.save(transaction);

    return {
      status: 'success',
      message: 'Pembayaran BON berhasil dicatat',
      data: {
        id: transaction.id,
        status: transaction.status,
        cash_received: transaction.cash_received,
        change_amount: transaction.change_amount,
      },
    };
  }
}
