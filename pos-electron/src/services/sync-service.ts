import { isElectron, productService, categoryService } from './electron-db';
import { productsApi } from '@/features/products/services/api';
import { API_CONFIG, API_ENDPOINTS } from '@/config/api';

export type ProgressCallback = (progress: {
  type: 'products' | 'categories' | 'transactions';
  current: number;
  total: number;
  percentage: number;
  currentItem?: string;
  synced: number;
  failed: number;
}) => void;

export const syncService = {
  /**
   * Sync products dari server ke SQLite lokal
   */
  async syncProductsFromServer(onProgress?: ProgressCallback) {
    if (!isElectron()) {
      throw new Error('Sync only available in Electron mode');
    }

    const synced = [];
    const failed = [];
    let page = 1;
    const limit = 100;
    let totalProcessed = 0;
    let totalProducts = 0;

    try {
      // Fetch semua produk dari server
      while (true) {
        const response = await productsApi.getAll({ page, limit });
        
        if (!response.data || response.data.length === 0) {
          break;
        }

        // Set total from first response
        if (page === 1 && response.meta) {
          totalProducts = response.meta.total;
        }

        // Insert/Update ke SQLite
        for (const product of response.data) {
          totalProcessed++;
          
          // Report progress
          if (onProgress) {
            onProgress({
              type: 'products',
              current: totalProcessed,
              total: totalProducts || response.data.length,
              percentage: totalProducts ? (totalProcessed / totalProducts) * 100 : 0,
              currentItem: product.name,
              synced: synced.length,
              failed: failed.length
            });
          }
          try {
            // Check apakah produk sudah ada (by ID atau unique identifier)
            const existing = await productService.getById(product.id);
            
            if (existing) {
              // Update
              await productService.update(product.id, {
                name: product.name,
                price: product.price,
                stock: product.stock || 0,
                category: product.category_id?.toString() || '',
                image: product.image || '',
                barcode: product.barcode || '',
              });
            } else {
              // Insert
              await productService.create({
                uuid: product.uuid || crypto.randomUUID(),
                name: product.name,
                price: product.price,
                stock: product.stock || 0,
                category: product.category_id?.toString() || '',
                image: product.image || '',
                barcode: product.barcode || '',
              });
            }
            
            synced.push(product);
          } catch (error) {
            console.error('Failed to sync product:', product.id, error);
            failed.push(product);
          }
        }

        // Check jika masih ada page berikutnya
        if (response.meta && page >= response.meta.totalPages) {
          break;
        }
        
        page++;
      }

      return { synced, failed };
    } catch (error) {
      console.error('Sync products error:', error);
      throw error;
    }
  },

  /**
   * Sync categories dari server ke SQLite lokal
   */
  async syncCategoriesFromServer(onProgress?: ProgressCallback) {
    if (!isElectron()) {
      throw new Error('Sync only available in Electron mode');
    }

    const synced = [];
    const failed = [];

    try {
      // Fetch categories dari server
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CATEGORIES}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch categories from server');
      }

      const data = await response.json();
      const categories = data.data || [];
      const totalCategories = categories.length;

      // Insert ke SQLite
      let processed = 0;
      for (const category of categories) {
        processed++;
        
        // Report progress
        if (onProgress) {
          onProgress({
            type: 'categories',
            current: processed,
            total: totalCategories,
            percentage: (processed / totalCategories) * 100,
            currentItem: category.name,
            synced: synced.length,
            failed: failed.length
          });
        }
        try {
          await categoryService.create({
            uuid: category.uuid || crypto.randomUUID(),
            name: category.name,
          });
          synced.push(category);
        } catch (error) {
          // Skip jika sudah ada (UNIQUE constraint)
          if (error.message && error.message.includes('UNIQUE')) {
            synced.push(category);
          } else {
            console.error('Failed to sync category:', category.id, error);
            failed.push(category);
          }
        }
      }

      return { synced, failed };
    } catch (error) {
      console.error('Sync categories error:', error);
      throw error;
    }
  },

  /**
   * Sync transactions dari server ke SQLite lokal
   */
  async syncTransactionsFromServer(onProgress?: ProgressCallback) {
    if (!isElectron()) {
      throw new Error('Sync only available in Electron mode');
    }

    const synced = [];
    const failed = [];

    try {
      // Fetch transactions dari server
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTIONS}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions from server');
      }

      const data = await response.json();
      const transactions = data.data || [];
      const totalTransactions = transactions.length;

      // Insert ke SQLite
      let processed = 0;
      for (const transaction of transactions) {
        processed++;
        
        // Report progress
        if (onProgress) {
          onProgress({
            type: 'transactions',
            current: processed,
            total: totalTransactions,
            percentage: (processed / totalTransactions) * 100,
            currentItem: `Transaksi #${transaction.transaction_code || transaction.id}`,
            synced: synced.length,
            failed: failed.length
          });
        }

        try {
          // Insert transaction ke sync_queue
          // Map API response to local DB structure
          await transactionService.create({
            uuid: transaction.uuid || crypto.randomUUID(),
            transaction_code: transaction.transaction_code,
            total: transaction.total || transaction.grand_total,
            payment_method: transaction.payment_method || 'CASH',
            items: JSON.stringify(transaction.items || transaction.transaction_items || []),
            synced_at: new Date().toISOString(),
            created_at: transaction.created_at || new Date().toISOString(),
          });
          
          synced.push(transaction);
        } catch (error) {
          console.error('Failed to insert transaction:', transaction, error);
          // Don't fail the whole process, just skip this transaction
          failed.push({ transaction, error: (error as Error).message });
        }
      }

      return { synced, failed };
    } catch (error) {
      console.error('Sync transactions error:', error);
      throw error;
    }
  },

  /**
   * Sync semua data (products + categories + transactions)
   */
  async syncAllFromServer(onProgress?: ProgressCallback) {
    if (!isElectron()) {
      throw new Error('Sync only available in Electron mode');
    }

    const results = {
      products: { synced: [], failed: [] },
      categories: { synced: [], failed: [] },
      transactions: { synced: [], failed: [] },
    };

    // Sync categories first
    try {
      const catResult = await this.syncCategoriesFromServer(onProgress);
      results.categories = catResult;
    } catch (error) {
      console.error('Failed to sync categories:', error);
    }

    // Then sync products
    try {
      const prodResult = await this.syncProductsFromServer(onProgress);
      results.products = prodResult;
    } catch (error) {
      console.error('Failed to sync products:', error);
    }

    // Finally sync transactions
    try {
      const txResult = await this.syncTransactionsFromServer(onProgress);
      results.transactions = txResult;
    } catch (error) {
      console.error('Failed to sync transactions:', error);
    }

    return results;
  },

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    if (!isElectron()) {
      throw new Error('Stats only available in Electron mode');
    }

    const products = await productService.getAll();
    const categories = await categoryService.getAll();

    return {
      totalProducts: products.length,
      totalCategories: categories.length,
      dbPath: await window.electronAPI!.app.getDbPath(),
    };
  },
};
