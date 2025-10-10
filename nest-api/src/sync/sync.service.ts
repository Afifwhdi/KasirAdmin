import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, DeepPartial } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { Category } from '../categories/entities/category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionItem } from '../transactions/entities/transaction_item.entity';
import { FullSyncQueryDto, FullSyncResponseDto } from './dto/full-sync.dto';
import { UploadTransactionsDto } from './dto/upload-transactions.dto';
import { UploadStockChangesDto } from './dto/upload-stock.dto';

@Injectable()
export class SyncService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(TransactionItem)
    private readonly transactionItemRepo: Repository<TransactionItem>,
    private readonly dataSource: DataSource,
  ) {}

  private parseVersion(value?: string | number): Date | null {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) {
      return new Date(numeric);
    }
    return null;
  }

  private asVersionNumber(value?: Date | string | null): number {
    if (!value) return 0;
    const timestamp =
      value instanceof Date ? value.getTime() : new Date(value).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  async getFullSync(query: FullSyncQueryDto): Promise<FullSyncResponseDto> {
    const productSince = this.parseVersion(query.productVersion);
    const categorySince = this.parseVersion(query.categoryVersion);

    const productQuery = this.productRepo
      .createQueryBuilder('product')
      .withDeleted();

    if (productSince) {
      productQuery.where(
        '(product.updated_at IS NOT NULL AND product.updated_at > :since) OR (product.deleted_at IS NOT NULL AND product.deleted_at > :since)',
        { since: productSince },
      );
    }

    const products = await productQuery.getMany();

    const categoryQuery = this.categoryRepo
      .createQueryBuilder('category')
      .withDeleted();

    if (categorySince) {
      categoryQuery.where(
        '(category.updated_at IS NOT NULL AND category.updated_at > :since) OR (category.deleted_at IS NOT NULL AND category.deleted_at > :since)',
        { since: categorySince },
      );
    }

    const categories = await categoryQuery.getMany();

    const maxProductUpdatedRaw = await this.productRepo
      .createQueryBuilder('product')
      .select('MAX(product.updated_at)', 'max')
      .getRawOne<{ max: Date | string | null }>();

    const maxCategoryUpdatedRaw = await this.categoryRepo
      .createQueryBuilder('category')
      .select('MAX(category.updated_at)', 'max')
      .getRawOne<{ max: Date | string | null }>();

    return {
      products: products.map((product) => ({
        id: product.id,
        category_id: product.category_id,
        name: product.name,
        barcode: product.barcode,
        price: product.price,
        cost_price: product.cost_price,
        stock: product.stock,
        image: product.image,
        sku: product.sku,
        is_plu_enabled: Boolean(product.is_plu_enabled),
        description: product.description,
        is_active: Boolean(product.is_active),
        version: this.asVersionNumber(product.updated_at),
        updated_at: product.updated_at ?? null,
        deleted_at: product.deleted_at ?? null,
      })),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        version: this.asVersionNumber(category.updated_at),
        updated_at: category.updated_at ?? null,
        deleted_at: category.deleted_at ?? null,
      })),
      removedProductIds: products
        .filter((product) => !!product.deleted_at)
        .map((product) => product.id),
      removedCategoryIds: categories
        .filter((category) => !!category.deleted_at)
        .map((category) => category.id),
      meta: {
        productVersion: this.asVersionNumber(maxProductUpdatedRaw?.max ?? null),
        categoryVersion: this.asVersionNumber(
          maxCategoryUpdatedRaw?.max ?? null,
        ),
      },
    };
  }

  async uploadTransactions(dto: UploadTransactionsDto) {
    if (!dto.transactions?.length) {
      throw new BadRequestException('transactions array is required');
    }

    const synced: string[] = [];

    for (const transaction of dto.transactions) {
      const offlineId = transaction.uuid;
      if (!offlineId) {
        continue;
      }

      const exists = await this.transactionRepo.findOne({
        where: { offline_id: offlineId },
      });
      if (exists) {
        synced.push(offlineId);
        continue;
      }

      const createdAt = transaction.created_at
        ? new Date(transaction.created_at)
        : new Date();

      await this.dataSource.transaction(async (manager) => {
        const total = Math.round(Number(transaction.total ?? 0));
        const cashReceived = Math.round(Number(transaction.cash_received ?? 0));
        const change = Math.round(Number(transaction.change ?? 0));

        const transactionData: DeepPartial<Transaction> = {
          offline_id: offlineId,
          transaction_number:
            transaction.transaction_number ??
            `TRX${offlineId.slice(0, 8).toUpperCase()}`,
          name: transaction.customer_name ?? null,
          total,
          cash_received: cashReceived,
          change,
          notes: transaction.notes ?? null,
          payment_method_id: transaction.payment_method_id ?? 1,
          status: 'paid',
          status_offline: 'synced',
          created_at: createdAt,
          updated_at: createdAt,
        };

        const savedTransaction = await manager.save(
          manager.create(Transaction, transactionData),
        );

        for (const item of transaction.items ?? []) {
          const rawQuantity = Number(item.quantity ?? 0);
          const quantity = Number.isFinite(rawQuantity) ? rawQuantity : 0;
          const price = Math.round(Number(item.price ?? 0));
          const subtotal =
            item.subtotal !== undefined
              ? Math.round(Number(item.subtotal))
              : Math.round(quantity * price);

          const itemData: DeepPartial<TransactionItem> = {
            transaction_id: savedTransaction.id,
            product_id: item.product_id,
            product_name_snapshot: item.product_name ?? null,
            quantity: quantity.toFixed(2),
            price,
            subtotal,
            cost_price: price,
            total_profit: 0,
          };

          await manager.save(manager.create(TransactionItem, itemData));

          if (item.product_id) {
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
      });

      synced.push(offlineId);
    }

    return { synced };
  }

  async uploadStockChanges(dto: UploadStockChangesDto) {
    if (!dto.stock_changes?.length) {
      throw new BadRequestException('stock_changes array is required');
    }

    const synced: string[] = [];

    for (const change of dto.stock_changes) {
      const uuid = change.uuid;
      if (!uuid || change.product_id == null) {
        continue;
      }

      const delta = Number(change.change_qty ?? 0);
      if (!Number.isFinite(delta) || delta === 0) {
        synced.push(uuid);
        continue;
      }

      await this.productRepo
        .createQueryBuilder()
        .update()
        .set({
          stock: () => 'stock + :delta',
          updated_at: () => 'CURRENT_TIMESTAMP',
        })
        .where('id = :productId', { productId: change.product_id })
        .setParameters({ delta })
        .execute();

      synced.push(uuid);
    }

    return { synced };
  }
}
