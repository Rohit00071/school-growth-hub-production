#!/bin/bash

# ============================================
# Apply Performance Indexes Script
# ============================================

echo "🚀 Starting database optimization..."
echo "Expected impact: 10-100x faster queries"
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL not set"
    echo "Please set DATABASE_URL in .env file"
    exit 1
fi

echo "📊 Current database statistics:"
psql $DATABASE_URL -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

echo ""
echo "🔨 Creating performance indexes..."
echo "This may take 2-5 minutes depending on data volume..."
echo ""

# Apply indexes
psql $DATABASE_URL -f prisma/migrations/add_performance_indexes.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Indexes created successfully!"
    echo ""
    echo "📈 Verifying indexes..."
    psql $DATABASE_URL -c "SELECT tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;"
    
    echo ""
    echo "🎉 Database optimization complete!"
    echo ""
    echo "Expected improvements:"
    echo "  - User queries: 10-50x faster"
    echo "  - Observation queries: 50-100x faster"
    echo "  - Goal queries: 10-20x faster"
    echo "  - Document queries: 10-30x faster"
    echo ""
    echo "Next steps:"
    echo "  1. Test query performance"
    echo "  2. Monitor slow query logs"
    echo "  3. Proceed to Step 2: Redis caching"
else
    echo ""
    echo "❌ Error creating indexes"
    echo "Please check the error messages above"
    exit 1
fi
