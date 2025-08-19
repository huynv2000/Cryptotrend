# Crypto Analytics Dashboard Pro - Configuration Guide

## 📋 Overview

This guide provides comprehensive configuration instructions for the Crypto Analytics Dashboard Pro system. It covers all aspects of system configuration including environment variables, API keys, database settings, and application behavior.

## 🔧 Environment Variables

### Required Variables

#### Core Application Settings
```bash
# Application Environment
NODE_ENV=development  # or 'production' for production deployment
PORT=3000            # Application port (default: 3000)

# Database Configuration
DATABASE_URL=file:./db/custom.db  # SQLite database file path
```

#### AI API Keys (Minimum Required)
```bash
# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_ORG_ID=your-openai-org-id-here  # Optional but recommended

# Z.AI Configuration
ZAI_BASE_URL=https://api.z-ai.dev
ZAI_API_KEY=your-z-ai-api-key-here
ZAI_CHAT_ID=your-z-ai-chat-id-here      # Optional
ZAI_USER_ID=your-z-ai-user-id-here      # Optional
```

#### Crypto API Keys (Minimum Required)
```bash
# CoinGecko API
COINGECKO_API_KEY=your-coingecko-api-key-here
COINGECKO_PRO_API_KEY=your-coingecko-pro-api-key-here  # Optional
COINGECKO_DEMO_KEY=your-coingecko-demo-key-here        # Optional
```

### Optional Variables

#### Additional Crypto APIs
```bash
# Alternative.me (Fear & Greed Index)
ALTERNATIVE_ME_API_KEY=your-alternative-me-api-key-here

# Glassnode API (On-chain metrics)
GLASSNODE_API_KEY=your-glassnode-api-key-here
GLASSNODE_SECRET_KEY=your-glassnode-secret-key-here

# CryptoQuant API (On-chain data)
CRYPTOQUANT_API_KEY=your-cryptoquant-api-key-here
CRYPTOQUANT_SECRET_KEY=your-cryptoquant-secret-key-here

# Coinglass API (Derivatives data)
COINGLASS_API_KEY=your-coinglass-api-key-here

# LunarCrush API (Social sentiment)
LUNARCRUSH_API_KEY=your-lunarcrush-api-key-here
```

#### News and Social Media APIs
```bash
# News APIs
NEWS_API_KEY=your-news-api-key-here
CRYPTOPANIC_API_KEY=your-cryptopanic-api-key-here

# Twitter/X API (Social sentiment)
TWITTER_API_KEY=your-twitter-api-key-here
TWITTER_API_SECRET=your-twitter-api-secret-here
TWITTER_ACCESS_TOKEN=your-twitter-access-token-here
TWITTER_ACCESS_TOKEN_SECRET=your-twitter-access-token-secret-here
TWITTER_BEARER_TOKEN=your-twitter-bearer-token-here

# Reddit API (Social sentiment)
REDDIT_CLIENT_ID=your-reddit-client-id-here
REDDIT_CLIENT_SECRET=your-reddit-client-secret-here
REDDIT_USER_AGENT=your-reddit-user-agent-here

# Google Trends API
GOOGLE_TRENDS_API_KEY=your-google-trends-api-key-here
```

#### WebSocket and Real-time Configuration
```bash
# WebSocket Configuration
SOCKET_IO_PORT=3000
SOCKET_IO_PATH=/api/socketio
```

#### Performance and Rate Limiting
```bash
# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
RATE_LIMIT_WINDOW_MS=60000

# Cache Configuration
CACHE_TTL_SECONDS=300
CACHE_MAX_SIZE=1000
```

#### Logging Configuration
```bash
# Logging
LOG_LEVEL=info  # debug, info, warn, error
LOG_FILE_PATH=./logs/app.log
```

## 🗄️ Database Configuration

### SQLite Configuration

#### Default Setup
```bash
# Database file location
DATABASE_URL=file:./db/custom.db

# Alternative locations
DATABASE_URL=file:./dev.db
DATABASE_URL=file:./data/production.db
```

#### Database Initialization
```bash
# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Seed default cryptocurrencies
npm run db:seed

# Reset database (development only)
npm run db:reset
```

### Database Schema Overview

The system uses the following main models:
- **Users**: User management and authentication
- **Cryptocurrencies**: Coin information and metadata
- **PriceHistory**: Historical price data
- **VolumeHistory**: Trading volume data
- **OnChainMetric**: Blockchain metrics
- **TechnicalIndicator**: Technical analysis indicators
- **SentimentMetric**: Market sentiment data
- **DerivativeMetric**: Derivatives market data
- **Analysis**: AI-generated trading signals
- **Portfolio**: User portfolio management
- **Watchlist**: User watchlists
- **Alerts**: Price and metric alerts

