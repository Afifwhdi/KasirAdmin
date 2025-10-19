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
      // Fetch semua produk dari server dengan safety limit
      while (page <= MAX_PAGES) {
        let response;
        let retries = 0;

        // Retry logic dengan exponential backoff
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

            // Exponential backoff
            await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 1000));
          }
        }

        if (!response || !response.data || response.data.length === 0) {
          break;
        }

        // Set total from first response
        if (page === 1 && response.meta) {
          totalProducts = response.meta.total;
        }

        // Batch insert/update untuk better performance
        for (const product of response.data) {
          totalProcessed++;

          // Report progress
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
            // Check apakah produk sudah ada (by ID atau unique identifier)
            const existing = await productService.getById(product.id);

            if (existing) {
              // Update
              await productService.update(product.id, {
                name: product.name,
                price: product.price,
                stock: product.stock || 0,
                category: product.category_id?.toString() || "",
                image: product.image || "",
                barcode: product.barcode || "",
              });
            } else {
              // Insert
              await productService.create({
                uuid: product.uuid || crypto.randomUUID(),
                name: product.name,
                price: product.price,
                stock: product.stock || 0,
                category: product.category_id?.toString() || "",
                image: product.image || "",
                barcode: product.barcode || "",
              });
            }

            synced.push(product);
          } catch (error) {
            console.error("Failed to sync product:", product.id, error);
            failed.push({ id: product.id, error: error.message });
          }
        }

        // Check jika masih ada page berikutnya
        if (response.meta && page >= response.meta.totalPages) {
          break;
        }

        // Safety check: jika totalPages tidak ada, break setelah 10 pages
        if (!response.meta?.totalPages && page >= 10) {
          console.warn("No totalPages metadata, stopping after 10 pages");
          break;
        }

        page++;
      }

      return { synced, failed };
    } catch (error) {
      console.error("Sync products error:", error);
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
      // Fetch categories dari server
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.CATEGORIES}`);

      if (!response.ok) {
        throw new Error("Failed to fetch categories from server");
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
          await categoryService.create({
            uuid: category.uuid || crypto.randomUUID(),
            name: category.name,
          });
          synced.push(category);
        } catch (error) {
          // Skip jika sudah ada (UNIQUE constraint)
          if (error.message && error.message.includes("UNIQUE")) {
            synced.push(category);
          } else {
            console.error("Failed to sync category:", category.id, error);
            failed.push(category);
          }
        }
      }

      return { synced, failed };
    } catch (error) {
      console.error("Sync categories error:", error);
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
      // Fetch transactions dari server
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.TRANSACTIONS}`);

      if (!response.ok) {
        throw new Error("Failed to fetch transactions from server");
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
          // Check if transaction already exists by uuid
          const uuid = transaction.transaction_number || transaction.uuid || crypto.randomUUID();
          const existing = await transactionService.getByUuid(uuid);

          if (!existing) {
            // Map API response to local DB structure
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
            // Already exists, skip (tidak dimasukkan ke synced agar tidak double count)
            console.log("Transaction already exists:", uuid);
          }
        } catch (error) {
          console.error("Failed to insert transaction:", transaction, error);
          // Skip if UNIQUE constraint (already exists)
          if (error.message && error.message.includes("UNIQUE")) {
            console.log(
              "Transaction duplicate (UNIQUE constraint):",
              transaction.transaction_number
            );
          } else {
            failed.push({ transaction, error: (error as Error).message });
          }
        }
      }

      return { synced, failed };
    } catch (error) {
      console.error("Sync transactions error:", error);
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

    // Sync categories first
    try {
      const catResult = await this.syncCategoriesFromServer(onProgress);
      results.categories = catResult;
    } catch (error) {
      console.error("Failed to sync categories:", error);
    }

    // Then sync products
    try {
      const prodResult = await this.syncProductsFromServer(onProgress);
      results.products = prodResult;
    } catch (error) {
      console.error("Failed to sync products:", error);
    }

    // Sync transactions only if requested (first-time setup)
    if (includeTransactions) {
      try {
        const txResult = await this.syncTransactionsFromServer(onProgress);
        results.transactions = txResult;
      } catch (error) {
        console.error("Failed to sync transactions:", error);
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
