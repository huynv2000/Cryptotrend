# Crypto Analytics Dashboard Pro - macOS Installation Guide

## 📋 System Requirements

### Minimum Requirements
- **macOS**: 10.15 (Catalina) or later
- **Node.js**: v18.0 or later
- **Memory**: 512MB RAM minimum, 2GB+ recommended
- **Storage**: 100MB free space
- **Network**: Stable internet connection for API access

### Recommended Requirements
- **macOS**: 12.0 (Monterey) or later
- **Node.js**: v20.0 or later
- **Memory**: 4GB+ RAM
- **Storage**: 500MB+ free space
- **Network**: High-speed internet connection

## 🚀 Installation Steps

### Step 1: Install Node.js and npm

#### Option A: Using Homebrew (Recommended)
```bash
# Install Homebrew (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js via Homebrew
brew install node

# Verify installation
node --version
npm --version
```

#### Option B: Using nvm (Node Version Manager)
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Reload shell configuration
source ~/.bashrc  # or source ~/.zshrc for Zsh

# Install Node.js 20
nvm install 20
nvm use 20

# Verify installation
node --version
npm --version
```

#### Option C: Direct Download
1. Visit [Node.js official website](https://nodejs.org/)
2. Download the macOS installer (.pkg)
3. Run the installer and follow the prompts
4. Verify installation:
```bash
node --version
npm --version
```

### Step 2: Install Git (if not already installed)

#### Using Homebrew
```bash
brew install git
```

#### Verify Git Installation
```bash
git --version
```

### Step 3: Clone the Repository

```bash
# Navigate to your preferred directory
cd ~/Development

# Clone the repository
git clone <repository-url>

# Navigate to the project directory
cd crypto-analytics-dashboard
```

### Step 4: Install Dependencies

```bash
# Install all project dependencies (use legacy peer deps for compatibility)
npm install --legacy-peer-deps

# This will install:
# - Next.js 15 framework
# - Prisma ORM and client
# - shadcn/ui components
# - AI SDKs (OpenAI, Z.AI)
# - Database drivers
# - Development tools
# - **Important Note**: Zod version 3.25.76 (compatible version)
```

### Step 5: Set Up Environment Variables

```bash
# Copy the environment template
cp .env.example .env

# Edit the environment file
nano .env  # or use: open -e .env
```

#### Demo Mode Configuration (For Testing)
```bash
# Create .env file with demo keys
cat > .env << 'EOF'
DATABASE_URL=file:./db/custom.db

# AI API Keys - Demo Mode (no real API keys needed)
OPENAI_API_KEY=demo-mode-key
OPENAI_ORG_ID=demo-org-id

# Z.AI Configuration - Demo Mode (no real API keys needed)
ZAI_BASE_URL=https://api.z-ai.dev
ZAI_API_KEY=demo-mode-key
ZAI_CHAT_ID=demo-chat-id
ZAI_USER_ID=demo-user-id

# Development/Production
NODE_ENV=development
PORT=3000
EOF
```

#### Production Mode Configuration (With Real API Keys)
```bash
# Create .env file with real API keys
cat > .env << 'EOF'
DATABASE_URL=file:./db/custom.db

# AI API Keys - REAL KEYS NEEDED
OPENAI_API_KEY=sk-your-real-openai-key-here
OPENAI_ORG_ID=your-real-openai-org-id-here

# Z.AI Configuration - REAL KEYS NEEDED
ZAI_BASE_URL=https://api.z-ai.dev
ZAI_API_KEY=your-real-z-ai-key-here
ZAI_CHAT_ID=your-real-chat-id-here
ZAI_USER_ID=your-real-user-id-here

# CoinGecko API - REAL KEYS NEEDED
COINGECKO_API_KEY=your-real-coingecko-api-key-here
COINGECKO_PRO_API_KEY=your-real-coingecko-pro-api-key-here
COINGECKO_DEMO_KEY=your-real-coingecko-demo-key-here

# Alternative.me (Fear & Greed Index)
ALTERNATIVE_ME_API_KEY=your-alternative-me-api-key-here

# Glassnode API (On-chain metrics) - REAL KEYS NEEDED
GLASSNODE_API_KEY=your-real-glassnode-api-key-here
GLASSNODE_SECRET_KEY=your-real-glassnode-secret-key-here

# CryptoQuant API (On-chain data) - REAL KEYS NEEDED
CRYPTOQUANT_API_KEY=your-real-cryptoquant-api-key-here
CRYPTOQUANT_SECRET_KEY=your-real-cryptoquant-secret-key-here

# Coinglass API (Derivatives data) - REAL KEYS NEEDED
COINGLASS_API_KEY=your-real-coinglass-api-key-here

# LunarCrush API (Social sentiment) - REAL KEYS NEEDED
LUNARCRUSH_API_KEY=your-real-lunarcrush-api-key-here