## 🔑 API Key Setup Guide

### OpenAI API Key

1. **Create OpenAI Account**
   - Visit [OpenAI](https://openai.com/)
   - Sign up or log in to your account

2. **Get API Key**
   - Navigate to [API Keys](https://platform.openai.com/api-keys)
   - Click "Create new secret key"
   - Copy the key and save it securely

3. **Configure Environment**
   ```bash
   OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   OPENAI_ORG_ID=org-xxxxxxxxxxxxxxxxxxxxxxxx  # Optional
   ```

### Z.AI API Key

1. **Create Z.AI Account**
   - Visit [Z.AI](https://z-ai.dev/)
   - Sign up or log in to your account

2. **Get API Key**
   - Navigate to API section in dashboard
   - Generate new API key
   - Copy the key and save it securely

3. **Configure Environment**
   ```bash
   ZAI_BASE_URL=https://api.z-ai.dev
   ZAI_API_KEY=your-z-ai-api-key-here
   ZAI_CHAT_ID=your-chat-id-here      # Optional
   ZAI_USER_ID=your-user-id-here      # Optional
   ```

### CoinGecko API Key

1. **Create CoinGecko Account**
   - Visit [CoinGecko](https://www.coingecko.com/)
   - Sign up or log in to your account

2. **Get API Key**
   - Navigate to [API Dashboard](https://www.coingecko.com/api)
   - Choose your plan (Free, Pro, or Enterprise)
   - Generate API key

3. **Configure Environment**
   ```bash
   COINGECKO_API_KEY=your-coingecko-api-key-here
   COINGECKO_PRO_API_KEY=your-pro-key-here    # Optional
   COINGECKO_DEMO_KEY=your-demo-key-here      # Optional
   ```

### Alternative.me API Key

1. **Create Alternative.me Account**
   - Visit [Alternative.me](https://alternative.me/)
   - Sign up for API access

2. **Get API Key**
   - Navigate to API section
   - Request API key

3. **Configure Environment**
   ```bash
   ALTERNATIVE_ME_API_KEY=your-alternative-me-api-key-here
   ```

## 🚀 Application Configuration

### Development Mode

```bash
# Development configuration
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# Start development server
npm run dev
```

### Production Mode

```bash
# Production configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Build application
npm run build

# Start production server
npm start
```

### Custom Configuration

#### Custom Port
```bash
PORT=8080
```

#### Custom Database Location
```bash
DATABASE_URL=file:./data/custom_database.db
```

#### Custom Logging
```bash
LOG_LEVEL=warn
LOG_FILE_PATH=/var/log/crypto-analytics/app.log
```

## 🔄 Data Collection Configuration

### Collection Intervals

The system supports configurable data collection intervals:

```bash
# Price data collection (5-90 minutes)
PRICE_COLLECTION_INTERVAL=30  # minutes

# Technical indicators collection
TECHNICAL_COLLECTION_INTERVAL=60  # minutes

# On-chain metrics collection
ONCHAIN_COLLECTION_INTERVAL=120  # minutes

# Sentiment data collection
SENTIMENT_COLLECTION_INTERVAL=180  # minutes

# Derivatives data collection
DERIVATIVES_COLLECTION_INTERVAL=60  # minutes
```

### Data Sources Configuration

#### Enable/Disable Data Sources
```bash
# Enable/disable specific data sources
ENABLE_PRICE_DATA=true
ENABLE_TECHNICAL_INDICATORS=true
ENABLE_ONCHAIN_METRICS=true
ENABLE_SENTIMENT_DATA=true
ENABLE_DERIVATIVES_DATA=true
ENABLE_AI_ANALYSIS=true
```

#### Data Retention Settings
```bash
# Data retention periods (in days)
PRICE_DATA_RETENTION=90
TECHNICAL_DATA_RETENTION=90
ONCHAIN_DATA_RETENTION=90
SENTIMENT_DATA_RETENTION=30
DERIVATIVES_DATA_RETENTION=30
ANALYSIS_DATA_RETENTION=30
```

## 🤖 AI Analysis Configuration

### AI Model Selection

```bash
# AI model configuration
AI_MODEL=gpt-4  # or gpt-3.5-turbo, gpt-4-turbo
AI_TEMPERATURE=0.7  # 0.0 to 1.0
AI_MAX_TOKENS=2000
```

### Analysis Types

The system supports multiple analysis types:

```bash
# Enable/disable analysis types
ENABLE_MARKET_OVERVIEW=true
ENABLE_COIN_SPECIFIC=true
ENABLE_PORTFOLIO_ANALYSIS=true
ENABLE_RISK_ASSESSMENT=true
```

### AI Consensus Configuration

```bash
# AI consensus settings
AI_CONSENSUS_THRESHOLD=0.7  # 0.0 to 1.0
ENABLE_MULTI_AI_ANALYSIS=true
AI_FALLBACK_TO_RULES=true
```

## 📊 Dashboard Configuration

### Default Cryptocurrencies

The system includes default cryptocurrencies (BTC, ETH, BNB, SOL). You can customize this list:

```bash
# Default cryptocurrencies (comma-separated)
DEFAULT_CRYPTOCURRENCIES=btc,eth,bnb,sol,ada,dot,link,uni

# Maximum number of custom coins per user
MAX_CUSTOM_COINS=20
```

### Dashboard Themes

```bash
# Theme configuration
DEFAULT_THEME=dark  # or 'light'
ENABLE_THEME_SWITCHER=true
```

### Chart Configuration

```bash
# Chart settings
DEFAULT_CHART_PERIOD=24h  # 1h, 24h, 7d, 30d, 90d, 1y
CHART_REFRESH_INTERVAL=30  # seconds
MAX_CHART_POINTS=100
```

## 🔒 Security Configuration

### API Security

```bash
# API security settings
ENABLE_API_RATE_LIMITING=true
API_RATE_LIMIT=100  # requests per minute
ENABLE_CORS=true
CORS_ORIGIN=http://localhost:3000
```

### Environment Security

```bash
# Security headers
ENABLE_HELMET=true
ENABLE_CSP=true
CSP_POLICY=default-src 'self'
```

### Authentication

```bash
# Authentication settings
ENABLE_AUTHENTICATION=true
JWT_SECRET=your-jwt-secret-here
JWT_EXPIRES_IN=7d
```

## 📈 Performance Configuration

### Caching Configuration

```bash
# Cache settings
ENABLE_CACHING=true
CACHE_TTL=300  # seconds
CACHE_MAX_SIZE=1000
CACHE_STRATEGY=memory  # memory, redis
```

### Database Optimization

```bash
# Database connection pool
DATABASE_POOL_SIZE=10
DATABASE_CONNECTION_TIMEOUT=30000
DATABASE_IDLE_TIMEOUT=600000
```

### WebSocket Configuration

```bash
# WebSocket settings
WEBSOCKET_ENABLED=true
WEBSOCKET_PORT=3000
WEBSOCKET_PATH=/api/socketio
WEBSOCKET_HEARTBEAT_INTERVAL=25000
```

## 🚨 Alert Configuration

### Alert Types

```bash
# Enable/disable alert types
ENABLE_PRICE_ALERTS=true
ENABLE_TECHNICAL_ALERTS=true
ENABLE_SENTIMENT_ALERTS=true
ENABLE_DERIVATIVE_ALERTS=true
```

### Alert Notifications

```bash
# Notification settings
ENABLE_EMAIL_NOTIFICATIONS=false
ENABLE_WEBHOOK_NOTIFICATIONS=false
WEBHOOK_URL=your-webhook-url-here
```

## 🧪 Testing Configuration

### Test Environment

```bash
# Test configuration
NODE_ENV=test
TEST_DATABASE_URL=file:./test.db
TEST_LOG_LEVEL=error
```

### Test Data

```bash
# Test data settings
USE_TEST_DATA=true
TEST_DATA_SEED=true
TEST_API_MOCKING=true
```

## 📝 Configuration Validation

### Environment Validation

The system includes environment validation to ensure all required variables are set:

```bash
# Validate configuration
npm run validate-config

# Check environment variables
npm run check-env
```

### Health Check

```bash
# System health check
npm run health-check

# API health check
curl http://localhost:3000/api/health
```

## 🔄 Configuration Reload

### Hot Reload

The system supports configuration hot reload for development:

```bash
# Enable hot reload
ENABLE_HOT_RELOAD=true
CONFIG_WATCH_INTERVAL=5000  # milliseconds
```

### Graceful Reload

For production environments, use graceful reload:

```bash
# Graceful reload
npm run graceful-reload

# Or use process manager
pm2 reload crypto-analytics
```

## 📚 Configuration Best Practices

### 1. Environment Management
- Use `.env` for local development
- Use `.env.production` for production
- Never commit `.env` files to version control
- Use environment-specific configurations

### 2. Security Best Practices
- Use strong, unique API keys
- Rotate API keys regularly
- Use environment variables for sensitive data
- Enable HTTPS in production
- Implement proper CORS policies

### 3. Performance Optimization
- Use appropriate cache settings
- Monitor database performance
- Optimize data collection intervals
- Use connection pooling

### 4. Monitoring and Logging
- Set up proper logging levels
- Monitor system health
- Set up alerts for critical issues
- Regular backup of configuration

---

**Note**: Always test configuration changes in a development environment before applying them to production. Keep backups of your configuration files and regularly review security settings.