#!/bin/bash

# KasirAdmin VPS Deployment Script
# VPS IP: 154.19.37.167
# This script pulls the latest code and updates both admin and API

set -e

echo "🚀 Starting KasirAdmin deployment on VPS..."

# Navigate to project directory
PROJECT_DIR="/var/www/KasirAdmin/admin"
cd $PROJECT_DIR

# Enable maintenance mode
echo "📦 Enabling maintenance mode..."
php artisan down --retry=60 || true

# Backup current state
echo "💾 Creating backup..."
BACKUP_DIR="/var/backups/kasiradmin"
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).tar.gz storage/ .env 2>/dev/null || echo "Backup warning: some files skipped"

# Pull latest code from GitHub
echo "⬇️  Pulling latest code from GitHub..."
git fetch origin
git reset --hard origin/main
git pull origin main

# Install/Update composer dependencies (production)
echo "📚 Installing composer dependencies..."
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Clear all caches first
echo "🧹 Clearing caches..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear
php artisan event:clear

# Run database migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force

# Re-cache for performance
echo "🚀 Optimizing for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan filament:optimize

# Storage link (in case it's missing)
echo "🔗 Ensuring storage link..."
php artisan storage:link 2>/dev/null || echo "Storage link already exists"

# Set proper permissions
echo "🔐 Setting permissions..."
chown -R www-data:www-data storage bootstrap/cache
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage/app storage/framework storage/logs

# Restart PHP-FPM (optional, adjust for your setup)
echo "🔄 Restarting PHP-FPM..."
sudo systemctl reload php8.3-fpm 2>/dev/null || sudo systemctl reload php8.2-fpm 2>/dev/null || echo "PHP-FPM reload skipped"

# Restart queue workers if using supervisor
if command -v supervisorctl &> /dev/null; then
    echo "🔄 Restarting queue workers..."
    sudo supervisorctl restart laravel-worker:* 2>/dev/null || echo "No queue workers configured"
fi

# Disable maintenance mode
echo "✅ Disabling maintenance mode..."
php artisan up

# Show application info
echo ""
echo "📊 Application Status:"
php artisan --version
php artisan about --only=environment

echo ""
echo "🎉 Deployment completed successfully!"
echo "🌐 Admin Panel: http://154.19.37.167/admin"
echo "🔌 API Endpoint: http://154.19.37.167/api"
echo ""
echo "⏰ Deployed at: $(date)"