# News APIs - REAL KEYS NEEDED
NEWS_API_KEY=your-real-news-api-key-here
CRYPTOPANIC_API_KEY=your-real-cryptopanic-api-key-here

# Twitter/X API (Social sentiment) - REAL KEYS NEEDED
TWITTER_API_KEY=your-real-twitter-api-key-here
TWITTER_API_SECRET=your-real-twitter-api-secret-here
TWITTER_ACCESS_TOKEN=your-real-twitter-access-token-here
TWITTER_ACCESS_TOKEN_SECRET=your-real-twitter-access-token-secret-here
TWITTER_BEARER_TOKEN=your-real-twitter-bearer-token-here

# Reddit API (Social sentiment) - REAL KEYS NEEDED
REDDIT_CLIENT_ID=your-real-reddit-client-id-here
REDDIT_CLIENT_SECRET=your-real-reddit-client-secret-here
REDDIT_USER_AGENT=CryptoDashboard/1.0.0

# Google Trends API
GOOGLE_TRENDS_API_KEY=your-real-google-trends-api-key-here

# WebSocket Configuration
SOCKET_IO_PORT=3000
SOCKET_IO_PATH=/api/socketio

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_WINDOW_MS=60000

# Cache Configuration
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=1000

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs/app.log

# Development/Production
NODE_ENV=development
PORT=3000
EOF
```

### Step 6: Initialize Database

```bash
# Create database directory
mkdir -p db

# Push database schema
npm run db:push

# Verify database file created
ls -la db/
```

### Step 7: Add Default Cryptocurrencies

```bash
# Add Bitcoin to database
curl -s -X POST "http://localhost:3000/api/cryptocurrencies" \
  -H "Content-Type: application/json" \
  -d '{
    "coinGeckoId": "bitcoin",
    "symbol": "BTC",
    "name": "Bitcoin",
    "isActive": true
  }'

# Add Ethereum to database
curl -s -X POST "http://localhost:3000/api/cryptocurrencies" \
  -H "Content-Type: application/json" \
  -d '{
    "coinGeckoId": "ethereum",
    "symbol": "ETH",
    "name": "Ethereum",
    "isActive": true
  }'

# Add BNB to database
curl -s -X POST "http://localhost:3000/api/cryptocurrencies" \
  -H "Content-Type: application/json" \
  -d '{
    "coinGeckoId": "binancecoin",
    "symbol": "BNB",
    "name": "BNB",
    "isActive": true
  }'
```

### Step 8: Start Development Server

```bash
# Start development server
npm run dev

# You should see output like:
# > crypto-analytics-dashboard@0.1.0 dev
# > next dev
#
# ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 9: Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 🔍 API Testing and Health Check

### Basic Health Checks

#### 1. Check Application Health
```bash
curl -s "http://localhost:3000/api/health"
```

#### 2. Check System Health
```bash
curl -s "http://localhost:3000/api/system-health"
```

#### 3. Check Database Status
```bash
curl -s "http://localhost:3000/api/debug/database"
```

### AI Analysis API Testing

#### 1. Check AI Analysis Status
```bash
curl -s "http://localhost:3000/api/ai-analysis?action=status"
```

#### 2. Check AI Analysis Providers
```bash
curl -s "http://localhost:3000/api/ai-analysis?action=providers"
```

#### 3. Test AI Analysis (Full Analysis)
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

### Dashboard API Testing

#### 1. Get Bitcoin Dashboard Data
```bash
curl -s "http://localhost:3000/api/dashboard?coinId=bitcoin"
```

#### 2. Get Ethereum Dashboard Data
```bash
curl -s "http://localhost:3000/api/dashboard?coinId=ethereum"
```

#### 3. Get BNB Dashboard Data
```bash
curl -s "http://localhost:3000/api/dashboard?coinId=binancecoin"
```

### Trading Signals API Testing

#### 1. Get Fast Trading Signals
```bash
curl -s "http://localhost:3000/api/trading-signals-fast?action=signal&coinId=bitcoin"
```

#### 2. Get Full Trading Signals
```bash
curl -s "http://localhost:3000/api/trading-signals?action=signal&coinId=bitcoin"
```

### Cryptocurrencies API Testing

#### 1. List All Cryptocurrencies
```bash
curl -s "http://localhost:3000/api/cryptocurrencies"
```

#### 2. Get Specific Cryptocurrency
```bash
curl -s "http://localhost:3000/api/cryptocurrencies/bitcoin"
```

#### 3. Collect Data for Specific Coin
```bash
curl -s "http://localhost:3000/api/cryptocurrencies/bitcoin/collect-data"
```

### Alerts API Testing

#### 1. Get Fast Alerts
```bash
curl -s "http://localhost:3000/api/alerts-fast?action=process-data&coinId=bitcoin"
```

