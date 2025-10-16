# KasirAdmin

Aplikasi Point of Sale (POS) dan manajemen kasir berbasis web menggunakan Laravel 12 dan Filament 3.

## Features

- 🛒 **Manajemen Produk** - Kelola produk, kategori, dan inventory
- 💰 **Transaksi Penjualan** - Proses transaksi dengan berbagai metode pembayaran
- 📊 **Laporan Keuangan** - Laporan penjualan, alur kas, dan profit
- 📦 **Manajemen Inventory** - Track stok masuk, keluar, dan penyesuaian
- 🧾 **Metode Pembayaran** - Support cash dan non-cash payment
- 👥 **Multi User** - Admin dan Kasir dengan role-based access
- 🖨️ **Print Receipt** - Cetak struk via printer thermal
- 📱 **Responsive Design** - Optimized untuk desktop dan tablet

## Tech Stack

- **Laravel 12** - PHP Framework
- **Filament 3.3** - Admin Panel Builder
- **PostgreSQL** - Database (via Supabase)
- **Livewire 3** - Reactive Components
- **Tailwind CSS** - Styling
- **Alpine.js** - JavaScript Framework

## Requirements

- PHP >= 8.2
- PostgreSQL
- Composer
- Node.js & NPM
- Git

## Installation

### Local Development

```bash
# Clone repository
git clone https://github.com/your-username/KasirAdmin.git
cd KasirAdmin/admin

# Install dependencies
composer install
npm install

# Setup environment
cp .env.example .env
php artisan key:generate

# Configure database in .env
DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_PORT=5432
DB_DATABASE=your-database
DB_USERNAME=your-username
DB_PASSWORD=your-password

# Run migrations
php artisan migrate

# Run seeders (optional)
php artisan db:seed

# Create storage link
php artisan storage:link

# Build assets (if needed)
npm run dev

# Start development server
php artisan serve
```

### Production Deployment

Lihat panduan lengkap di [DEPLOYMENT.md](DEPLOYMENT.md)

## Configuration

### Environment Variables

Key environment variables yang perlu dikonfigurasi:

```env
APP_NAME="Admin Kasir"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=pgsql
DB_HOST=your-db-host
DB_DATABASE=your-database
DB_USERNAME=your-username
DB_PASSWORD=your-password

POS_SYNC_TOKEN=your-secure-token
```

### Printer Setup

Untuk konfigurasi printer thermal, edit di menu Pengaturan atau langsung di database.

## Usage

### Default Login

After running seeders (if applicable):
- Email: admin@example.com
- Password: password

**Note:** Segera ganti password default setelah first login!

### Create User

```bash
php artisan make:filament-user
```

## Development

### Code Style

Project ini menggunakan Laravel Pint untuk code styling:

```bash
# Check code style
./vendor/bin/pint --test

# Fix code style
./vendor/bin/pint
```

### Testing

```bash
# Run tests
php artisan test

# Run with coverage
php artisan test --coverage
```

### Database Migrations

```bash
# Create new migration
php artisan make:migration create_table_name

# Run migrations
php artisan migrate

# Rollback
php artisan migrate:rollback
```

## Optimization

Untuk optimisasi production, lihat [OPTIMIZATION.md](OPTIMIZATION.md)

Quick optimization commands:

```bash
# Optimize for production
php artisan optimize
php artisan filament:optimize

# Clear all caches
php artisan optimize:clear
```

## Deployment

### Quick Deploy to VPS

```bash
# Pull latest changes
git pull origin main

# Run deployment script
./deploy.sh
```

### Manual Deployment Steps

```bash
php artisan down
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan up
```

## Project Structure

```
admin/
├── app/
│   ├── Filament/        # Filament resources & pages
│   ├── Http/            # Controllers, Middleware
│   ├── Models/          # Eloquent models
│   └── Services/        # Business logic services
├── config/              # Configuration files
├── database/            # Migrations & seeders
├── public/              # Public assets
├── resources/           # Views & assets
├── routes/              # Route definitions
├── storage/             # Logs, cache, uploads
└── tests/               # Test files
```

## API Documentation

API untuk sync dengan POS desktop menggunakan Sanctum authentication.

```
POST /api/sync
Authorization: Bearer {POS_SYNC_TOKEN}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Security

Jika menemukan security vulnerability, kirim email ke: security@example.com

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

- 📧 Email: support@example.com
- 📖 Documentation: [DEPLOYMENT.md](DEPLOYMENT.md), [OPTIMIZATION.md](OPTIMIZATION.md)
- 🐛 Issues: GitHub Issues

## Credits

- Built with [Laravel](https://laravel.com)
- Admin panel by [Filament](https://filamentphp.com)
- Icons by [Heroicons](https://heroicons.com)

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Product management
- Transaction processing
- Financial reports
- Inventory tracking
- User management
- Printer integration

---

Made with ❤️ for Indonesian small businesses
