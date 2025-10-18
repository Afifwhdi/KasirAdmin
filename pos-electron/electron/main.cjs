const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const memoryMonitor = require('./memory-monitor.cjs');

let mainWindow;
let db;
const preparedStatements = new Map();

// Load custom DB path from config if exists
const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');
let config = {};

try {
  if (fs.existsSync(CONFIG_FILE)) {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  }
} catch (error) {
  console.error('Failed to load config:', error);
}

// Default DB location or custom from config
const DATA_DIR = config.dbPath || path.join(app.getPath('userData'), 'POS_Data');
const DB_PATH = path.join(DATA_DIR, 'pos.db');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function cleanupPreparedStatements() {
  for (const [key, stmt] of preparedStatements.entries()) {
    try {
      if (stmt && typeof stmt.finalize === 'function') {
        stmt.finalize();
      }
    } catch (error) {
      console.error('Error finalizing statement:', key, error);
    }
  }
  preparedStatements.clear();
}

function cleanupDatabase() {
  cleanupPreparedStatements();
  if (db) {
    try {
      db.close();
      console.log('Database closed successfully');
    } catch (error) {
      console.error('Error closing database:', error);
    }
    db = null;
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, '../public/placeholder.svg'),
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    cleanupDatabase();
    mainWindow = null;
  });

  mainWindow.on('unresponsive', () => {
    console.error('Window became unresponsive');
    dialog.showErrorBox('Application Unresponsive', 'The application is not responding. Please restart.');
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed');
    const options = {
      type: 'error',
      title: 'Renderer Crashed',
      message: 'The application has crashed. Do you want to reload?',
      buttons: ['Reload', 'Close']
    };
    
    dialog.showMessageBox(options).then((result) => {
      if (result.response === 0) {
        mainWindow.reload();
      } else {
        mainWindow.close();
      }
    });
  });
}

function initDatabase() {
  try {
    const Database = require('better-sqlite3');
    db = new Database(DB_PATH, { 
      verbose: console.log,
      fileMustExist: false
    });
    
    // Enable WAL mode untuk better performance dan concurrent access
    db.pragma('journal_mode = WAL');
    
    // Set cache size (negative = KB, default is pages)
    db.pragma('cache_size = -64000'); // 64MB cache
    
    // Optimize for speed
    db.pragma('synchronous = NORMAL');
    db.pragma('temp_store = MEMORY');
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        category TEXT,
        image TEXT,
        barcode TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
      CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        total REAL NOT NULL,
        payment_method TEXT NOT NULL,
        payment_amount REAL NOT NULL,
        change_amount REAL DEFAULT 0,
        items TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_transactions_synced ON transactions(synced);

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sync_queue_type ON sync_queue(type);
    `);

    // Optimize database
    db.exec('ANALYZE;');
    
    console.log('Database initialized at:', DB_PATH);
  } catch (error) {
    console.error('Database initialization error:', error);
    dialog.showErrorBox('Database Error', `Failed to initialize database: ${error.message}`);
  }
}

app.whenReady().then(() => {
  ensureDataDir();
  initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  cleanupDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  cleanupDatabase();
});

// Query dengan limit untuk prevent memory overflow
ipcMain.handle('db:query', async (event, sql, params = []) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // Inject LIMIT jika query SELECT tanpa LIMIT
    let modifiedSql = sql.trim();
    if (modifiedSql.toUpperCase().startsWith('SELECT') && 
        !modifiedSql.toUpperCase().includes('LIMIT')) {
      modifiedSql += ' LIMIT 1000'; // Default limit
    }

    // Cache prepared statement
    const cacheKey = `query:${modifiedSql}`;
    let stmt = preparedStatements.get(cacheKey);
    
    if (!stmt) {
      stmt = db.prepare(modifiedSql);
      preparedStatements.set(cacheKey, stmt);
    }

    return stmt.all(params);
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }
});

ipcMain.handle('db:run', async (event, sql, params = []) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // Cache prepared statement
    const cacheKey = `run:${sql}`;
    let stmt = preparedStatements.get(cacheKey);
    
    if (!stmt) {
      stmt = db.prepare(sql);
      preparedStatements.set(cacheKey, stmt);
    }

    return stmt.run(params);
  } catch (error) {
    console.error('Database run error:', error);
    throw new Error(`Database run failed: ${error.message}`);
  }
});

ipcMain.handle('db:get', async (event, sql, params = []) => {
  if (!db) {
    throw new Error('Database not initialized');
  }

  try {
    // Cache prepared statement
    const cacheKey = `get:${sql}`;
    let stmt = preparedStatements.get(cacheKey);
    
    if (!stmt) {
      stmt = db.prepare(sql);
      preparedStatements.set(cacheKey, stmt);
    }

    return stmt.get(params);
  } catch (error) {
    console.error('Database get error:', error);
    throw new Error(`Database get failed: ${error.message}`);
  }
});

ipcMain.handle('app:getPath', async (event, name) => {
  return app.getPath(name);
});

ipcMain.handle('app:getDataDir', async () => {
  return DATA_DIR;
});

// Set custom DB path
ipcMain.handle('app:setDbPath', async (event, newPath) => {
  try {
    const newConfig = { ...config, dbPath: newPath };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    
    return {
      success: true,
      message: 'Database path updated. Restart aplikasi untuk apply perubahan.',
      newPath
    };
  } catch (error) {
    console.error('Failed to set DB path:', error);
    throw error;
  }
});

// Get current DB path
ipcMain.handle('app:getDbPath', async () => {
  return DB_PATH;
});

// Get memory info
ipcMain.handle('app:getMemoryInfo', async () => {
  return memoryMonitor.getMemoryInfo();
});

// Force garbage collection
ipcMain.handle('app:forceGC', async () => {
  if (global.gc) {
    global.gc();
    return { success: true, message: 'Garbage collection triggered' };
  }
  return { success: false, message: 'GC not available' };
});
