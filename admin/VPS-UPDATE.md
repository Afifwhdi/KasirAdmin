# Quick Update Guide - VPS (154.19.37.167)

Panduan cepat untuk update aplikasi di VPS Anda.

## URLs

- **Admin Panel**: http://154.19.37.167/admin
- **API Endpoint**: http://154.19.37.167/api
- **VPS IP**: 154.19.37.167

## Update dari Local ke VPS

### 1. Push Changes dari Local (Windows)

```powershell
# Di folder D:\Project\Program\KasirAdmin\admin

# Cek status
git status

# Add semua perubahan
git add .

# Commit dengan pesan yang jelas
git commit -m "Update: [deskripsi perubahan]"

# Push ke GitHub
git push origin main
```

### 2. Pull & Deploy di VPS

```bash
# SSH ke VPS
ssh root@154.19.37.167

# Navigate ke project
cd /var/www/KasirAdmin/admin

# Option A: Menggunakan deployment script (Recommended)
chmod +x deploy-vps.sh
./deploy-vps.sh

# Option B: Manual update
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan optimize
php artisan filament:optimize
```

## Quick Commands

### Deploy Otomatis
```bash
ssh root@154.19.37.167 "cd /var/www/KasirAdmin/admin && ./deploy-vps.sh"
```

### Check Status
```bash
ssh root@154.19.37.167 "cd /var/www/KasirAdmin/admin && php artisan about"
```

### View Logs
```bash
ssh root@154.19.37.167 "cd /var/www/KasirAdmin/admin && tail -f storage/logs/laravel.log"
```

### Clear Cache
```bash
ssh root@154.19.37.167 "cd /var/www/KasirAdmin/admin && php artisan optimize:clear"
```

## Troubleshooting

### 1. Permission Issues
```bash
ssh root@154.19.37.167
cd /var/www/KasirAdmin/admin
sudo chown -R www-data:www-data storage bootstrap/cache
sudo chmod -R 775 storage bootstrap/cache
```

### 2. Composer Issues
```bash
# Di VPS
composer install --no-dev --optimize-autoloader --no-scripts
composer dump-autoload
```

### 3. Migration Issues
```bash
# Di VPS
php artisan migrate:status
php artisan migrate --force
```

### 4. Cache Issues
```bash
# Di VPS
php artisan optimize:clear
rm -rf bootstrap/cache/*.php
php artisan optimize
```

### 5. Database Connection Issues
```bash
# Check .env di VPS
cat .env | grep DB_

# Test connection
php artisan tinker
>>> DB::connection()->getPdo();
```

## Common Workflows

### Update Feature Baru
```bash
# Local
git add .
git commit -m "feat: menambahkan fitur X"
git push origin main

# VPS
ssh root@154.19.37.167 "cd /var/www/KasirAdmin/admin && ./deploy-vps.sh"
```

### Fix Bug
```bash
# Local
git add .
git commit -m "fix: memperbaiki bug Y"
git push origin main

# VPS
ssh root@154.19.37.167 "cd /var/www/KasirAdmin/admin && git pull && php artisan optimize:clear && php artisan optimize"
```

### Update Dependencies
```bash
# Local (setelah composer update)
git add composer.json composer.lock
git commit -m "chore: update dependencies"
git push origin main

# VPS
ssh root@154.19.37.167 "cd /var/www/KasirAdmin/admin && ./deploy-vps.sh"
```

### Database Migration
```bash
# Local (setelah buat migration)
git add .
git commit -m "feat: add migration for X"
git push origin main

# VPS
ssh root@154.19.37.167 "cd /var/www/KasirAdmin/admin && git pull && php artisan migrate --force"
```

## Rollback

Jika ada masalah setelah deployment:

```bash
# Di VPS
cd /var/www/KasirAdmin/admin

# Lihat commit history
git log --oneline -10

# Rollback ke commit sebelumnya
git reset --hard COMMIT_HASH

# Clear cache
php artisan optimize:clear
php artisan optimize

# Enable aplikasi kembali
php artisan up
```

## Backup & Restore

### Manual Backup
```bash
# Di VPS
cd /var/www/KasirAdmin/admin

# Backup database
pg_dump -U your_user your_database > backup_$(date +%Y%m%d).sql

# Backup files
tar -czf backup_files_$(date +%Y%m%d).tar.gz storage/ .env
```

### Restore dari Backup
```bash
# Di VPS
cd /var/www/KasirAdmin/admin

# Restore database
psql -U your_user your_database < backup_20250116.sql

# Restore files
tar -xzf backup_files_20250116.tar.gz
```

## Monitoring

### Check Application Status
```bash
ssh root@154.19.37.167 "cd /var/www/KasirAdmin/admin && php artisan about"
```

### Check Disk Space
```bash
ssh root@154.19.37.167 "df -h"
```

### Check Memory
```bash
ssh root@154.19.37.167 "free -h"
```

### Check Processes
```bash
ssh root@154.19.37.167 "ps aux | grep php"
```

## SSH Configuration (Optional)

Untuk mempercepat koneksi, tambahkan ke `~/.ssh/config`:

```
Host kasiradmin
    HostName 154.19.37.167
    User root
    IdentityFile ~/.ssh/id_rsa
```

Lalu Anda bisa SSH dengan:
```bash
ssh kasiradmin
```

## One-Line Deploy

Setelah push ke GitHub, deploy dengan satu command:

```bash
ssh root@154.19.37.167 "cd /var/www/KasirAdmin/admin && git pull origin main && composer install --no-dev --optimize-autoloader && php artisan migrate --force && php artisan optimize && php artisan filament:optimize"
```

## Environment Differences

### Local (.env)
```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://127.0.0.1:8000
```

### VPS (.env)
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=http://154.19.37.167
```

Jangan pernah commit file `.env` ke Git!

---

**Tips**: Buat alias di PowerShell untuk commands yang sering dipakai:

```powershell
# Tambahkan ke PowerShell profile
function Deploy-KasirAdmin {
    ssh root@154.19.37.167 "cd /var/www/KasirAdmin/admin && ./deploy-vps.sh"
}

# Usage
Deploy-KasirAdmin
```
