#!/bin/bash

# Script to deploy database connectivity fix
# This script ensures the fix is properly applied and the server is restarted

echo "🚀 Deploying database connectivity fix..."

# 1. Stop any running server processes
echo "🛑 Stopping server processes..."
pkill -f "tsx server.ts" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
sleep 2

# 2. Clean build cache
echo "🧹 Cleaning build cache..."
rm -rf .next/* 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true

# 3. Verify the fix is in place
echo "🔍 Verifying database connectivity fix..."
if grep -q "\$queryRaw.*SELECT 1 as test" src/lib/system-test.ts; then
    echo "✅ Fix is present in system-test.ts"
else
    echo "❌ Fix not found in system-test.ts"
    exit 1
fi

# 4. Test database connectivity directly
echo "🧪 Testing database connectivity..."
node scripts/test-fixed-db.js
if [ $? -eq 0 ]; then
    echo "✅ Database connectivity test passed"
else
    echo "❌ Database connectivity test failed"
    exit 1
fi

# 5. Start the server
echo "🚀 Starting server..."
npm run dev > dev.log 2>&1 &
SERVER_PID=$!

# 6. Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 10

# 7. Test the API endpoint
echo "🧪 Testing API endpoint..."
curl -s http://localhost:3000/api/system-health > /tmp/api-test-result.json

# 8. Check the result
if grep -q "Database Connectivity.*PASS" /tmp/api-test-result.json; then
    echo "✅ API test passed - Database connectivity is working!"
    echo "🎉 Fix deployed successfully!"
    echo "📊 API Result:"
    cat /tmp/api-test-result.json | grep -A5 -B5 "Database Connectivity"
else
    echo "❌ API test failed - Database connectivity still not working"
    echo "🔍 Full API result:"
    cat /tmp/api-test-result.json
    exit 1
fi

echo "✅ All tests passed! The fix is working correctly."
echo "🌐 Server is running at http://localhost:3000"
echo "📊 Health check available at http://localhost:3000/api/system-health"