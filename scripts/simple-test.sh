#!/bin/bash

# Simple API Test Script for Crypto Analytics Dashboard Pro
# Run this script with: bash scripts/simple-test.sh

echo "🚀 Crypto Analytics Dashboard Pro - Simple API Test Script"
echo "============================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -e "${BLUE}Testing $name...${NC}"
    response=$(curl -s "$url" 2>/dev/null)
    
    if [[ $response == *"$expected"* ]]; then
        echo -e "${GREEN}✅ $name - PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ $name - FAIL${NC}"
        echo "Expected: $expected"
        echo "Response: $response"
        return 1
    fi
}

# Basic tests
echo "Running basic API tests..."
echo ""

# Test 1: Health check
test_endpoint "Health Check" "http://localhost:3000/api/health" "status"

# Test 2: AI Analysis status
test_endpoint "AI Analysis Status" "http://localhost:3000/api/ai-analysis?action=status" "initialized"

# Test 3: Dashboard data
test_endpoint "Dashboard Data" "http://localhost:3000/api/dashboard?coinId=bitcoin" "price"

# Test 4: Cryptocurrencies list
test_endpoint "Cryptocurrencies List" "http://localhost:3000/api/cryptocurrencies" "coinGeckoId"

# Test 5: Trading signals
test_endpoint "Trading Signals" "http://localhost:3000/api/trading-signals-fast?action=signal&coinId=bitcoin" "signal"

echo ""
echo "✅ Basic tests completed!"
echo ""
echo "For comprehensive testing, run the full test script:"
echo "bash scripts/test-apis.sh"
echo ""
echo "For manual testing, try these commands:"
echo "curl -s \"http://localhost:3000/api/health\""
echo "curl -s \"http://localhost:3000/api/ai-analysis?action=status\""
echo "curl -s \"http://localhost:3000/api/dashboard?coinId=bitcoin\""