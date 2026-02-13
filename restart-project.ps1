# Complete Project Restart Script

Write-Host "🔄 Restarting School Growth Hub..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Kill all Node processes (clean slate)
Write-Host "1️⃣ Stopping all Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Step 2: Seed the User Service database
Write-Host "2️⃣ Seeding User Service database..." -ForegroundColor Yellow
cd "c:\games\New folder\solve error\school-growth-hub-main\backend\services\user-service"
npx ts-node src/seed.ts
cd "c:\games\New folder\solve error\school-growth-hub-main"
Start-Sleep -Seconds 2

# Step 3: Start all services
Write-Host "3️⃣ Starting all services..." -ForegroundColor Yellow
Write-Host ""

# Start Gateway
Write-Host "   ▶ Gateway (Port 12348)" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\services\gateway'; npx ts-node src/index.ts"
Start-Sleep -Seconds 3

# Start User Service
Write-Host "   ▶ User Service (Port 3001)" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\services\user-service'; npx ts-node src/index.ts"
Start-Sleep -Seconds 3

# Start Observation Service
Write-Host "   ▶ Observation Service (Port 3002)" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\services\observation-service'; npx ts-node src/index.ts"
Start-Sleep -Seconds 2

# Start Goal Service
Write-Host "   ▶ Goal Service (Port 3003)" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\services\goal-service'; npx ts-node src/index.ts"
Start-Sleep -Seconds 2

# Start Document Service
Write-Host "   ▶ Document Service (Port 3004)" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\services\document-service'; npx ts-node src/index.ts"
Start-Sleep -Seconds 2

# Start Backend Monolith
Write-Host "   ▶ Backend Monolith (Port 4000)" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\backend\monolith'; npx ts-node src/index.ts"
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "   ▶ Frontend (Port 8080)" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\games\New folder\solve error\school-growth-hub-main\frontend'; npm run dev"
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "✅ All services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Access Points:" -ForegroundColor Cyan
Write-Host "   Frontend: http://localhost:8080" -ForegroundColor White
Write-Host "   Gateway:  http://localhost:12348" -ForegroundColor White
Write-Host ""
Write-Host "🔑 Login Credentials:" -ForegroundColor Cyan
Write-Host "   Super Admin: bharath.superadmin@pdi.com / Bharath@123" -ForegroundColor White
Write-Host "   School Leader: rohit.schoolleader@pdi.com / Rohit@123" -ForegroundColor White
Write-Host "   Teacher: teacher1.btmlayout@pdi.com / Teacher1@123" -ForegroundColor White
Write-Host ""
Write-Host "💡 Tip: Clear your browser cache (Ctrl+Shift+Delete) if login still fails" -ForegroundColor Yellow
Write-Host ""
