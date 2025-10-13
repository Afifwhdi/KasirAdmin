# Kill process using port 3000
$port = 3000

Write-Host "Checking port $port..." -ForegroundColor Cyan

$connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue

if ($connections) {
    $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
    
    Write-Host "Found $($processes.Count) process(es) using port $port" -ForegroundColor Yellow
    
    foreach ($pid in $processes) {
        $processName = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName
        Write-Host "  PID $pid ($processName)" -ForegroundColor Gray
        
        Write-Host "  Killing PID $pid..." -ForegroundColor Yellow
        Stop-Process -Id $pid -Force
        Write-Host "  ✅ Killed!" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "✅ All processes killed! Port $port is now free." -ForegroundColor Green
    
} else {
    Write-Host "✅ No process using port $port" -ForegroundColor Green
}

Write-Host ""
Write-Host "You can now run: npm run start:dev" -ForegroundColor Cyan
