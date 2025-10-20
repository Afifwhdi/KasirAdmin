interface ElectronAPI {
  db: {
    query: (sql: string, params?: unknown[]) => Promise<unknown[]>;
    run: (sql: string, params?: unknown[]) => Promise<unknown>;
    get: (sql: string, params?: unknown[]) => Promise<unknown>;
  };
  app: {
    getPath: (name: string) => Promise<string>;
    getDataDir: () => Promise<string>;
    setDbPath: (path: string) => Promise<{ success: boolean; message: string; newPath: string }>;
    getDbPath: () => Promise<string>;
  };
  platform: string;
  isElectron: boolean;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export const isElectron = () => {
  return typeof window !== "undefined" && window.electronAPI?.isElectron === true;
};

export const electronDB = {
  async query(sql: string, params: unknown[] = []) {
    if (!isElectron()) {
      throw new Error("Electron API not available");
    }
    return window.electronAPI!.db.query(sql, params);
  },

  async run(sql: string, params: unknown[] = []) {
    if (!isElectron()) {
      throw new Error("Electron API not available");
    }
    return window.electronAPI!.db.run(sql, params);
  },

  async get(sql: string, params: unknown[] = []) {
    if (!isElectron()) {
      throw new Error("Electron API not available");
    }
    return window.electronAPI!.db.get(sql, params);
  },

  async getDataDir() {
    if (!isElectron()) {
      throw new Error("Electron API not available");
    }
    return window.electronAPI!.app.getDataDir();
  },

  async setDbPath(newPath: string) {
    if (!isElectron()) {
      throw new Error("Electron API not available");
    }
    return window.electronAPI!.app.setDbPath(newPath);
  },

  async getDbPath() {
    if (!isElectron()) {
      throw new Error("Electron API not available");
    }
    return window.electronAPI!.app.getDbPath();
  },
};

export const productService = {
  async getAll(limit = 500, offset = 0) {
    return electronDB.query("SELECT * FROM products ORDER BY name ASC LIMIT ? OFFSET ?", [
      limit,
      offset,
    ]);
  },

  async count() {
    const result = await electronDB.get("SELECT COUNT(*) as total FROM products");
    return result?.total || 0;
  },

  async getById(id: number) {
    return electronDB.get("SELECT * FROM products WHERE id = ?", [id]);
  },

  async getByUuid(uuid: string) {
    return electronDB.get("SELECT * FROM products WHERE uuid = ?", [uuid]);
  },

  async getByBarcode(barcode: string) {
    return electronDB.get("SELECT * FROM products WHERE barcode = ?", [barcode]);
  },

  async create(product: Record<string, unknown>) {
    const { uuid, name, price, stock, category, image, barcode } = product;
    return electronDB.run(
      "INSERT INTO products (uuid, name, price, stock, category, image, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [uuid, name, price, stock, category, image, barcode]
    );
  },

  async update(id: number, product: Record<string, unknown>) {
    const { name, price, stock, category, image, barcode } = product;
    return electronDB.run(
      "UPDATE products SET name = ?, price = ?, stock = ?, category = ?, image = ?, barcode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name, price, stock, category, image, barcode, id]
    );
  },

  async delete(id: number) {
    return electronDB.run("DELETE FROM products WHERE id = ?", [id]);
  },

  async search(query: string, limit = 50) {
    return electronDB.query(
      "SELECT * FROM products WHERE name LIKE ? OR barcode LIKE ? ORDER BY name ASC LIMIT ?",
      [`%${query}%`, `%${query}%`, limit]
    );
  },

  async getByCategory(category: string) {
    return electronDB.query("SELECT * FROM products WHERE category = ? ORDER BY name ASC", [
      category,
    ]);
  },
};

export const transactionService = {
  async getAll(limit = 10000, offset = 0) {
    return electronDB.query(
      "SELECT * FROM transactions ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
  },

  async count() {
    const result = await electronDB.get("SELECT COUNT(*) as total FROM transactions");
    return result?.total || 0;
  },

  async getById(id: number) {
    return electronDB.get("SELECT * FROM transactions WHERE id = ?", [id]);
  },

  async getByUuid(uuid: string) {
    return electronDB.get("SELECT * FROM transactions WHERE uuid = ?", [uuid]);
  },

  async getUnsynced() {
    // Only get unsynced transactions from today to avoid old failed syncs
    return electronDB.query(
      "SELECT * FROM transactions WHERE synced = 0 AND DATE(created_at) >= DATE('now') ORDER BY created_at ASC"
    );
  },

  async getAllUnsynced() {
    // Get all unsynced transactions (including old ones) for manual cleanup
    return electronDB.query("SELECT * FROM transactions WHERE synced = 0 ORDER BY created_at ASC");
  },

  async create(transaction: Record<string, unknown>) {
    const {
      uuid,
      total,
      payment_method,
      payment_amount,
      change_amount,
      items,
      status,
      customer_name,
    } = transaction;

    // Check if transaction with same UUID already exists
    const existing = await this.getByUuid(uuid as string);
    if (existing) {
      console.warn(`⚠️  Transaction with UUID ${uuid} already exists in local database`);
      throw new Error(`Transaction with UUID ${uuid} already exists`);
    }

    // Validate required fields
    if (!uuid || !total || typeof total !== 'number') {
      throw new Error('Missing required fields: uuid and total are required');
    }

    try {
      return electronDB.run(
        "INSERT INTO transactions (uuid, total, payment_method, payment_amount, change_amount, items, status, customer_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          uuid,
          total,
          payment_method || "cash",
          payment_amount || 0,
          change_amount || 0,
          JSON.stringify(items || []),
          status || "paid",
          customer_name || "",
          new Date().toISOString(),
          new Date().toISOString(),
        ]
      );
    } catch (error) {
      console.error('Failed to create transaction in local database:', error);
      throw new Error(`Failed to create transaction: ${error.message || error}`);
    }
  },

  async markSynced(id: number) {
    return electronDB.run("UPDATE transactions SET synced = 1 WHERE id = ?", [id]);
  },

  async getDateRange(startDate: string, endDate: string) {
    return electronDB.query(
      "SELECT * FROM transactions WHERE DATE(created_at) BETWEEN ? AND ? ORDER BY created_at DESC",
      [startDate, endDate]
    );
  },

  async getTodayTotal() {
    const result = await electronDB.get(
      "SELECT SUM(total) as total FROM transactions WHERE DATE(created_at) = DATE('now')"
    );
    return result?.total || 0;
  },

  async updateStatus(id: number, status: string) {
    return electronDB.run(
      "UPDATE transactions SET status = ?, synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [status, id]
    );
  },

  async payBon(id: number, cashReceived: number, changeAmount: number) {
    return electronDB.run(
      "UPDATE transactions SET payment_amount = ?, change_amount = ?, status = ?, synced = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [cashReceived, changeAmount, "paid", id]
    );
  },

  // Database maintenance methods
  async findDuplicates() {
    return electronDB.query(
      "SELECT uuid, COUNT(*) as count FROM transactions GROUP BY uuid HAVING count > 1"
    );
  },

  async removeDuplicates() {
    // Keep the first occurrence, remove others
    const duplicates = await this.findDuplicates();
    let removedCount = 0;

    for (const dup of duplicates as any[]) {
      const transactions = await electronDB.query(
        "SELECT id FROM transactions WHERE uuid = ? ORDER BY created_at ASC",
        [dup.uuid]
      ) as any[];

      // Remove all except the first one
      for (let i = 1; i < transactions.length; i++) {
        await electronDB.run(
          "DELETE FROM transactions WHERE id = ?",
          [transactions[i].id]
        );
        removedCount++;
      }
    }

    console.log(`\ud83d\uddd1\ufe0f  Removed ${removedCount} duplicate transactions`);
    return removedCount;
  },

  async resetSyncStatus() {
    return electronDB.run("UPDATE transactions SET synced = 0");
  },

  async clearOldFailedSyncs(daysOld = 1) {
    // Clear transactions older than X days that failed to sync
    const result = await electronDB.run(
      "DELETE FROM transactions WHERE synced = 0 AND created_at < datetime('now', '-' || ? || ' days')",
      [daysOld]
    );
    console.log(`🗑️ Cleared ${result.changes || 0} old failed sync transactions`);
    return result.changes || 0;
  },

  async getSyncStats() {
    const total = await this.count();
    const unsynced = await electronDB.query(
      "SELECT COUNT(*) as count FROM transactions WHERE synced = 0"
    );
    const duplicates = await this.findDuplicates();
    
    return {
      total_transactions: total,
      unsynced_count: (unsynced as any[])[0]?.count || 0,
      duplicate_uuids: (duplicates as any[]).length,
    };
  },
};

export const categoryService = {
  async getAll() {
    return electronDB.query("SELECT * FROM categories ORDER BY name ASC");
  },

  async create(category: Record<string, unknown>) {
    const { uuid, name } = category;
    return electronDB.run("INSERT INTO categories (uuid, name) VALUES (?, ?)", [uuid, name]);
  },

  async delete(id: number) {
    return electronDB.run("DELETE FROM categories WHERE id = ?", [id]);
  },
};
