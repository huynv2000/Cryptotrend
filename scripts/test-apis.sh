#!/bin/bash

# API Testing Script for Crypto Analytics Dashboard Pro
# This script tests all major API endpoints and provides a comprehensive health report

echo "🚀 Crypto Analytics Dashboard Pro - API Testing Script"
echo "========================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    
    case $status in
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "INFO") echo -e "${BLUE}ℹ️  $message${NC}" ;;
    esac
}

# Function to test API endpoint
test_api() {
    local name=$1
    local url=$2
    local expected_field=$3
    local method=${4:-"GET"}
    local data=${5:-""}
    
    echo -e "${BLUE}Testing $name...${NC}"
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -X POST "$url" \
            -H "Content-Type: application/json" \
            -d "$data" 2>/dev/null)
    else
        response=$(curl -s "$url" 2>/dev/null)
    fi
    
    if [ $? -eq 0 ]; then
        if echo "$response" | grep -q "$expected_field" 2>/dev/null; then
            print_status "SUCCESS" "$name - Working correctly"
            return 0
        elif echo "$response" | grep -q "error\|Error\|fail\|Fail" 2>/dev/null; then
            print_status "ERROR" "$name - Error in response"
            echo "Response: $response"
            return 1
        else
            print_status "WARNING" "$name - Unexpected response format"
            echo "Response: $response"
            return 2
        fi
    else
        print_status "ERROR" "$name - Failed to connect"
        return 1
    fi
}

# Function to test if server is running
test_server() {
    echo -e "${BLUE}Checking if server is running...${NC}"
    
    response=$(curl -s "http://localhost:3000/api/health" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        print_status "SUCCESS" "Server is running on port 3000"
        return 0
    else
        print_status "ERROR" "Server is not running or not accessible"
        echo "Please start the server with: npm run dev"
        return 1
    fi
}

# Main testing function
run_tests() {
    local total_tests=0
    local passed_tests=0
    local warning_tests=0
    local failed_tests=0
    
    echo "Starting comprehensive API tests..."
    echo ""
    
    # Test 1: Server connectivity
    total_tests=$((total_tests + 1))
    if test_server; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
        return 1
    fi
    
    # Test 2: Health check
    total_tests=$((total_tests + 1))
    if test_api "Health Check" "http://localhost:3000/api/health" "status"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 3: System health
    total_tests=$((total_tests + 1))
    if test_api "System Health" "http://localhost:3000/api/system-health" "overall"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 4: Database debug
    total_tests=$((total_tests + 1))
    if test_api "Database Debug" "http://localhost:3000/api/debug/database" "cryptocurrencies"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 5: AI Analysis status
    total_tests=$((total_tests + 1))
    if test_api "AI Analysis Status" "http://localhost:3000/api/ai-analysis?action=status" "initialized"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 6: AI Analysis providers
    total_tests=$((total_tests + 1))
    if test_api "AI Analysis Providers" "http://localhost:3000/api/ai-analysis?action=providers" "providers"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 7: Full AI Analysis
    total_tests=$((total_tests + 1))
    if test_api "Full AI Analysis" "http://localhost:3000/api/ai-analysis?action=analyze" "overallRecommendation" "POST" '{"coinId": "bitcoin", "marketData": {"price": {"usd": 65000}, "onChain": {"mvrv": 1.8}, "technical": {"rsi": 58.5}}, "tradingSignal": {"signal": "BUY", "confidence": 75}, "alerts": []}'; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 8: Dashboard data
    total_tests=$((total_tests + 1))
    if test_api "Dashboard Data" "http://localhost:3000/api/dashboard?coinId=bitcoin" "price"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 9: Trading signals
    total_tests=$((total_tests + 1))
    if test_api "Trading Signals" "http://localhost:3000/api/trading-signals-fast?action=signal&coinId=bitcoin" "signal"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 10: Cryptocurrencies list
    total_tests=$((total_tests + 1))
    if test_api "Cryptocurrencies List" "http://localhost:3000/api/cryptocurrencies" "coinGeckoId"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 11: Specific cryptocurrency
    total_tests=$((total_tests + 1))
    if test_api "Specific Cryptocurrency" "http://localhost:3000/api/cryptocurrencies/bitcoin" "symbol"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Test 12: Alerts
    total_tests=$((total_tests + 1))
    if test_api "Alerts" "http://localhost:3000/api/alerts-fast?action=process-data&coinId=bitcoin" "alerts"; then
        passed_tests=$((passed_tests + 1))
    else
        failed_tests=$((failed_tests + 1))
    fi
    
    # Print summary
    echo ""
    echo "========================================================="
    echo "📊 Test Results Summary"
    echo "========================================================="
    echo -e "${GREEN}✅ Passed: $passed_tests${NC}"
    echo -e "${YELLOW}⚠️  Warnings: $warning_tests${NC}"
    echo -e "${RED}❌ Failed: $failed_tests${NC}"
    echo -e "${BLUE}📝 Total: $total_tests${NC}"
    
    # Calculate success rate
    if [ $total_tests -gt 0 ]; then
        success_rate=$((passed_tests * 100 / total_tests))
        echo -e "${BLUE}🎯 Success Rate: $success_rate%${NC}"
    fi
    
    echo ""
    
    # Overall assessment
    if [ $failed_tests -eq 0 ]; then
        print_status "SUCCESS" "All tests passed! System is working correctly."
        exit 0
    elif [ $failed_tests -le 3 ]; then
        print_status "WARNING" "Some tests failed. System may have minor issues."
        exit 1
    else
        print_status "ERROR" "Multiple tests failed. System needs attention."
        exit 2
    fi
}

# Function to add Bitcoin to database if missing
add_bitcoin_if_missing() {
    echo -e "${BLUE}Checking if Bitcoin is in database...${NC}"
    
    response=$(curl -s "http://localhost:3000/api/cryptocurrencies" 2>/dev/null)
    
    if echo "$response" | grep -q "bitcoin"; then
        print_status "SUCCESS" "Bitcoin is already in database"
    else
        echo -e "${YELLOW}Bitcoin not found in database. Adding...${NC}"
        
        response=$(curl -s -X POST "http://localhost:3000/api/cryptocurrencies" \
            -H "Content-Type: application/json" \
            -d '{"coinGeckoId": "bitcoin", "symbol": "BTC", "name": "Bitcoin", "isActive": true}' 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            print_status "SUCCESS" "Bitcoin added to database successfully"
        else
            print_status "ERROR" "Failed to add Bitcoin to database"
        fi
    fi
}

# Main execution
echo "Starting API test script..."
echo ""

# Check if required tools are available
if ! command -v curl &> /dev/null; then
    print_status "ERROR" "curl is not installed. Please install curl to run this script."
    exit 1
fi

# Optional: Check if jq is installed for better JSON parsing
if command -v jq &> /dev/null; then
    print_status "INFO" "jq is installed - will provide better output formatting"
else
    print_status "WARNING" "jq is not installed - some output may be less readable"
fi

# Add Bitcoin to database if missing
add_bitcoin_if_missing
echo ""

# Run the tests
run_tests