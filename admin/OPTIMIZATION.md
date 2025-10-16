# Production Optimization Checklist

## Pre-Deployment Optimizations

### 1. Composer Optimization
```bash
# Remove dev dependencies and optimize autoloader
composer install --optimize-autoloader --no-dev
```

### 2. Configuration Caching
```bash
# Cache configuration files
php artisan config:cache

# Cache routes
php artisan route:cache

# Cache views
php artisan view:cache

# Optimize Filament
php artisan filament:optimize
```

### 3. Database Optimization
```bash
# Run migrations in production
php artisan migrate --force

# Optimize database queries (add indexes where needed)
```

### 4. Asset Optimization
```bash
# If using Vite/Mix
npm run build

# Clear old assets
php artisan view:clear
```

### 5. Environment Configuration

Ensure `.env` for production has:
```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com

# Database optimizations
DB_CONNECTION=pgsql
# Use connection pooling if available

# Session & Cache
SESSION_DRIVER=database  # or redis for better performance
CACHE_DRIVER=redis       # or memcached
QUEUE_CONNECTION=database # or redis

# Logging
LOG_CHANNEL=daily
LOG_LEVEL=error

# Security
SESSION_SECURE_COOKIE=true
```

## Performance Optimizations

### 1. OPcache Configuration (php.ini)
```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000
opcache.validate_timestamps=0
opcache.save_comments=1
opcache.fast_shutdown=1
```

### 2. Laravel Query Optimization
- Use eager loading untuk relationships
- Add database indexes
- Use chunk() untuk large datasets
- Cache expensive queries

### 3. Filament Specific
```php
// In AppServiceProvider
use Filament\Support\Facades\FilamentAsset;

public function boot()
{
    // Preload assets
    FilamentAsset::register([
        // Your assets
    ]);
}
```

### 4. Database Indexing
```sql
-- Add indexes untuk kolom yang sering di-query
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_transactions_date ON transactions(created_at);
CREATE INDEX idx_inventory_type ON inventories(type);
```

### 5. Redis Configuration (if using)
```env
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
CACHE_PREFIX=kasir_admin_cache
```

## Security Optimizations

### 1. Environment Security
```bash
# Restrict file permissions
chmod 644 .env
chmod 755 storage
chmod 755 bootstrap/cache

# Ensure web server user owns files
chown -R www-data:www-data /var/www/html
```

### 2. Rate Limiting
Configure in `config/sanctum.php` or middleware

### 3. CORS Configuration
Update `config/cors.php` if needed

### 4. CSP Headers (Nginx)
```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

## Monitoring & Maintenance

### 1. Setup Queue Workers
```bash
# Using Supervisor
sudo nano /etc/supervisor/conf.d/laravel-worker.conf
```

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/artisan queue:work --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/html/storage/logs/worker.log
stopwaitsecs=3600
```

### 2. Schedule Tasks
```bash
# Add to crontab
* * * * * cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1
```

### 3. Log Rotation
```bash
# Create logrotate config
sudo nano /etc/logrotate.d/laravel
```

```
/var/www/html/storage/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

### 4. Health Checks
Create endpoint untuk monitoring:
```php
// routes/web.php
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now(),
    ]);
});
```

## Troubleshooting Performance Issues

### 1. Enable Query Logging (temporary)
```php
DB::enableQueryLog();
// Your code
dd(DB::getQueryLog());
```

### 2. Check Slow Queries
```sql
-- PostgreSQL
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### 3. Profile with Laravel Debugbar (development only)
```bash
composer require barryvdh/laravel-debugbar --dev
```

### 4. Monitor with Laravel Telescope (development)
Already installed in this project - use for debugging.

## Benchmarking

### Before optimization:
```bash
# Install Apache Bench
sudo apt-get install apache2-utils

# Test performance
ab -n 1000 -c 10 https://your-domain.com/
```

### Expected Results (Target):
- Response time: < 200ms
- Throughput: > 100 req/sec
- Database queries: < 50ms average

## Post-Deployment Checklist

- [ ] All caches are cleared and rebuilt
- [ ] Database migrations ran successfully
- [ ] SSL certificate is active
- [ ] Monitoring tools are active
- [ ] Backup system is running
- [ ] Queue workers are running
- [ ] Scheduler is active
- [ ] Logs are being written
- [ ] Error tracking is active
- [ ] Performance is within acceptable range

## Regular Maintenance Tasks

### Daily
- Check error logs
- Monitor disk space
- Verify backups

### Weekly
- Review slow query log
- Check system resources
- Update dependencies (security patches)

### Monthly
- Full backup verification
- Performance audit
- Security audit
- Clean old logs and cache

## Useful Commands

```bash
# Clear all caches
php artisan optimize:clear

# Rebuild all caches
php artisan optimize

# Check current cache status
php artisan cache:table
php artisan queue:table

# Monitor logs in real-time
tail -f storage/logs/laravel.log

# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
ps aux | grep php
```
