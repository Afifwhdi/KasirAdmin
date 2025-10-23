import { isElectron, productService, categoryService, transactionService } from "./electron-db";
import { productsApi } from "@/features/products/services/api";
import { API_CONFIG, API_ENDPOINTS } from "@/config/api";
import { authService } from "./auth-service";

export type ProgressCallback = (progress: {
  type: "products" | "categories" | "transactions";
  current: number;
  total: number;
  percentage: number;
  currentItem?: string;
  synced: number;
  failed: number;
}) => void;

const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 30000; // 30 seconds
const MAX_PAGES = 100; // Safety limit untuk prevent infinite loop

async function fetchWithTimeout(url: string, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const authHeaders = authService.getAuthHeader();

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export const syncService = {
  /**
   * Sync products dari server ke SQLite lokal
   */
  async syncProductsFromServer(onProgress?: ProgressCallback) {
    if (!isElectron()) {
      throw new Error("Sync only available in Electron mode");
    }

    const synced = [];
    const failed = [];
    let page = 1;
    const limit = 50; // Reduced batch size untuk better memory management
    let totalProcessed = 0;
    let totalProducts = 0;

    try {

      while (page <= MAX_PAGES) {
        let response;
        let retries = 0;


        while (retries < MAX_RETRIES) {
          try {
            response = await productsApi.getAll({ page, limit });
            break;
          } catch (error) {
            retries++;
            if (retries >= MAX_RETRIES) {
              throw new Error(
                `Failed to fetch products after ${MAX_RETRIES} retries: ${error.message}`
              );
            }


            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000));
          }
        }

        if (!response || !response.data || response.data.length === 0) {
          break;
        }


        if (page === 1 && response.meta) {
          totalProducts = response.meta.total;
        }


        for (const product of response.data) {
          totalProcessed++;


          if (onProgress) {
            onProgress({
              type: "products",
              current: totalProcessed,
              total: totalProducts || response.data.length,
              percentage: totalProducts ? (totalProcessed / totalProducts) * 100 : 0,
              currentItem: product.name,
              synced: synced.length,
              failed: failed.length,
            });
          }

          try {

            const productUuid = product.id?.toString() || product.uuid || crypto.randomUUID();
            

            const existing = await productService.getByUuid(productUuid);

            const productData = {
              name: product.name,
              price: product.price,
              stock: product.stock || 0,
              category: product.category_id?.toString() || "",
              image: product.image || "",
              barcode: product.barcode || "",
            };

            if (existing) {

              await productService.update(existing.id, productData);
            } else {

              await productService.create({
                uuid: productUuid,
                ...productData,
              });
            }

            synced.push(product);
          } catch (error) {
            failed.push({ id: product.id, error: error.message });
          }
        }


        if (response.meta && page >= response.meta.totalPages) {
          break;
        }


        if (!response.meta?.totalPages && page >= 10) {
          break;
        }

        page++;
      }


      
      return { synced, failed };
    } catch (error) {
      throw new Error(`Sync failed: ${error.message}`);
    }
  },

  /**
   * Sync categories dari server ke SQLite lokal
   */
  async syncCategoriesFromServer(onProgress?: ProgressCallback) {
    if (!isElectron()) {
      throw new Error("Sync only available in Electron mode");
    }

    const synced = [];
    const failed = [];

    try {

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CATEGORIES}`);

      if (!response.ok) {
        throw new Error("Failed to fetch categories from server");
      }

      const data = await response.json();
      const categories = data.data || [];
      const totalCategories = categories.length;


      let processed = 0;
      for (const category of categories) {
        processed++;


        if (onProgress) {
          onProgress({
            type: "categories",
            current: processed,
            total: totalCategories,
            percentage: (processed / totalCategories) * 100,
            currentItem: category.name,
            synced: synced.length,
            failed: failed.length,
          });
        }
        try {
          const existing = await categoryService.getByName(category.name);
          
          if (!existing) {
            await categoryService.create({
              uuid: category.uuid || crypto.randomUUID(),
              name: category.name,
            });
          }
          
          synced.push(category);
        } catch (error) {
          failed.push(category);
        }
      }

      return { synced, failed };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sync transactions dari server ke SQLite lokal
   */
  async syncTransactionsFromServer(onProgress?: ProgressCallback) {
    if (!isElectron()) {
      throw new Error("Sync only available in Electron mode");
    }

    const synced = [];
    const failed = [];

    try {

      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTIONS}`);

      if (!response.ok) {
        throw new Error("Failed to fetch transactions from server");
      }

      const data = await response.json();
      const transactions = data.data || [];
      const totalTransactions = transactions.length;


      let processed = 0;
      for (const transaction of transactions) {
        processed++;


        if (onProgress) {
          onProgress({
            type: "transactions",
            current: processed,
            total: totalTransactions,
            percentage: (processed / totalTransactions) * 100,
            currentItem: `Transaksi #${transaction.transaction_code || transaction.id}`,
            synced: synced.length,
            failed: failed.length,
          });
        }

        try {

          const uuid = transaction.transaction_number || transaction.uuid || crypto.randomUUID();
          const existing = await transactionService.getByUuid(uuid);

          if (!existing) {

            await transactionService.create({
              uuid: uuid,
              total: transaction.total || transaction.total_harga || 0,
              payment_method: transaction.payment_method_id === 1 ? "cash" : "credit",
              payment_amount: transaction.cash_received || transaction.nominal_bayar || 0,
              change_amount: transaction.change_amount || transaction.kembalian || 0,
              status: transaction.status || "paid",
              customer_name: transaction.name || transaction.nama_customer || "",
              items: transaction.items || transaction.transaction_items || [],
            });

            synced.push(transaction);
          } else {


          }
        } catch (error) {

          if (error.message && error.message.includes("UNIQUE")) {
          } else {
            failed.push({ transaction, error: (error as Error).message });
          }
        }
      }

      return { synced, failed };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Sync semua data (products + categories + transactions)
   * @param includeTransactions - Set true untuk first-time setup, false untuk daily sync
   */
  async syncAllFromServer(onProgress?: ProgressCallback, includeTransactions = false) {
    if (!isElectron()) {
      throw new Error("Sync only available in Electron mode");
    }

    const results = {
      products: { synced: [], failed: [] },
      categories: { synced: [], failed: [] },
      transactions: { synced: [], failed: [] },
    };


    try {
      const catResult = await this.syncCategoriesFromServer(onProgress);
      results.categories = catResult;
    } catch (error) {
    }


    try {
      const prodResult = await this.syncProductsFromServer(onProgress);
      results.products = prodResult;
    } catch (error) {
    }


    if (includeTransactions) {
      try {
        const txResult = await this.syncTransactionsFromServer(onProgress);
        results.transactions = txResult;
      } catch (error) {
      }
    }

    return results;
  },

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    if (!isElectron()) {
      throw new Error("Stats only available in Electron mode");
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
