import { isElectron, transactionService as electronTransactionService } from './electron-db';
import { 
  transactionsApi, 
  CreateTransactionData,
  TransactionsPaginationParams, 
  TransactionsPaginationResponse 
} from '@/features/transactions/services/api';

export const transactionsWrapper = {
  async getAll(params?: TransactionsPaginationParams): Promise<TransactionsPaginationResponse> {
    if (isElectron()) {
      // Mode Electron: pakai SQLite
      const transactions = await electronTransactionService.getAll();
      
      // Parse items JSON string
      const parsed = transactions.map((tx: any) => ({
        ...tx,
        items: typeof tx.items === 'string' ? JSON.parse(tx.items) : tx.items,
        transaction_number: tx.uuid,
        cash_received: tx.payment_amount,
      }));
      
      // Filter
      let filtered = parsed;
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = parsed.filter((tx: any) => 
          tx.uuid.toLowerCase().includes(search) ||
          tx.transaction_number.toLowerCase().includes(search)
        );
      }
      
      // Pagination
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      const total = filtered.length;
      const totalPages = Math.ceil(total / limit);
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = filtered.slice(start, end);
      
      return {
        status: 'success',
        message: 'Transactions loaded from local database',
        data: paginated,
        meta: {
          total,
          page,
          limit,
          totalPages
        }
      };
    } else {
      // Mode Browser: pakai API
      return transactionsApi.getAll(params);
    }
  },

  async create(data: CreateTransactionData) {
    if (isElectron()) {
      // Mode Electron: simpan ke SQLite
      const transaction = {
        uuid: data.transaction_number || crypto.randomUUID(),
        total: data.total,
        payment_method: data.payment_method_id === 1 ? 'cash' : 'qris',
        payment_amount: data.cash_received,
        change_amount: data.change_amount,
        items: data.items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name_snapshot,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        }))
      };
      
      const result = await electronTransactionService.create(transaction);
      
      return {
        status: 'success',
        message: 'Transaction created in local database',
        data: {
          id: result.lastInsertRowid,
          ...transaction,
          created_at: new Date().toISOString()
        }
      };
    } else {
      // Mode Browser: kirim ke API
      return transactionsApi.create(data);
    }
  },

  async getUnsynced() {
    if (isElectron()) {
      return electronTransactionService.getUnsynced();
    }
    return [];
  },

  async syncToServer() {
    if (!isElectron()) {
      throw new Error('Sync only available in Electron mode');
    }
    
    const unsynced = await electronTransactionService.getUnsynced();
    const synced = [];
    const failed = [];
    
    for (const tx of unsynced) {
      try {
        const items = typeof tx.items === 'string' ? JSON.parse(tx.items) : tx.items;
        
        await transactionsApi.create({
          transaction_number: tx.uuid,
          payment_method_id: tx.payment_method === 'cash' ? 1 : 2,
          total: tx.total,
          cash_received: tx.payment_amount,
          change_amount: tx.change_amount,
          items: items.map((item: any) => ({
            product_id: item.product_id,
            product_name_snapshot: item.product_name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            cost_price: 0,
            total_profit: 0
          }))
        });
        
        await electronTransactionService.markSynced(tx.id);
        synced.push(tx);
      } catch (error) {
        console.error('Failed to sync transaction:', tx.uuid, error);
        failed.push(tx);
      }
    }
    
    return { synced, failed };
  },

  async updateStatus(id: number, status: 'pending' | 'paid' | 'cancelled' | 'refunded') {
    if (isElectron()) {
      // SQLite doesn't have status field, skip for now
      console.warn('Update status not implemented for Electron SQLite');
      return { status: 'success', message: 'Status update not available in offline mode' };
    } else {
      return transactionsApi.updateStatus(id, status);
    }
  },

  async payBon(id: number, cashReceived: number, changeAmount: number) {
    if (isElectron()) {
      // SQLite doesn't support BON payment update
      console.warn('Pay BON not implemented for Electron SQLite');
      return { status: 'success', message: 'BON payment not available in offline mode' };
    } else {
      return transactionsApi.payBon(id, cashReceived, changeAmount);
    }
  },

  async getDetail(id: number) {
    if (isElectron()) {
      const tx = await electronTransactionService.getById(id);
      if (!tx) {
        throw new Error('Transaction not found');
      }
      
      return {
        status: 'success',
        message: 'Transaction detail loaded from local database',
        data: {
          ...tx,
          items: typeof tx.items === 'string' ? JSON.parse(tx.items) : tx.items,
          transaction_number: tx.uuid,
          cash_received: tx.payment_amount,
        }
      };
    } else {
      return transactionsApi.getDetail(id);
    }
  }
};
