# KasirAdmin - Point of Sale System

Full-stack Point of Sale (POS) system dengan offline-first Electron desktop app, REST API backend, dan admin dashboard.

## 📦 Project Structure

```
KasirAdmin/
├── admin/          # Laravel Filament Admin Dashboard
├── api/            # NestJS REST API Backend
└── kasir-desktop/  # Electron Desktop POS App (Offline-First)
```

## 🚀 Tech Stack

### Admin Dashboard (`admin/`)
- **Framework**: Laravel 11
- **Admin Panel**: Filament v3
- **Database**: MySQL/PostgreSQL
- **Features**: 
  - Product Management
  - Transaction Reports
  - Sales Analytics
  - Stock Alerts
  - Import/Export Excel

### API Backend (`api/`)
- **Framework**: NestJS
- **Database**: PostgreSQL
- **Features**:
  - RESTful API
  - Product & Category Management
  - Transaction Sync
  - Authentication

### POS Desktop App (`kasir-desktop/`)
- **Framework**: Electron + React + TypeScript
- **Database**: SQLite (Offline)
- **UI**: shadcn/ui + Tailwind CSS
- **Features**:
  - ✅ Offline-first architecture
  - ✅ SQLite local database
  - ✅ Bidirectional sync with server
  - ✅ Real-time progress tracking
  - ✅ Custom database location
  - ✅ First-time setup wizard
  - ✅ Windows .exe installer (NSIS)

## 🎯 Quick Start

### 1. Admin Dashboard
```bash
cd admin
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```
Access: http://localhost:8000

### 2. API Backend
```bash
cd api
npm install
cp .env.example .env
npm run start:dev
```
API: http://localhost:3000

### 3. POS Electron App

**Development:**
```bash
cd kasir-desktop
npm install
npm run dev              # Web mode
npm run electron:dev     # Electron mode
```

**Production Build:**
```bash
npm run electron:build:win    # Build Windows installer
```

Installer output: `kasir-desktop/release/POS System Setup 1.0.0.exe`

## 📖 Documentation

### Kasir Desktop App
- **Setup Guide**: [`kasir-desktop/README.md`](kasir-desktop/README.md)

### Admin & API
- See individual README files in each directory

## ✨ Features

### Admin Dashboard
- 📊 Real-time sales analytics
- 📈 Best-selling products reports
- 🔔 Low stock alerts
- 📤 Excel import/export
- 👥 User management
- 🎨 Modern Filament UI

### POS Desktop App
- 💾 **Offline-First**: Works without internet
- 🔄 **Sync**: Upload transactions & download data from server
- 📁 **Custom DB Path**: Choose database location via UI
- 🚀 **First-time Setup**: Guided wizard for initial setup
- 📊 **Progress Tracking**: Real-time sync progress with stats
- 🖨️ **Printing**: Thermal printer support (Bluetooth/USB)
- 💰 **Payment Methods**: Cash, Debit, Credit, QRIS
- 📦 **Standalone**: Single .exe installer for Windows

### API Backend
- 🔐 JWT Authentication
- 📡 RESTful endpoints
- 🗄️ PostgreSQL database
- 🔄 Transaction sync
- 📝 API documentation (Swagger)

## 🛠️ Development

### Requirements
- **Admin**: PHP 8.2+, Composer, MySQL/PostgreSQL
- **API**: Node.js 18+, npm/yarn
- **POS**: Node.js 18+, npm

### Environment Variables
Each folder has `.env.example` - copy and configure:
- `admin/.env` - Laravel config
- `api/.env` - NestJS config
- `kasir-desktop/.env` - API base URL

## 📦 Deployment

### Admin Dashboard
```bash
cd admin
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### API Backend
```bash
cd api
npm run build
npm run start:prod
```

### POS Desktop App
Build installer and distribute `.exe` file:
```bash
cd kasir-desktop
npm run electron:build:win
```

Users install once, works offline, sync when needed.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is proprietary and confidential.

## 👨‍💻 Author

Built with ❤️ for modern POS solutions

---

**Version**: 1.0.0  
**Last Updated**: January 2025
