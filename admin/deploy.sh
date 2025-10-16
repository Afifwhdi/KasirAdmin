#!/bin/bash

# KasirAdmin Deployment Script
# This script pulls the latest code from GitHub and updates the application

set -e

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /path/to/your/project

# Enable maintenance mode
echo "📦 Enabling maintenance mode..."
php artisan down || true

# Pull latest code from GitHub
echo "⬇️  Pulling latest code from GitHub..."
git pull origin main

# Install/Update composer dependencies (production)
echo "📚 Installing composer dependencies..."
composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Clear and cache config
echo "⚙️  Optimizing configuration..."
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Run database migrations
echo "🗄️  Running database migrations..."
php artisan migrate --force

# Cache for performance
echo "🚀 Caching for production..."
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan filament:optimize

# Set proper permissions
echo "🔐 Setting permissions..."
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Restart queue workers if using queues
# supervisorctl restart laravel-worker:*

# Disable maintenance mode
echo "✅ Disabling maintenance mode..."
php artisan up

echo "🎉 Deployment completed successfully!"