#### 2. Get Full Alerts
```bash
curl -s "http://localhost:3000/api/alerts?action=process-data&coinId=bitcoin"
```

## 📊 Expected Results

### ✅ Successful Responses

#### AI Analysis Status (Working)
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

#### Health Check (Healthy)
```json
{
  "status": "healthy",
  "timestamp": "2025-08-10T05:48:48.562Z",
  "services": {
    "coingecko": {"status": "ok", "apiKey": true},
    "zai": {"status": "ok", "apiKey": true},
    "openai": {"status": "ok", "apiKey": true}
  },
  "summary": {
    "totalServices": 4,
    "availableServices": 3,
    "healthPercentage": 75
  }
}
```

#### Dashboard Data (With Real Data)
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
  }
}
```

### ❌ Common Error Responses

#### Cryptocurrency Not Found
```json
{"error": "Cryptocurrency not found"}
```

#### API Key Missing
```json
{"error": "API key not configured"}
```

#### Database Connection Failed
```json
{
  "status": "UNHEALTHY",
  "tests": [
    {
      "name": "Database Connectivity",
      "status": "FAIL",
      "message": "Failed to connect to database"
    }
  ]
}
```

## 🔧 Troubleshooting

### Issue 1: Database Connection Failed
```bash
# Check database file exists
ls -la db/

# Recreate database
rm -f db/custom.db
mkdir -p db
npm run db:push

# Add cryptocurrencies again
curl -s -X POST "http://localhost:3000/api/cryptocurrencies" \
  -H "Content-Type: application/json" \
  -d '{"coinGeckoId": "bitcoin", "symbol": "BTC", "name": "Bitcoin", "isActive": true}'
```

### Issue 2: API Keys Not Working
```bash
# Check .env file exists
ls -la .env

# Verify .env content
cat .env

# Check if keys are properly formatted
grep -E "API_KEY|API_KEY" .env
```

### Issue 3: Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Restart server
npm run dev
```

### Issue 4: Dependencies Issues
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install --legacy-peer-deps
```

### Issue 5: Zsh Shell Issues with curl
```bash
# Use quotes around URLs with special characters
curl -s "http://localhost:3000/api/ai-analysis?action=status"
curl -s "http://localhost:3000/api/dashboard?coinId=bitcoin"

# Or use single quotes
curl -s 'http://localhost:3000/api/ai-analysis?action=status'
curl -s 'http://localhost:3000/api/dashboard?coinId=bitcoin'
```

### Issue 6: Zod Version Conflict
```bash
# If you encounter zod version conflicts during npm install
# Clear npm cache completely
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Force install specific zod version
npm install zod@3.25.76

# Reinstall all dependencies with legacy peer deps
npm install --legacy-peer-deps
```

**Note**: The project uses zod version 3.25.76 which is compatible with the current stack. If you see errors about zod version 4.0.2, follow the steps above to resolve the conflict.

## 🎯 Verification Checklist

### ✅ Installation Verification
- [ ] Node.js v18+ installed
- [ ] npm installed
- [ ] Git installed
- [ ] Dependencies installed successfully
- [ ] .env file created and configured
- [ ] Database initialized successfully
- [ ] Default cryptocurrencies added
- [ ] Development server starts successfully

### ✅ API Testing Verification
- [ ] Health check returns healthy status
- [ ] AI analysis status shows configured providers
- [ ] Dashboard data returns real data (not empty)
- [ ] Trading signals work correctly
- [ ] Cryptocurrencies API returns list of coins
- [ ] All endpoints respond without errors

### ✅ Application Verification
- [ ] Browser loads http://localhost:3000 successfully
- [ ] Dashboard displays with real-time data
- [ ] AI analysis shows actual insights (not "N/A")
- [ ] Technical indicators display correctly
- [ ] On-chain metrics show real data
- [ ] Social sentiment indicators work

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### API Key Registration
- **OpenAI**: [OpenAI Dashboard](https://platform.openai.com/api-keys)
- **Z.AI**: [Z.AI Dashboard](https://z-ai.dev)
- **CoinGecko**: [CoinGecko API](https://www.coingecko.com/api)
- **Glassnode**: [Glassnode API](https://glassnode.com/)
- **CryptoQuant**: [CryptoQuant API](https://cryptoquant.com/)
- **Twitter**: [Twitter Developer Portal](https://developer.twitter.com/)
- **Reddit**: [Reddit Apps](https://www.reddit.com/prefs/apps)

### Community Support
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Prisma GitHub](https://github.com/prisma/prisma)
- [shadcn/ui GitHub](https://github.com/shadcn/ui)

---

**Note**: This guide assumes you have administrative privileges on your macOS system. If you encounter any issues during installation, please check the troubleshooting section or refer to the official documentation for each tool.