const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  globalShortcut,
} = require("electron");
const path = require("path");
const fs = require("fs");
const memoryMonitor = require("./memory-monitor.cjs");

// Disable autofill warnings
app.commandLine.appendSwitch('--disable-features', 'Autofill');

// Force userData path to use correct app name
app.setPath('userData', path.join(app.getPath('appData'), 'kasir-desktop'));

let mainWindow;
let db;
const preparedStatements = new Map();

// Load custom DB path from config if exists
const CONFIG_FILE = path.join(app.getPath("userData"), "config.json");
let config = {};
let DATA_DIR = null;
let DB_PATH = null;

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));

    } else {

    }
  } catch (error) {

  }

  // Set DB path from config if exists
  if (config.dbPath) {
    DATA_DIR = config.dbPath;
    DB_PATH = path.join(DATA_DIR, "pos.db");

  } else {

  }
}

function ensureDataDir() {
  if (DATA_DIR && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });

  }
}

function cleanupPreparedStatements() {
  for (const [key, stmt] of preparedStatements.entries()) {
    try {
      if (stmt && typeof stmt.finalize === "function") {
        stmt.finalize();
      }
    } catch (error) {

    }
  }
  preparedStatements.clear();
}

function cleanupDatabase() {
  cleanupPreparedStatements();
  if (db) {
    try {
      db.close();

    } catch (error) {

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
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
      zoomFactor: 1.0,
    },
    icon: path.join(__dirname, "../public/placeholder.svg"),
  });

  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  } else {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  }

  // Setup zoom controls
  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow.webContents.setZoomFactor(1.0);
  });

  mainWindow.on("closed", () => {
    cleanupDatabase();
    globalShortcut.unregisterAll();
    mainWindow = null;
  });

  mainWindow.on("unresponsive", () => {

    dialog.showErrorBox(
      "Application Unresponsive",
      "The application is not responding. Please restart."
    );
  });

  mainWindow.webContents.on("crashed", () => {

    const options = {
      type: "error",
      title: "Renderer Crashed",
      message: "The application has crashed. Do you want to reload?",
      buttons: ["Reload", "Close"],
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
  if (!DATA_DIR || !DB_PATH) {

    return false;
  }

  try {
    ensureDataDir();
    const dbExists = fs.existsSync(DB_PATH);
    const Database = require("better-sqlite3");
    db = new Database(DB_PATH, {
      fileMustExist: false,
    });

    // Log jika database baru dibuat
    if (!dbExists) {

    }

    // Enable WAL mode untuk better performance dan concurrent access
    db.pragma("journal_mode = WAL");

    // Set cache size (negative = KB, default is pages)
    db.pragma("cache_size = -64000");

    db.pragma("synchronous = NORMAL");
    db.pragma("temp_store = MEMORY");

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
        status TEXT DEFAULT 'paid',
        customer_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        synced INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    db.exec("ANALYZE;");


    return true;
  } catch (error) {

    dialog.showErrorBox(
      "Database Error",
      `Failed to initialize database: ${error.message}`
    );
    return false;
  }
}

app.whenReady().then(() => {
  loadConfig();
  
  // Only init database if config exists
  if (config.dbPath) {
    initDatabase();
  } else {

  }
  
  createWindow();

  // Register global shortcuts for zoom
  globalShortcut.register("CommandOrControl+Plus", () => {
    if (mainWindow) {
      const currentZoom = mainWindow.webContents.getZoomFactor();
      mainWindow.webContents.setZoomFactor(Math.min(currentZoom + 0.1, 3.0));
    }
  });

  globalShortcut.register("CommandOrControl+=", () => {
    if (mainWindow) {
      const currentZoom = mainWindow.webContents.getZoomFactor();
      mainWindow.webContents.setZoomFactor(Math.min(currentZoom + 0.1, 3.0));
    }
  });

  globalShortcut.register("CommandOrControl+-", () => {
    if (mainWindow) {
      const currentZoom = mainWindow.webContents.getZoomFactor();
      mainWindow.webContents.setZoomFactor(Math.max(currentZoom - 0.1, 0.5));
    }
  });

  globalShortcut.register("CommandOrControl+0", () => {
    if (mainWindow) {
      mainWindow.webContents.setZoomFactor(1.0);
    }
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  cleanupDatabase();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  cleanupDatabase();
});

// Query dengan limit untuk prevent memory overflow
ipcMain.handle("db:query", async (event, sql, params = []) => {
  // Lazy initialization: Try to init if config exists but DB not initialized
  if (!db && config.dbPath) {
    initDatabase();
  }
  
  if (!db) {
    // Return empty array for queries when DB not initialized (first-time setup)
    // This prevents error spam in console during first-time setup flow
    return [];
  }

  try {
    // Inject LIMIT jika query SELECT tanpa LIMIT
    let modifiedSql = sql.trim();
    if (
      modifiedSql.toUpperCase().startsWith("SELECT") &&
      !modifiedSql.toUpperCase().includes("LIMIT")
    ) {
      modifiedSql += " LIMIT 1000"; // Default limit
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

    throw new Error(`Database query failed: ${error.message}`);
  }
});

ipcMain.handle("db:run", async (event, sql, params = []) => {
  // Lazy initialization: Try to init if config exists but DB not initialized
  if (!db && config.dbPath) {
    initDatabase();
  }
  
  if (!db) {
    // Return empty result for run operations when DB not initialized
    return { changes: 0, lastInsertRowid: 0 };
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

    throw new Error(`Database run failed: ${error.message}`);
  }
});

ipcMain.handle("db:get", async (event, sql, params = []) => {
  // Lazy initialization: Try to init if config exists but DB not initialized
  if (!db && config.dbPath) {
    initDatabase();
  }
  
  if (!db) {
    // Return null for get operations when DB not initialized
    return null;
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

    throw new Error(`Database get failed: ${error.message}`);
  }
});

ipcMain.handle("app:getPath", async (event, name) => {
  return app.getPath(name);
});

ipcMain.handle("app:getDataDir", async () => {
  return DATA_DIR;
});

// Set custom DB path and initialize database
ipcMain.handle("app:setDbPath", async (event, newPath) => {
  try {
    // Save config
    const newConfig = { ...config, dbPath: newPath };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2));
    config = newConfig;

    // Update paths
    DATA_DIR = newPath;
    DB_PATH = path.join(DATA_DIR, "pos.db");

    // Initialize database at new location
    const success = initDatabase();

    if (success) {
      return {
        success: true,
        message: "Database lokasi berhasil di-set dan database dibuat!",
        newPath: DB_PATH,
      };
    } else {
      throw new Error("Failed to initialize database at new location");
    }
  } catch (error) {

    return {
      success: false,
      message: `Error: ${error.message}`,
      newPath: null,
    };
  }
});

// Get current DB path
ipcMain.handle("app:getDbPath", async () => {
  return DB_PATH;
});

// Check if database file exists
ipcMain.handle("app:checkDbExists", async () => {
  if (!DB_PATH) return false;
  return fs.existsSync(DB_PATH);
});

// Check if config exists (first time setup)
ipcMain.handle("app:hasConfig", async () => {
  return fs.existsSync(CONFIG_FILE) && config.dbPath != null;
});

// Check if database has data (products or categories)
ipcMain.handle("app:hasDbData", async () => {
  if (!db) {

    return false;
  }
  try {
    const productCount = db
      .prepare("SELECT COUNT(*) as count FROM products")
      .get();
    const categoryCount = db
      .prepare("SELECT COUNT(*) as count FROM categories")
      .get();
    const hasData = productCount.count > 0 || categoryCount.count > 0;

    return hasData;
  } catch (error) {

    return false;
  }
});

// Select folder dialog
ipcMain.handle("dialog:selectFolder", async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory", "createDirectory"],
    title: "Pilih Lokasi Folder Database",
    buttonLabel: "Pilih Folder",
  });

  if (result.canceled) {
    return { canceled: true };
  }

  return { canceled: false, folderPath: result.filePaths[0] };
});

// Get memory info
ipcMain.handle("app:getMemoryInfo", async () => {
  return memoryMonitor.getMemoryInfo();
});

// Force garbage collection
ipcMain.handle("app:forceGC", async () => {
  if (global.gc) {
    global.gc();
    return { success: true, message: "Garbage collection triggered" };
  }
  return { success: false, message: "GC not available" };
});
