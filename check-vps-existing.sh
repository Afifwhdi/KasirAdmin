#!/bin/bash

echo "========================================"
echo "🔍 Checking Existing VPS Setup..."
echo "========================================"
echo ""

# Check OS
echo "📌 OS Info:"
cat /etc/os-release | grep PRETTY_NAME
echo ""

# Check PostgreSQL
echo "📌 PostgreSQL:"
if command -v psql &> /dev/null; then
    psql --version
    systemctl status postgresql --no-pager | head -3
else
    echo "❌ Not installed"
fi
echo ""

# Check Redis
echo "📌 Redis:"
if command -v redis-cli &> /dev/null; then
    redis-cli --version
    systemctl status redis-server --no-pager | head -3 2>/dev/null || systemctl status redis --no-pager | head -3
else
    echo "❌ Not installed"
fi
echo ""

# Check Node.js
echo "📌 Node.js:"
if command -v node &> /dev/null; then
    node -v
    npm -v
else
    echo "❌ Not installed"
fi
echo ""

# Check PHP
echo "📌 PHP:"
if command -v php &> /dev/null; then
    php -v | head -1
    echo "Extensions:"
    php -m | grep -E "pgsql|redis|pdo_pgsql"
else
    echo "❌ Not installed"
fi
echo ""

# Check Composer
echo "📌 Composer:"
if command -v composer &> /dev/null; then
    composer -V
else
    echo "❌ Not installed"
fi
echo ""

# Check Nginx
echo "📌 Nginx:"
if command -v nginx &> /dev/null; then
    nginx -v
    systemctl status nginx --no-pager | head -3
else
    echo "❌ Not installed"
fi
echo ""

# Check Supervisor
echo "📌 Supervisor:"
if command -v supervisorctl &> /dev/null; then
    supervisorctl version
    supervisorctl status
else
    echo "❌ Not installed"
fi
echo ""

# Check existing app
echo "📌 Existing Laravel App:"
if [ -d "/var/www/KasirAdmin" ]; then
    echo "✅ Found: /var/www/KasirAdmin"
    ls -la /var/www/KasirAdmin
    echo ""
    if [ -f "/var/www/KasirAdmin/admin/.env" ]; then
        echo "📄 Current .env database config:"
        cat /var/www/KasirAdmin/admin/.env | grep DB_
    fi
else
    echo "❌ Not found"
fi
echo ""

# Check database connection
echo "📌 Current Database:"
if [ -f "/var/www/KasirAdmin/admin/.env" ]; then
    source /var/www/KasirAdmin/admin/.env
    echo "DB_CONNECTION: $DB_CONNECTION"
    echo "DB_HOST: $DB_HOST"
    echo "DB_DATABASE: $DB_DATABASE"
fi
echo ""

echo "========================================"
echo "✅ Check Complete!"
echo "========================================"
