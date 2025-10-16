# Deployment Guide - KasirAdmin

Panduan deployment aplikasi KasirAdmin ke VPS.

## Prerequisites

Pastikan VPS Anda sudah memiliki:
- PHP >= 8.2
- PostgreSQL
- Composer
- Git
- Nginx/Apache
- Node.js & NPM (untuk build assets)

## Setup Awal di VPS

### 1. Clone Repository

```bash
cd /var/www
git clone https://github.com/your-username/KasirAdmin.git
cd KasirAdmin/admin
```

### 2. Setup Environment

```bash
# Copy environment file
cp .env.example .env

# Edit .env dengan konfigurasi production
nano .env
```

Update konfigurasi berikut di `.env`:
- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://your-domain.com`
- Database credentials
- `SESSION_SECURE_COOKIE=true`
- `POS_SYNC_TOKEN` (gunakan token yang aman)

### 3. Install Dependencies

```bash
# Install PHP dependencies
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Install Node dependencies & build assets (jika ada)
# npm install
# npm run build
```

### 4. Generate Application Key

```bash
php artisan key:generate
```

### 5. Setup Database

```bash
# Run migrations
php artisan migrate --force

# Run seeders (jika ada)
php artisan db:seed --force
```

### 6. Setup Storage

```bash
# Create symbolic link
php artisan storage:link

# Set permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 7. Optimize for Production

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan filament:optimize
```

## Update dari GitHub (Deployment)

### Otomatis dengan Script

```bash
# Buat script executable
chmod +x deploy.sh

# Jalankan deployment
./deploy.sh
```

### Manual

```bash
# 1. Enable maintenance mode
php artisan down

# 2. Pull latest changes
git pull origin main

# 3. Update dependencies
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# 4. Clear cache
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# 5. Run migrations
php artisan migrate --force

# 6. Cache for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan filament:optimize

# 7. Disable maintenance mode
php artisan up
```

## Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/KasirAdmin/admin/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

## Setup SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Troubleshooting

### Permission Issues
```bash
sudo chown -R www-data:www-data /var/www/KasirAdmin
sudo chmod -R 755 /var/www/KasirAdmin
sudo chmod -R 775 /var/www/KasirAdmin/admin/storage
sudo chmod -R 775 /var/www/KasirAdmin/admin/bootstrap/cache
```

### Clear All Cache
```bash
php artisan optimize:clear
```

### Check Logs
```bash
tail -f storage/logs/laravel.log
```

## Security Checklist

- ✅ `APP_DEBUG=false` di production
- ✅ `APP_ENV=production`
- ✅ Strong `APP_KEY` generated
- ✅ Database credentials secure
- ✅ `SESSION_SECURE_COOKIE=true`
- ✅ HTTPS enabled
- ✅ File permissions properly set
- ✅ `.env` tidak di-commit ke Git
- ✅ Regular backups enabled

## Backup Strategy

### Database Backup
```bash
# Manual backup
pg_dump -U username database_name > backup_$(date +%Y%m%d_%H%M%S).sql

# Setup cron for daily backup
0 2 * * * /usr/bin/pg_dump -U username database_name > /backups/db_$(date +\%Y\%m\%d).sql
```

### Files Backup
```bash
# Backup storage folder
tar -czf storage_backup_$(date +%Y%m%d).tar.gz storage/
```

## Monitoring

### Setup Laravel Telescope (Development)
```bash
composer require laravel/telescope --dev
php artisan telescope:install
php artisan migrate
```

### Log Monitoring
Gunakan tools seperti:
- Laravel Horizon (untuk queues)
- Sentry (error tracking)
- New Relic / DataDog (performance monitoring)

## Support

Untuk issue atau pertanyaan, silakan buka issue di GitHub repository.
