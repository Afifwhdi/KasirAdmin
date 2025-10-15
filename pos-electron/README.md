# POS Electron - Desktop Application

Aplikasi POS Desktop yang dibuat dengan React, Electron, dan SQLite untuk berjalan offline penuh di Windows.

## 📦 Fitur

- ✅ **Offline-First**: Aplikasi berjalan sepenuhnya offline tanpa memerlukan internet
- ✅ **SQLite Database**: Data tersimpan lokal di `%APPDATA%/pos-electron/POS_Data/pos.db`
- ✅ **Desktop Native**: Aplikasi desktop asli Windows (.exe)
- ✅ **Auto Installer**: Installer NSIS dengan desktop shortcut
- 🔄 **Sync Manual**: Fitur sinkronisasi manual ke server (opsional)

## 🚀 Development

### Prerequisites

- Node.js 18+ dan npm
- Windows 10/11 (untuk build .exe)

### Install Dependencies

```bash
npm install
```

### Run Development Mode

#### Opsi 1: Vite Dev Server Only (untuk development UI)
```bash
npm run dev
```
Buka browser di `http://localhost:5173`

#### Opsi 2: Electron Development Mode (recommended untuk test electron features)
```bash
npm run electron:dev
```
Akan membuka Electron window dengan DevTools

#### Opsi 3: Test Built Version
```bash
npm run build
npm run electron
```

## 📦 Build Production

⚠️ **Note**: Build .exe installer memerlukan Windows Developer Mode enabled atau admin privilege.

### Metode Distribusi yang Direkomendasikan

**Opsi 1: Distribusi Portable (Paling Mudah)** ✅

1. Build React app:
```bash
npm run build
```

2. Copy seluruh folder `pos-electron` ke PC tujuan

3. Di PC tujuan, install Node.js: https://nodejs.org/

4. Double-click file `Jalankan-POS.bat` atau run:
```bash
npm run electron
```

**Opsi 2: Build .exe Installer** (Butuh Windows Developer Mode)

```bash
npm run electron:build:win
```

Output akan ada di folder `release/`:
- `POS System Setup 1.0.0.exe` - Installer untuk distribusi
- `win-unpacked/` - Aplikasi unpacked untuk test

📖 **Dokumentasi lengkap distribusi**: Lihat [DISTRIBUSI.md](./DISTRIBUSI.md)

## 📁 Struktur Project

```
pos-electron/
├── electron/              # Electron main process
│   ├── main.js           # Window management & SQLite
│   └── preload.js        # IPC bridge
├── src/                  # React application
│   ├── services/
│   │   └── electron-db.ts # Database service layer
│   ├── features/
│   ├── components/
│   └── pages/
├── dist/                 # Build output React
├── release/             # Electron build output
└── public/              # Static assets

```

## 💾 Database

### Lokasi Database
Database SQLite disimpan di:
```
%APPDATA%/pos-electron/POS_Data/pos.db
```

Contoh path lengkap:
```
C:\Users\YourName\AppData\Roaming\pos-electron\POS_Data\pos.db
```

### Schema Database

#### Table: products
```sql
CREATE TABLE products (
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
```

#### Table: transactions
```sql
CREATE TABLE transactions (
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
```

#### Table: categories
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 🔧 Development API

### Electron IPC API

Di React app, gunakan `window.electronAPI` untuk akses database:

```typescript
import { electronDB, productService, transactionService } from '@/services/electron-db';

// Direct query
const products = await electronDB.query('SELECT * FROM products');

// Menggunakan service
const allProducts = await productService.getAll();
const product = await productService.getById(1);

// Transaction
const transaction = await transactionService.create({
  uuid: crypto.randomUUID(),
  total: 50000,
  payment_method: 'cash',
  payment_amount: 50000,
  change_amount: 0,
  items: [{ product_id: 1, qty: 2, price: 25000 }]
});
```

## 📤 Distribusi

### File yang Harus Dibagikan

1. **Installer (Recommended)**:
   - File: `release/POS System Setup 1.0.0.exe`
   - Size: ~100-150 MB
   - User tinggal double-click dan install

2. **Portable (Tanpa Install)**:
   - Folder: `release/win-unpacked/`
   - Size: ~200-250 MB
   - User extract dan jalankan `POS System.exe`

### Instalasi di Komputer Lain

1. **Menggunakan Installer**:
   - Double-click `POS System Setup 1.0.0.exe`
   - Follow wizard instalasi
   - Desktop shortcut akan otomatis dibuat
   - Jalankan dari Start Menu atau Desktop

2. **Portable**:
   - Extract folder `win-unpacked`
   - Jalankan `POS System.exe`
   - Tidak perlu install, bisa di flash disk

### Backup & Restore Data

**Backup**:
1. Tutup aplikasi POS
2. Copy folder: `%APPDATA%/pos-electron/POS_Data/`
3. Simpan di tempat aman

**Restore**:
1. Install aplikasi POS di komputer baru
2. Jalankan sekali (untuk create folder)
3. Tutup aplikasi
4. Replace folder `%APPDATA%/pos-electron/POS_Data/` dengan backup

## 🔐 Security Notes

- Database tidak ter-encrypt (plain SQLite)
- Tidak ada authentication di app level
- Cocok untuk single-user/trusted environment
- Untuk multi-user, implementasikan auth di server API

## 🐛 Troubleshooting

### Aplikasi tidak bisa dibuka
- Pastikan Windows 10/11 64-bit
- Install Visual C++ Redistributable 2015-2022
- Check antivirus tidak block

### Database error
- Check folder permission: `%APPDATA%/pos-electron/`
- Pastikan tidak ada proses lain akses database
- Hapus file `*.db-wal` dan `*.db-shm` jika error

### Build gagal
```bash
# Clear cache dan reinstall
rm -rf node_modules
rm package-lock.json
npm install

# Rebuild native modules
npm rebuild better-sqlite3
```

## 📝 Scripts

```json
{
  "dev": "vite",                           // Vite dev server
  "build": "vite build",                   // Build React app
  "electron": "electron .",                // Run electron with built app
  "electron:dev": "...",                   // Dev mode (Vite + Electron)
  "electron:build": "npm run build && electron-builder",
  "electron:build:win": "npm run build && electron-builder --win --x64",
  "pack": "electron-builder --dir",        // Build unpacked
  "dist": "npm run build && electron-builder"
}
```

## 🌐 Integrasi dengan Server API

Jika ingin sync data ke server:

1. Tambahkan API client di `src/services/api.ts`
2. Implementasikan sync logic di `transactionService`
3. Tambahkan button "Sync Now" di UI
4. Handle offline/online state

Contoh:
```typescript
async syncTransactions() {
  const unsynced = await transactionService.getUnsynced();
  
  for (const tx of unsynced) {
    try {
      await apiClient.post('/transactions', tx);
      await transactionService.markSynced(tx.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}
```

## 📄 License

MIT

## 👨‍💻 Author

Your Company
