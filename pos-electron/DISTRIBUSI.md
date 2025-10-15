# 📦 Panduan Distribusi POS Electron

Karena issue dengan Windows code signing, berikut adalah cara alternatif untuk distribusi aplikasi POS Electron:

## 🚀 Opsi 1: Distribusi Manual (Paling Mudah & Direkomendasikan)

### Langkah-langkah:

#### A. Persiapan Package
1. Build React app terlebih dahulu:
   ```bash
   npm run build
   ```

2. Copy files yang diperlukan ke folder baru `POS-Portable`:
   ```
   POS-Portable/
   ├── dist/              (dari build result)
   ├── electron/          (folder electron files)
   ├── node_modules/      (HANYA yang essential - lihat di bawah)
   ├── package.json
   └── POS-RUN.bat        (shortcut untuk menjalankan)
   ```

#### B. Instalasi di Komputer Lain

**Cara 1: Full Package (Recommended)**
1. Copy seluruh folder `pos-electron` ke PC tujuan
2. Install Node.js di PC tersebut (jika belum ada): https://nodejs.org/
3. Buka Command Prompt/PowerShell di folder pos-electron
4. Jalankan: `npm install` (pertama kali saja)
5. Jalankan: `npm run electron`

**Cara 2: Portable (Tanpa npm install)**
1. Setelah npm install di PC development, copy seluruh folder `pos-electron` beserta `node_modules`
2. Copy ke PC lain
3. Buat shortcut `.bat` file untuk memudahkan:
   ```batch
   @echo off
   cd /d "%~dp0"
   node_modules\.bin\electron.cmd .
   pause
   ```
4. Save sebagai `Jalankan-POS.bat`
5. Double-click `Jalankan-POS.bat` untuk run

## 🔧 Opsi 2: Manual Packaging dengan Electron Packager

Jika tetap ingin membuat .exe tanpa installer:

```bash
npm install --save-dev electron-packager

# Build React
npm run build

# Package
npx electron-packager . "POS System" --platform=win32 --arch=x64 --out=release --overwrite --no-prune --ignore="node_modules/(electron-builder|@electron)" --icon=public/placeholder.svg
```

Output akan ada di `release/POS System-win32-x64/`

## 📁 Struktur Minimal untuk Distribusi

Jika ingin package seminimal mungkin (tanpa dev dependencies):

```
POS-Minimal/
├── dist/                    # React build
├── electron/
│   ├── main.cjs
│   └── preload.cjs
├── node_modules/
│   ├── electron/            # Runtime electron
│   ├── better-sqlite3/      # Database
│   └── (dependencies lain dari package.json "dependencies")
└── package.json
```

**Cara membuat:**
```bash
# 1. Install production only
npm install --production

# 2. Copy folder ke POS-Minimal
# 3. Buat script runner .bat
```

## 🎯 Opsi 3: Build dengan Electron Forge (Alternatif)

Jika electron-builder bermasalah, coba electron-forge:

```bash
npm install --save-dev @electron-forge/cli
npx electron-forge import
npm run make
```

## ⚙️ Opsi 4: Enable Windows Developer Mode (Untuk Fix Code Signing Issue)

Jika ingin tetap pakai electron-builder:

1. Buka **Settings** → **Update & Security** → **For Developers**
2. Aktifkan **Developer Mode**
3. Restart PC
4. Jalankan lagi: `npm run electron:build:win`

⚠️ **Note**: Memerlukan Windows 10/11 Pro/Enterprise dan admin privilege

## 📋 Checklist Distribusi

- [ ] Build React app (`npm run build`)
- [ ] Test dengan `npm run electron` di PC development
- [ ] Copy folder pos-electron ke PC target
- [ ] Install Node.js di PC target (jika opsi 1)
- [ ] Run `npm install` di PC target (jika opsi 1)
- [ ] Test aplikasi di PC target
- [ ] Verifikasi database terbuat di `%APPDATA%/pos-electron/POS_Data/`
- [ ] Test create transaksi
- [ ] Test view transaksi

## 💾 Backup & Restore Data

### Backup
```bash
# Database location
C:\Users\[Username]\AppData\Roaming\pos-electron\POS_Data\pos.db

# Copy file ini untuk backup
```

### Restore
```bash
# Paste file pos.db ke lokasi yang sama di PC baru
```

## 🔐 Keamanan

- Aplikasi tidak ter-code-sign (akan muncul warning Windows Defender)
- User perlu klik "More Info" → "Run Anyway"
- Atau disable Windows Defender sementara saat install

## 📞 Troubleshooting

### Error: "Node.js not found"
- Install Node.js dari: https://nodejs.org/
- Restart terminal/PC

### Error: "Cannot find module 'electron'"
- Run: `npm install`
- Atau copy node_modules dari PC development

### Error: "Database error"
- Check apakah folder `%APPDATA%/pos-electron` accessible
- Run aplikasi dengan admin privilege

### Aplikasi tidak mau jalan
- Check Node.js version: `node --version` (minimum v18)
- Rebuild native modules: `npm run postinstall`
- Clear cache: delete `node_modules` dan run `npm install` lagi

## ✅ Kesimpulan

**Rekomendasi:** Gunakan **Opsi 1 Cara 2 (Portable)** untuk distribusi termudah tanpa perlu build .exe

File yang perlu didistribusikan:
1. Seluruh folder `pos-electron`
2. File shortcut `Jalankan-POS.bat`
3. Panduan singkat untuk user

Total size: ~500-700 MB (termasuk node_modules)

---

**Catatan:** Aplikasi sudah fully functional dan siap digunakan tanpa perlu .exe installer! 🎉
