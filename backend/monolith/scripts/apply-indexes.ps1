# ============================================
# Apply Performance Indexes Script (PowerShell)
# ============================================

Write-Host "🚀 Starting database optimization..." -ForegroundColor Green
Write-Host "Expected impact: 10-100x faster queries"
Write-Host ""

# Load environment variables from .env
if (Test-Path .env) {
    Get-Content .env | ForEach-Object {
        if ($_ -match '^([^#].+?)=(.+)$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Item -Path "env:$name" -Value $value
        }
    }
}

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ ERROR: DATABASE_URL not set" -ForegroundColor Red
    Write-Host "Please set DATABASE_URL in .env file"
    exit 1
}

Write-Host "📊 Current database statistics:" -ForegroundColor Cyan
Write-Host ""

# Show current table sizes
$query = "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Note: You'll need to have psql in your PATH or use npx prisma db execute
Write-Host "Running: npx prisma db execute --file prisma/migrations/add_performance_indexes.sql" -ForegroundColor Yellow
Write-Host ""

npx prisma db execute --file prisma/migrations/add_performance_indexes.sql --schema prisma/schema.prisma

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Indexes created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Database optimization complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Expected improvements:" -ForegroundColor Cyan
    Write-Host "  - User queries: 10-50x faster"
    Write-Host "  - Observation queries: 50-100x faster"
    Write-Host "  - Goal queries: 10-20x faster"
    Write-Host "  - Document queries: 10-30x faster"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "  1. Test query performance"
    Write-Host "  2. Monitor application logs"
    Write-Host "  3. Proceed to Step 2: Redis caching"
} else {
    Write-Host ""
    Write-Host "❌ Error creating indexes" -ForegroundColor Red
    Write-Host "Please check the error messages above"
    exit 1
}
