# API Testing and Health Check Guide

## 📋 Overview

This guide provides comprehensive instructions for testing all API endpoints and performing health checks on the Crypto Analytics Dashboard Pro system.

## 🔍 Prerequisites

Before testing, ensure:
- Development server is running: `npm run dev`
- Server is accessible at `http://localhost:3000`
- Database is initialized and cryptocurrencies are added

## 🚀 Quick Start

### Basic Health Check
```bash
# Check if server is running
curl -s "http://localhost:3000/api/health"
```

### Test AI Analysis
```bash
# Check AI analysis status
curl -s "http://localhost:3000/api/ai-analysis?action=status"
```

### Test Dashboard Data
```bash
# Get Bitcoin dashboard data
curl -s "http://localhost:3000/api/dashboard?coinId=bitcoin"
```

## 📊 Complete API Testing Guide

### 1. Health Check APIs

#### 1.1 Application Health
```bash
curl -s "http://localhost:3000/api/health"
```

**Expected Response (Healthy):**
```json
{
  "status": "degraded",
  "timestamp": "2025-08-10T05:48:48.562Z",
  "services": {
    "coingecko": {"status": "ok", "apiKey": true},
    "zai": {"status": "ok", "apiKey": true},
    "openai": {"status": "ok", "apiKey": true},
    "alternative": {"status": "no_key", "apiKey": false}
  },
  "summary": {
    "totalServices": 4,
    "availableServices": 3,
    "healthPercentage": 75
  }
}
```

#### 1.2 System Health
```bash
curl -s "http://localhost:3000/api/system-health"
```

**Expected Response:**
```json
{
  "timestamp": "2025-08-10T05:48:49.171Z",
  "overall": "UNHEALTHY",
  "tests": [
    {
      "name": "Database Connectivity",
      "status": "FAIL",
      "message": "Failed to connect to database"
    },
    {
      "name": "Rate Limiter",
      "status": "PASS",
      "message": "Rate limiter functioning correctly"
    },
    {
      "name": "Crypto Data Service",
      "status": "WARNING",
      "message": "Crypto data service experiencing issues"
    },
    {
      "name": "AI Analysis",
      "status": "WARNING",
      "message": "AI analysis service experiencing issues"
    },
    {
      "name": "Performance",
      "status": "PASS",
      "message": "Performance acceptable"
    }
  ]
}
```

#### 1.3 Database Debug
```bash
curl -s "http://localhost:3000/api/debug/database"
```

**Expected Response:**
```json
{
  "cryptocurrencies": [
    {"coinGeckoId": "bitcoin", "symbol": "BTC", "name": "Bitcoin"}
  ],
  "counts": {
    "cryptocurrencies": 1,
    "priceHistory": 0,
    "technicalIndicators": 0,
    "onChainMetrics": 0
  }
}
```

### 2. AI Analysis APIs

#### 2.1 AI Analysis Status
```bash
curl -s "http://localhost:3000/api/ai-analysis?action=status"
```

**Expected Response (Working):**
```json
{
  "success": true,
  "status": {
    "initialized": true,
    "demoMode": false,
    "openaiConfigured": true,
    "zaiConfigured": true,
    "config": {
      "providers": ["Z.AI", "ChatGPT"],
      "analysisTypes": ["comprehensive", "breakout"],
      "timeout": 30000,
      "retryAttempts": 3
    }
  }
}
```

#### 2.2 AI Analysis Providers
```bash
curl -s "http://localhost:3000/api/ai-analysis?action=providers"
```

**Expected Response:**
```json
{
  "success": true,
  "providers": ["Z.AI", "ChatGPT"],
  "analysisTypes": ["comprehensive", "breakout"]
}
```

#### 2.3 Full AI Analysis Test
```bash
curl -s -X POST "http://localhost:3000/api/ai-analysis?action=analyze" \
  -H "Content-Type: application/json" \
  -d '{
    "coinId": "bitcoin",
    "marketData": {
      "price": {"usd": 65000},
      "onChain": {"mvrv": 1.8},
      "technical": {"rsi": 58.5}
    },
    "tradingSignal": {
      "signal": "BUY",
      "confidence": 75
    },
    "alerts": []
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "timestamp": "2025-08-10T05:48:31.098Z",
    "coinId": "bitcoin",
    "overallRecommendation": "BUY",
    "overallConfidence": 75,
    "consensusScore": 80,
    "providers": {
      "Z.AI": {
        "provider": "Z.AI",
        "buyRecommendation": "BUY",
        "confidence": 78,
        "reasoning": "Detailed Z.AI analysis...",
        "analysisType": "comprehensive"
      },
      "ChatGPT": {
        "provider": "ChatGPT",
        "buyRecommendation": "BUY",
        "confidence": 72,
        "reasoning": "Detailed ChatGPT analysis...",
        "analysisType": "comprehensive"
      }
    }
  }
}
```

