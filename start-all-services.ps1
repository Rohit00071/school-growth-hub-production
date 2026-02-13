# School Growth Hub - Start All Services

Write-Host "🚀 Starting School Growth Hub..." -ForegroundColor Green
Write-Host ""

# Start Gateway
Write-Host "Starting API Gateway (Port 12348)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\services\gateway'; npx ts-node src/index.ts"

Start-Sleep -Seconds 2

# Start User Service
Write-Host "Starting User Service (Port 3001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\services\user-service'; npx ts-node src/index.ts"

Start-Sleep -Seconds 2

# Start Observation Service
Write-Host "Starting Observation Service (Port 3002)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\services\observation-service'; npx ts-node src/index.ts"

Start-Sleep -Seconds 2

# Start Goal Service
Write-Host "Starting Goal Service (Port 3003)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\services\goal-service'; npx ts-node src/index.ts"

Start-Sleep -Seconds 2

# Start Document Service
Write-Host "Starting Document Service (Port 3004)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\services\document-service'; npx ts-node src/index.ts"

Start-Sleep -Seconds 2

# Start Notification Service
Write-Host "Starting Notification Service (Port 3005)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\services\notification-service'; npx ts-node src/index.ts"

Start-Sleep -Seconds 2

# Start Analytics Service
Write-Host "Starting Analytics Service (Port 3006)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\services\analytics-service'; npx ts-node src/index.ts"

Start-Sleep -Seconds 2

# Start Backend Monolith
Write-Host "Starting Backend Monolith (Port 4000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\monolith'; npx ts-node src/index.ts"

Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Frontend (Port 8080)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\frontend'; npm run dev"

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your application at:" -ForegroundColor Yellow
Write-Host "  Local: http://localhost:8080" -ForegroundColor White
Write-Host ""
Write-Host "Login Credentials:" -ForegroundColor Yellow
Write-Host "  Super Admin: bharath.superadmin@pdi.com / Bharath@123" -ForegroundColor White
Write-Host "  School Leader: rohit.schoolleader@pdi.com / Rohit@123" -ForegroundColor White
Write-Host "  Teacher: teacher1.btmlayout@pdi.com / Teacher1@123" -ForegroundColor White
Write-Host ""
