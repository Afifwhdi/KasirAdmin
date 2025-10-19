# Kasir Desktop

Aplikasi Point of Sale desktop untuk toko retail.

## Features
- 📦 Manajemen produk & kategori
- 💰 Transaksi kasir offline/online
- 🔄 Sinkronisasi manual dengan server
- 💾 Database SQLite lokal
- 🔐 Autentikasi & token management
- ⏰ Reminder otomatis tutup toko (20:15)

## Development

```bash
# Install dependencies
npm install

# Run dev mode
npm run electron:dev

# Build installer
npm run electron:build:win
```

## Build Installer

```bash
npm run electron:build:win
```

Installer akan dibuat di folder `release/` (~150MB)

## Distribusi

1. Build installer
2. Test di PC lain sebelum deploy
3. File yang dibagikan: `POS System Setup 1.0.0.exe`
4. **JANGAN upload**: .env, node_modules, credentials

## Backup Database

Database disimpan di: `C:\Users\[User]\AppData\Roaming\kasir-desktop\POS_Data\pos.db`

Atau lokasi custom yang dipilih saat setup.

## Login Default

Email: `adminpos@gmail.com`  
Password: `123`

## Troubleshooting

**Tidak bisa sync?**
- Pastikan koneksi internet aktif
- Cek server API: http://154.19.37.167:3000

**Database error?**
- Restart aplikasi
- Cek lokasi database di Settings

**Build gagal?**
- Hapus folder `node_modules`, `dist`, `release`
- Run `npm install` lagi
- Build ulang

## Tech Stack

- Electron 32
- React 18 + Vite
- TypeScript
- Better-SQLite3
- TailwindCSS + Shadcn UI

### Quick Build
```bash
npm install
npm run electron:build:win
```

Installer output: `release/Kasir Desktop Setup 1.0.0.exe`

## Support

Hubungi developer untuk support.
