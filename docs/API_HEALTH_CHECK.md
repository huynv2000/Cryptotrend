# API Testing and Health Check Documentation

## 📋 Overview

This documentation provides comprehensive guidance for testing all API endpoints and performing health checks on the Crypto Analytics Dashboard Pro system. The testing process ensures that all components are functioning correctly and data is flowing properly through the system.

## 🚀 Quick Start

### Prerequisites
- Development server running (`npm run dev`)
- Server accessible at `http://localhost:3000`
- Database initialized with at least one cryptocurrency

### Basic Health Check
```bash
# Check if server is running
curl -s "http://localhost:3000/api/health"

# Check AI analysis status
curl -s "http://localhost:3000/api/ai-analysis?action=status"

# Check dashboard data
curl -s "http://localhost:3000/api/dashboard?coinId=bitcoin"
```

### Automated Testing
```bash
# Run comprehensive API tests
chmod +x scripts/test-apis.sh
./scripts/test-apis.sh
```

## 📊 API Endpoints Overview

### Health Check APIs
| Endpoint | Method | Description | Expected Response |
|----------|--------|-------------|-------------------|
| `/api/health` | GET | Basic health check | Service status and health percentage |
| `/api/system-health` | GET | Comprehensive system health | Detailed test results for all components |
| `/api/debug/database` | GET | Database debug information | Database contents and statistics |

### AI Analysis APIs
| Endpoint | Method | Description | Expected Response |
|----------|--------|-------------|-------------------|
| `/api/ai-analysis?action=status` | GET | AI analysis service status | Configuration and initialization status |
| `/api/ai-analysis?action=providers` | GET | Available AI providers | List of configured AI providers |
| `/api/ai-analysis?action=analyze` | POST | Full AI analysis | Comprehensive market analysis |

### Dashboard APIs
| Endpoint | Method | Description | Expected Response |
|----------|--------|-------------|-------------------|
| `/api/dashboard?coinId=bitcoin` | GET | Dashboard data for specific coin | Price, on-chain, technical, sentiment data |
| `/api/dashboard?coinId=ethereum` | GET | Ethereum dashboard data | Ethereum-specific market data |
| `/api/dashboard?coinId=binancecoin` | GET | BNB dashboard data | BNB-specific market data |

### Trading Signals APIs
| Endpoint | Method | Description | Expected Response |
|----------|--------|-------------|-------------------|
| `/api/trading-signals-fast?action=signal&coinId=bitcoin` | GET | Fast trading signals | Quick trading recommendations |
| `/api/trading-signals?action=signal&coinId=bitcoin` | GET | Full trading signals | Detailed trading analysis |

### Cryptocurrencies APIs
| Endpoint | Method | Description | Expected Response |
|----------|--------|-------------|-------------------|
| `/api/cryptocurrencies` | GET | List all cryptocurrencies | Array of configured coins |
| `/api/cryptocurrencies/bitcoin` | GET | Get specific cryptocurrency | Details for specific coin |
| `/api/cryptocurrencies/bitcoin/collect-data` | GET | Collect data for coin | Data collection status |
| `/api/cryptocurrencies` | POST | Add new cryptocurrency | Confirmation of addition |

### Alerts APIs
| Endpoint | Method | Description | Expected Response |
|----------|--------|-------------|-------------------|
| `/api/alerts-fast?action=process-data&coinId=bitcoin` | GET | Fast alerts processing | Quick market alerts |
| `/api/alerts?action=process-data&coinId=bitcoin` | GET | Full alerts processing | Detailed market alerts |

## 🔍 Detailed Testing Procedures

### 1. Health Check Testing

#### Basic Health Check
```bash
curl -s "http://localhost:3000/api/health"
```

**Expected Response:**
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

**Success Criteria:**
- Status is not "error"
- Health percentage is above 50%
- At least 3 services are available

#### System Health Check
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

**Success Criteria:**
- Database connectivity passes
- Rate limiter is functioning
- Performance is acceptable
- No critical failures

### 2. AI Analysis Testing

#### AI Analysis Status
```bash
curl -s "http://localhost:3000/api/ai-analysis?action=status"
```

**Expected Response:**
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

**Success Criteria:**
- `initialized` is true
- `demoMode` is false (for production)
- Both `openaiConfigured` and `zaiConfigured` are true
- Providers array contains expected services

#### Full AI Analysis Test
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

**Success Criteria:**
- Response contains `overallRecommendation`
- Both Z.AI and ChatGPT providers are present
- Confidence scores are reasonable (0-100)
- Reasoning contains meaningful text

### 3. Dashboard Data Testing

#### Dashboard Data Test
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

**Success Criteria:**
- Price data contains non-zero values
- On-chain metrics are populated
- Technical indicators have reasonable values
- Sentiment data is present
- Derivatives data is available

### 4. Cryptocurrencies Testing

#### List Cryptocurrencies
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

**Success Criteria:**
- Array is not empty
- At least Bitcoin is present
- Each coin has required fields (coinGeckoId, symbol, name, isActive)

