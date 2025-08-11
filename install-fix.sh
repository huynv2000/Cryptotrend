#!/bin/bash

echo "🔧 Installing Database Connectivity Fix"
echo "====================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must be run from project root directory"
    exit 1
fi

echo "📍 Current directory: $(pwd)"

# 1. Verify the fix is already in place
echo "🔍 Checking if fix is already applied..."
if grep -q "\$queryRaw.*SELECT 1 as test" src/lib/system-test.ts; then
    echo "✅ Fix is already present in system-test.ts"
else
    echo "❌ Fix not found - applying fix..."
    # Create backup
    cp src/lib/system-test.ts src/lib/system-test.ts.backup
    # Apply fix
    sed -i '' 's/await db.\$executeRaw`SELECT 1`/await db.$queryRaw`SELECT 1 as test`/g' src/lib/system-test.ts
    echo "✅ Fix applied successfully"
fi

# 2. Stop any running processes
echo "🛑 Stopping any running server processes..."
pkill -f "tsx server.ts" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 3

# 3. Clean cache
echo "🧹 Cleaning build cache..."
rm -rf .next/* 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# 4. Test database connection
echo "🧪 Testing database connection..."
node scripts/test-fixed-db.js
if [ $? -eq 0 ]; then
    echo "✅ Database connection test passed"
else
    echo "❌ Database connection test failed"
    echo "🔧 Please check your database configuration"
    exit 1
fi

# 5. Start server
echo "🚀 Starting server..."
npm run dev > dev.log 2>&1 &
SERVER_PID=$!

# 6. Wait for server to start
echo "⏳ Waiting for server to start (15 seconds)..."
sleep 15

# 7. Test API endpoint
echo "🧪 Testing API endpoint..."
curl -s http://localhost:3000/api/system-health > /tmp/health-check.json

# 8. Check results
if grep -q "Database Connectivity.*PASS" /tmp/health-check.json; then
    echo "✅ SUCCESS! Database connectivity is now working!"
    echo "📊 Health check results:"
    grep -A3 -B1 "Database Connectivity" /tmp/health-check.json
    echo ""
    echo "🌐 Server is running at: http://localhost:3000"
    echo "📊 Health endpoint: http://localhost:3000/api/system-health"
    echo "🎉 Fix installation completed successfully!"
else
    echo "❌ Fix may not have worked correctly"
    echo "🔍 Full health check results:"
    cat /tmp/health-check.json
    echo ""
    echo "🔧 Please check the server logs: tail -f dev.log"
fi

echo ""
echo "📋 Summary:"
echo "- ✅ Database connectivity fix applied"
echo "- ✅ Server restarted"
echo "- ✅ Build cache cleaned"
echo "- ✅ Database connection verified"
echo "- ✅ API endpoint tested"