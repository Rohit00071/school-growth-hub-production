# 🚀 School Growth Hub - Local Fleet Launcher (Robust Edition)
$basePath = "c:\games\New folder\solve error\school-growth-hub-main"
Write-Host "--- 🏁 Starting School Growth Hub Fleet at $basePath ---" -ForegroundColor Cyan

# 0. Kill existing
Write-Host "🧹 Cleaning up existing processes..."
taskkill /F /IM node.exe /T 2>$null
taskkill /F /IM nodemon.exe /T 2>$null
taskkill /F /IM ts-node.exe /T 2>$null

# 1. API Gateway
Write-Host "📡 Launching API Gateway..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$basePath\services\gateway'; npx ts-node --transpile-only src/index.ts" -WindowStyle Minimized

# 2. Services
Write-Host "📡 Launching Microservices..." -ForegroundColor Yellow
$services = @("user-service", "observation-service", "goal-service", "document-service", "notification-service", "analytics-service")
foreach ($svc in $services) {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$basePath\services\$svc'; npx ts-node --transpile-only src/index.ts" -WindowStyle Minimized
}

# 3. Legacy Monolith
Write-Host "📡 Launching Monolith..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$basePath\backend'; npx ts-node --transpile-only src/index.ts" -WindowStyle Minimized

# 4. Frontend
Write-Host "📡 Launching Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$basePath'; npm run dev" -WindowStyle Normal

Write-Host "`n✅ Fleet launch command sent." -ForegroundColor Green
Write-Host "Please wait ~10 seconds for services to initialize." -ForegroundColor White
Write-Host "URL: http://localhost:8080" -ForegroundColor White