### 3. Dashboard APIs

#### 3.1 Bitcoin Dashboard Data
```bash
curl -s "http://localhost:3000/api/dashboard?coinId=bitcoin"
```

**Expected Response:**
```json
{
  "price": {
    "usd": 65000,
    "usd_24h_change": 1.5,
    "usd_24h_vol": 35000000000,
    "usd_market_cap": 1250000000000
  },
  "onChain": {
    "mvrv": 1.8,
    "nupl": 0.7,
    "sopr": 1.05,
    "activeAddresses": 950000
  },
  "technical": {
    "rsi": 58.5,
    "ma50": 64000,
    "ma200": 62000,
    "macd": 145.5
  },
  "sentiment": {
    "fearGreedIndex": 67,
    "fearGreedClassification": "Greed"
  },
  "derivatives": {
    "fundingRate": 0.0125,
    "openInterest": 18000000000
  }
}
```

#### 3.2 Ethereum Dashboard Data
```bash
curl -s "http://localhost:3000/api/dashboard?coinId=ethereum"
```

#### 3.3 BNB Dashboard Data
```bash
curl -s "http://localhost:3000/api/dashboard?coinId=binancecoin"
```

### 4. Trading Signals APIs

#### 4.1 Fast Trading Signals
```bash
curl -s "http://localhost:3000/api/trading-signals-fast?action=signal&coinId=bitcoin"
```

**Expected Response:**
```json
{
  "signal": {
    "signal": "BUY",
    "confidence": 78,
    "reasoning": "Technical indicators suggest buying opportunity",
    "riskLevel": "MEDIUM",
    "conditions": {
      "mvrv": 1.8,
      "rsi": 58.5,
      "fearGreed": 67
    }
  }
}
```

#### 4.2 Full Trading Signals
```bash
curl -s "http://localhost:3000/api/trading-signals?action=signal&coinId=bitcoin"
```

### 5. Cryptocurrencies APIs

#### 5.1 List All Cryptocurrencies
```bash
curl -s "http://localhost:3000/api/cryptocurrencies"
```

**Expected Response:**
```json
[
  {
    "coinGeckoId": "bitcoin",
    "symbol": "BTC",
    "name": "Bitcoin",
    "isActive": true
  },
  {
    "coinGeckoId": "ethereum",
    "symbol": "ETH",
    "name": "Ethereum",
    "isActive": true
  }
]
```

#### 5.2 Get Specific Cryptocurrency
```bash
curl -s "http://localhost:3000/api/cryptocurrencies/bitcoin"
```

**Expected Response:**
```json
{
  "coinGeckoId": "bitcoin",
  "symbol": "BTC",
  "name": "Bitcoin",
  "isActive": true,
  "lastUpdated": "2025-08-10T05:48:31.098Z"
}
```

#### 5.3 Collect Data for Specific Coin
```bash
curl -s "http://localhost:3000/api/cryptocurrencies/bitcoin/collect-data"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Data collection initiated for bitcoin",
  "coinId": "bitcoin",
  "timestamp": "2025-08-10T05:48:31.098Z"
}
```

#### 5.4 Add New Cryptocurrency
```bash
curl -s -X POST "http://localhost:3000/api/cryptocurrencies" \
  -H "Content-Type: application/json" \
  -d '{
    "coinGeckoId": "solana",
    "symbol": "SOL",
    "name": "Solana",
    "isActive": true
  }'
```

### 6. Alerts APIs

#### 6.1 Fast Alerts
```bash
curl -s "http://localhost:3000/api/alerts-fast?action=process-data&coinId=bitcoin"
```

**Expected Response:**
```json
{
  "alerts": [
    {
      "id": "alert_1",
      "type": "INFO",
      "category": "VOLUME",
      "title": "Volume Spike Detected",
      "message": "Volume increased by 150%",
      "severity": "LOW"
    }
  ]
}
```

#### 6.2 Full Alerts
```bash
curl -s "http://localhost:3000/api/alerts?action=process-data&coinId=bitcoin"
```

### 7. Other APIs

#### 7.1 Volume API
```bash
curl -s "http://localhost:3000/api/volume?coinId=bitcoin"
```

