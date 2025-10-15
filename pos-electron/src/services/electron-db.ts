interface ElectronAPI {
  db: {
    query: (sql: string, params?: any[]) => Promise<any[]>;
    run: (sql: string, params?: any[]) => Promise<any>;
    get: (sql: string, params?: any[]) => Promise<any>;
  };
  app: {
    getPath: (name: string) => Promise<string>;
    getDataDir: () => Promise<string>;
    setDbPath: (path: string) => Promise<any>;
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
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
};

export const electronDB = {
  async query(sql: string, params: any[] = []) {
    if (!isElectron()) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI!.db.query(sql, params);
  },

  async run(sql: string, params: any[] = []) {
    if (!isElectron()) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI!.db.run(sql, params);
  },

  async get(sql: string, params: any[] = []) {
    if (!isElectron()) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI!.db.get(sql, params);
  },

  async getDataDir() {
    if (!isElectron()) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI!.app.getDataDir();
  },

  async setDbPath(newPath: string) {
    if (!isElectron()) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI!.app.setDbPath(newPath);
  },

  async getDbPath() {
    if (!isElectron()) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI!.app.getDbPath();
  },
};

export const productService = {
  async getAll() {
    return electronDB.query('SELECT * FROM products ORDER BY name ASC');
  },

  async getById(id: number) {
    return electronDB.get('SELECT * FROM products WHERE id = ?', [id]);
  },

  async getByUuid(uuid: string) {
    return electronDB.get('SELECT * FROM products WHERE uuid = ?', [uuid]);
  },

  async getByBarcode(barcode: string) {
    return electronDB.get('SELECT * FROM products WHERE barcode = ?', [barcode]);
  },

  async create(product: any) {
    const { uuid, name, price, stock, category, image, barcode } = product;
    return electronDB.run(
      'INSERT INTO products (uuid, name, price, stock, category, image, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuid, name, price, stock, category, image, barcode]
    );
  },

  async update(id: number, product: any) {
    const { name, price, stock, category, image, barcode } = product;
    return electronDB.run(
      'UPDATE products SET name = ?, price = ?, stock = ?, category = ?, image = ?, barcode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, price, stock, category, image, barcode, id]
    );
  },

  async delete(id: number) {
    return electronDB.run('DELETE FROM products WHERE id = ?', [id]);
  },

  async search(query: string) {
    return electronDB.query(
      'SELECT * FROM products WHERE name LIKE ? OR barcode LIKE ? ORDER BY name ASC',
      [`%${query}%`, `%${query}%`]
    );
  },

  async getByCategory(category: string) {
    return electronDB.query('SELECT * FROM products WHERE category = ? ORDER BY name ASC', [
      category,
    ]);
  },
};

export const transactionService = {
  async getAll() {
    return electronDB.query('SELECT * FROM transactions ORDER BY created_at DESC');
  },

  async getById(id: number) {
    return electronDB.get('SELECT * FROM transactions WHERE id = ?', [id]);
  },

  async getUnsynced() {
    return electronDB.query('SELECT * FROM transactions WHERE synced = 0 ORDER BY created_at ASC');
  },

  async create(transaction: any) {
    const { uuid, total, payment_method, payment_amount, change_amount, items } = transaction;
    return electronDB.run(
      'INSERT INTO transactions (uuid, total, payment_method, payment_amount, change_amount, items) VALUES (?, ?, ?, ?, ?, ?)',
      [uuid, total, payment_method, payment_amount, change_amount, JSON.stringify(items)]
    );
  },

  async markSynced(id: number) {
    return electronDB.run('UPDATE transactions SET synced = 1 WHERE id = ?', [id]);
  },

  async getDateRange(startDate: string, endDate: string) {
    return electronDB.query(
      'SELECT * FROM transactions WHERE DATE(created_at) BETWEEN ? AND ? ORDER BY created_at DESC',
      [startDate, endDate]
    );
  },

  async getTodayTotal() {
    const result = await electronDB.get(
      "SELECT SUM(total) as total FROM transactions WHERE DATE(created_at) = DATE('now')"
    );
    return result?.total || 0;
  },
};

export const categoryService = {
  async getAll() {
    return electronDB.query('SELECT * FROM categories ORDER BY name ASC');
  },

  async create(category: any) {
    const { uuid, name } = category;
    return electronDB.run('INSERT INTO categories (uuid, name) VALUES (?, ?)', [uuid, name]);
  },

  async delete(id: number) {
    return electronDB.run('DELETE FROM categories WHERE id = ?', [id]);
  },
};