#### Add Cryptocurrency
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

**Expected Response:**
```json
{
  "success": true,
  "message": "Cryptocurrency added successfully",
  "cryptocurrency": {
    "coinGeckoId": "solana",
    "symbol": "SOL",
    "name": "Solana",
    "isActive": true
  }
}
```

**Success Criteria:**
- Response indicates success
- New cryptocurrency is returned with correct data

## 📋 Test Scenarios

### Scenario 1: Fresh Installation
1. **Setup**: New installation with demo keys
2. **Expected**: System runs in demo mode
3. **Tests**: All endpoints should work with sample data
4. **Verification**: AI analysis shows demo data, dashboard shows mock values

### Scenario 2: Production Configuration
1. **Setup**: Real API keys configured
2. **Expected**: System uses real data
3. **Tests**: All endpoints return live data
4. **Verification**: AI analysis shows real insights, dashboard shows live prices

### Scenario 3: Database Issues
1. **Setup**: Database file missing or corrupted
2. **Expected**: System handles gracefully
3. **Tests**: Health checks show database issues
4. **Verification**: Error messages are appropriate, system doesn't crash

### Scenario 4: API Key Issues
1. **Setup**: Invalid or missing API keys
2. **Expected**: System falls back to demo mode
3. **Tests**: AI analysis shows demo data
4. **Verification**: System remains functional with limited features

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue 1: Server Not Running
**Symptoms**: Connection refused errors
**Solution**:
```bash
# Start development server
npm run dev

# Check if server is running
curl -s "http://localhost:3000/api/health"
```

#### Issue 2: Database Connection Failed
**Symptoms**: Database connectivity errors in health checks
**Solution**:
```bash
# Recreate database
rm -f db/custom.db
mkdir -p db
npm run db:push

# Add Bitcoin to database
curl -s -X POST "http://localhost:3000/api/cryptocurrencies" \
  -H "Content-Type: application/json" \
  -d '{"coinGeckoId": "bitcoin", "symbol": "BTC", "name": "Bitcoin", "isActive": true}'
```

#### Issue 3: Cryptocurrency Not Found
**Symptoms**: "Cryptocurrency not found" errors
**Solution**:
```bash
# Add required cryptocurrencies
curl -s -X POST "http://localhost:3000/api/cryptocurrencies" \
  -H "Content-Type: application/json" \
  -d '{"coinGeckoId": "bitcoin", "symbol": "BTC", "name": "Bitcoin", "isActive": true}'

curl -s -X POST "http://localhost:3000/api/cryptocurrencies" \
  -H "Content-Type: application/json" \
  -d '{"coinGeckoId": "ethereum", "symbol": "ETH", "name": "Ethereum", "isActive": true}'
```

#### Issue 4: API Key Configuration
**Symptoms**: AI analysis shows demo mode or key errors
**Solution**:
```bash
# Check .env file
cat .env

# Verify API keys are set
grep -E "OPENAI_API_KEY|ZAI_API_KEY|COINGECKO_API_KEY" .env

# Restart server after changes
npm run dev
```

#### Issue 5: Port Already in Use
**Symptoms**: Server fails to start, port in use errors
**Solution**:
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Restart server
npm run dev
```

## 📊 Success Metrics

### Health Check Metrics
- **Excellent**: 90-100% health, all services operational
- **Good**: 75-89% health, minor warnings
- **Fair**: 50-74% health, some services degraded
- **Poor**: Below 50% health, multiple issues

### API Response Metrics
- **Excellent**: All endpoints respond < 1s, complete data
- **Good**: Most endpoints respond < 2s, mostly complete data
- **Fair**: Some endpoints slow, partial data
- **Poor**: Many timeouts, incomplete data

### Data Quality Metrics
- **Excellent**: Real-time data, all indicators populated
- **Good**: Recent data, most indicators populated
- **Fair**: Stale data, some indicators missing
- **Poor**: Mock data, most indicators empty

## 🎯 Best Practices

### Testing Frequency
- **Development**: Test after each code change
- **Staging**: Test before deployment
- **Production**: Test periodically and after updates

### Monitoring
- Set up automated health checks
- Monitor response times
- Track error rates
- Alert on critical failures

### Documentation
- Keep test procedures updated
- Document known issues
- Record test results
- Maintain troubleshooting guides

## 📚 Additional Resources

### Documentation
- [macOS Installation Guide](./INSTALLATION_MACOS.md)
- [API Testing Guide](./API_TESTING_GUIDE.md)
- [Configuration Guide](./CONFIGURATION_GUIDE.md)

### Tools
- **curl**: Command-line HTTP client
- **jq**: JSON processor (optional but recommended)
- **Postman**: GUI API testing tool
- **Insomnia**: REST client for API testing

### Scripts
- **test-apis.sh**: Automated API testing script
- **setup-macos.sh**: macOS setup script
- **health-check.sh**: Quick health check script

---

**Note**: This documentation should be used in conjunction with the installation and configuration guides. Always ensure your system is properly configured before running tests.