# VPS Status Check Script
$password = "Meong!123321"
$host = "154.19.37.167"

# Create SSH command script
$commands = @"
echo '=== VPS STATUS CHECK ==='
echo ''
echo '1. PostgreSQL Status:'
systemctl status postgresql --no-pager -l | head -20
echo ''
echo '2. PostgreSQL Version:'
psql --version
echo ''
echo '3. Database List:'
sudo -u postgres psql -c '\l'
echo ''
echo '4. Redis Status:'
systemctl status redis-server --no-pager | head -10
echo ''
echo '5. Supervisor Status:'
systemctl status supervisor --no-pager | head -10
echo ''
echo '6. Laravel .env Database Config:'
grep -E '^DB_' /var/www/KasirAdmin/admin/.env
echo ''
echo '=== END STATUS CHECK ==='
"@

# Save commands to temp file
$commands | Out-File -FilePath "$env:TEMP\vps_commands.sh" -Encoding ASCII

Write-Host "Connecting to VPS..." -ForegroundColor Yellow
Write-Host "Note: You may need to enter password: $password" -ForegroundColor Cyan

# Use plink if available, otherwise use ssh
if (Get-Command plink -ErrorAction SilentlyContinue) {
    echo y | plink -ssh -pw $password root@$host -m "$env:TEMP\vps_commands.sh"
} else {
    Write-Host "Using SSH (you may need to type 'yes' for host key and enter password manually)" -ForegroundColor Yellow
    Get-Content "$env:TEMP\vps_commands.sh" | ssh root@$host
}