#### 7.2 Analysis API
```bash
curl -s "http://localhost:3000/api/analysis?coinId=bitcoin"
```

## 📋 Test Script

### Complete Test Script
Create a file `test-apis.sh` with the following content:

```bash
#!/bin/bash

echo "🚀 Starting API Tests for Crypto Analytics Dashboard"
echo "=================================================="

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s "http://localhost:3000/api/health" | jq '.status' 2>/dev/null || curl -s "http://localhost:3000/api/health"
echo ""

# Test 2: AI Analysis Status
echo "2. Testing AI Analysis Status..."
curl -s "http://localhost:3000/api/ai-analysis?action=status" | jq '.status.initialized' 2>/dev/null || curl -s "http://localhost:3000/api/ai-analysis?action=status"
echo ""

# Test 3: Dashboard Data
echo "3. Testing Dashboard Data for Bitcoin..."
curl -s "http://localhost:3000/api/dashboard?coinId=bitcoin" | jq '.price.usd' 2>/dev/null || curl -s "http://localhost:3000/api/dashboard?coinId=bitcoin"
echo ""

# Test 4: Cryptocurrencies List
echo "4. Testing Cryptocurrencies List..."
curl -s "http://localhost:3000/api/cryptocurrencies" | jq '.[0].symbol' 2>/dev/null || curl -s "http://localhost:3000/api/cryptocurrencies"
echo ""

# Test 5: Trading Signals
echo "5. Testing Trading Signals..."
curl -s "http://localhost:3000/api/trading-signals-fast?action=signal&coinId=bitcoin" | jq '.signal.signal' 2>/dev/null || curl -s "http://localhost:3000/api/trading-signals-fast?action=signal&coinId=bitcoin"
echo ""

echo "✅ API Tests Completed!"
```

### Run the Test Script
```bash
# Make the script executable
chmod +x test-apis.sh

# Run the tests
./test-apis.sh
```

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. "Cryptocurrency not found" Error
```bash
# Add Bitcoin to database
curl -s -X POST "http://localhost:3000/api/cryptocurrencies" \
  -H "Content-Type: application/json" \
  -d '{"coinGeckoId": "bitcoin", "symbol": "BTC", "name": "Bitcoin", "isActive": true}'
```

#### 2. Database Connection Failed
```bash
# Recreate database
rm -f db/custom.db
mkdir -p db
npm run db:push

# Add cryptocurrencies again
curl -s -X POST "http://localhost:3000/api/cryptocurrencies" \
  -H "Content-Type: application/json" \
  -d '{"coinGeckoId": "bitcoin", "symbol": "BTC", "name": "Bitcoin", "isActive": true}'
```

#### 3. API Key Not Configured
```bash
# Check .env file
cat .env

# Verify API keys are set
grep -E "OPENAI_API_KEY|ZAI_API_KEY|COINGECKO_API_KEY" .env
```

#### 4. Server Not Running
```bash
# Start development server
npm run dev

# Check if server is running
curl -s "http://localhost:3000/api/health"
```

#### 5. Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Restart server
npm run dev
```

## 📊 Expected Results Summary

### ✅ Successful System State
- Health check shows 75%+ health percentage
- AI analysis status shows `initialized: true` and `demoMode: false`
- Dashboard data returns actual numbers (not zeros)
- Cryptocurrencies list contains at least Bitcoin
- All API endpoints respond without errors

### ⚠️ Warning States
- Health percentage between 50-75%
- Some services show "no_key" status
- AI analysis shows warnings but still functions
- Dashboard data may be incomplete

### ❌ Error States
- Health percentage below 50%
- Database connectivity fails
- AI analysis shows `initialized: false`
- "Cryptocurrency not found" errors
- Empty or zero data in dashboard

## 🎯 Verification Checklist

### System Health
- [ ] Health check returns status
- [ ] System health check completes
- [ ] Database debug shows data
- [ ] All critical services are running

### AI Analysis
- [ ] AI analysis status is initialized
- [ ] Both Z.AI and ChatGPT are configured
- [ ] Full analysis test completes successfully
- [ ] Analysis returns meaningful recommendations

### Data APIs
- [ ] Dashboard data returns real values
- [ ] Trading signals generate recommendations
- [ ] Cryptocurrencies list is populated
- [ ] Data collection works

### Error Handling
- [ ] Invalid coin IDs return proper errors
- [ ] Missing API keys show appropriate warnings
- [ ] Database failures are handled gracefully
- [ ] Rate limiting is working

---

**Note**: This guide assumes you have the development server running and proper API keys configured. For installation instructions, refer to the macOS installation guide.