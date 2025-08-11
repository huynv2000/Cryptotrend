#!/bin/bash

echo "🧪 Testing Database Connectivity Fix"
echo "=================================="

# Test 1: System Health Check
echo "1. Testing System Health..."
HEALTH_RESPONSE=$(curl -s "http://localhost:3000/api/system-health")
echo "Response: $HEALTH_RESPONSE"

# Extract database status
DB_STATUS=$(echo "$HEALTH_RESPONSE" | grep -o '"name":"Database Connectivity","status":"[^"]*"' | cut -d'" -f4)
echo "Database Status: $DB_STATUS"

if [ "$DB_STATUS" = "PASS" ]; then
    echo "✅ Database connectivity fix successful!"
else
    echo "❌ Database connectivity still failing"
fi

echo ""

# Test 2: Debug Database
echo "2. Testing Debug Database Endpoint..."
DEBUG_RESPONSE=$(curl -s "http://localhost:3000/api/debug/database")
CRYPTO_COUNT=$(echo "$DEBUG_RESPONSE" | grep -o '"cryptocurrencies":[0-9]*' | cut -d':' -f2)
echo "Cryptocurrencies in database: $CRYPTO_COUNT"

if [ "$CRYPTO_COUNT" -gt 0 ]; then
    echo "✅ Database contains data!"
else
    echo "❌ Database appears empty"
fi

echo ""

# Test 3: Dashboard API
echo "3. Testing Dashboard API..."
DASHBOARD_RESPONSE=$(curl -s "http://localhost:3000/api/dashboard?coinId=bitcoin")
PRICE=$(echo "$DASHBOARD_RESPONSE" | grep -o '"usd":[0-9.]*' | cut -d':' -f2)
echo "Bitcoin Price: $PRICE"

if [ "$PRICE" != "" ] && [ "$PRICE" != "null" ]; then
    echo "✅ Dashboard API working with real data!"
else
    echo "❌ Dashboard API not returning price data"
fi

echo ""
echo "🎯 Test Summary"
echo "==============="
echo "Database Connectivity: $DB_STATUS"
echo "Crypto Count: $CRYPTO_COUNT"
echo "Bitcoin Price: $PRICE"

if [ "$DB_STATUS" = "PASS" ] && [ "$CRYPTO_COUNT" -gt 0 ] && [ "$PRICE" != "" ] && [ "$PRICE" != "null" ]; then
    echo "🎉 All tests passed! Database fix successful."
    exit 0
else
    echo "⚠️  Some tests failed. Check the responses above."
    exit 1
fi