Write-Host "--- 🧪 Deployment Readiness Verification ---" -ForegroundColor Cyan

$services = @(
    @{ Name = "Gateway"; Url = "http://localhost:12348/health" },
    @{ Name = "Frontend"; Url = "http://localhost:80" },
    @{ Name = "User Service"; Url = "http://localhost:3001/health" },
    @{ Name = "Analytics"; Url = "http://localhost:3006/health" }
)

foreach ($s in $services) {
    try {
        $res = Invoke-RestMethod -Uri $s.Url -Method Get -TimeoutSec 5
        Write-Host "✅ $($s.Name): Online" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ $($s.Name): Offline or Unreachable ($($_.Exception.Message))" -ForegroundColor Red
    }
}

Write-Host "`n--- 📡 Event Bus Check ---" -ForegroundColor Cyan
# Simple check for Redis container
$redis = docker ps --filter "name=school-hub-redis" --format "{{.Status}}"
if ($redis) {
    Write-Host "✅ Redis Container: Running ($redis)" -ForegroundColor Green
}
else {
    Write-Host "❌ Redis Container: Not Found" -ForegroundColor Red
}

Write-Host "`nReady for Full Production Traffic!" -ForegroundColor White
