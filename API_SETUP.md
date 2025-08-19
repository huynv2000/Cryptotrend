# API Keys Configuration Guide

This document provides comprehensive instructions for setting up API keys for all data sources used in the Crypto Analytics Dashboard.

## 📋 Overview

The dashboard integrates with multiple external APIs to provide comprehensive market analysis. Each API requires proper authentication and configuration.

## 🔑 Environment Variables

### Required API Keys

#### 1. AI Services
```bash
# OpenAI (ChatGPT)
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_ORG_ID=your-openai-org-id-here

# Z.AI
ZAI_BASE_URL=https://api.z-ai.dev
ZAI_API_KEY=your-z-ai-api-key-here
ZAI_CHAT_ID=your-z-ai-chat-id-here
ZAI_USER_ID=your-z-ai-user-id-here
```

#### 2. Market Data APIs
```bash
# CoinGecko (Primary market data)
COINGECKO_API_KEY=your-coingecko-api-key-here
COINGECKO_PRO_API_KEY=your-coingecko-pro-api-key-here
COINGECKO_DEMO_KEY=your-coingecko-demo-key-here

# Alternative.me (Fear & Greed Index)
ALTERNATIVE_ME_API_KEY=your-alternative-me-api-key-here
```

#### 3. On-chain Data APIs
```bash
# Glassnode (Advanced on-chain metrics)
GLASSNODE_API_KEY=your-glassnode-api-key-here
GLASSNODE_SECRET_KEY=your-glassnode-secret-key-here

# CryptoQuant (On-chain data and flows)
CRYPTOQUANT_API_KEY=your-cryptoquant-api-key-here
CRYPTOQUANT_SECRET_KEY=your-cryptoquant-secret-key-here
```

#### 4. Derivatives Data APIs
```bash
# Coinglass (Derivatives and futures data)
COINGLASS_API_KEY=your-coinglass-api-key-here
```

#### 5. Social Sentiment APIs
```bash
# LunarCrush (Social media sentiment)
LUNARCRUSH_API_KEY=your-lunarcrush-api-key-here

# Twitter/X API (Social sentiment and trends)
TWITTER_API_KEY=your-twitter-api-key-here
TWITTER_API_SECRET=your-twitter-api-secret-here
TWITTER_ACCESS_TOKEN=your-twitter-access-token-here
TWITTER_ACCESS_TOKEN_SECRET=your-twitter-access-token-secret-here
TWITTER_BEARER_TOKEN=your-twitter-bearer-token-here

# Reddit API (Social sentiment)
REDDIT_CLIENT_ID=your-reddit-client-id-here
REDDIT_CLIENT_SECRET=your-reddit-client-secret-here
REDDIT_USER_AGENT=your-reddit-user-agent-here
```

#### 6. News APIs
```bash
# News API (General news sentiment)
NEWS_API_KEY=your-news-api-key-here

# CryptoPanic (Crypto-specific news)
CRYPTOPANIC_API_KEY=your-cryptopanic-api-key-here
```

#### 7. Other Services
```bash
# Google Trends API
GOOGLE_TRENDS_API_KEY=your-google-trends-api-key-here
```

## 🚀 Setup Instructions

### Step 1: Copy Environment Template

```bash
cp .env.example .env
```

### Step 2: Obtain API Keys

#### AI Services

**OpenAI (ChatGPT)**
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Go to API Keys section
4. Create new API key
5. Add to `.env`:
   ```bash
   OPENAI_API_KEY=sk-...
   OPENAI_ORG_ID=org-...
   ```

**Z.AI**
1. Visit [Z.AI Platform](https://z-ai.dev/)
2. Sign up and obtain API key
3. Add to `.env`:
   ```bash
   ZAI_BASE_URL=https://api.z-ai.dev
   ZAI_API_KEY=your-z-ai-key
   ```

#### Market Data APIs

**CoinGecko**
1. Visit [CoinGecko API](https://www.coingecko.com/en/api)
2. Sign up for free API key
3. For Pro features, upgrade to Pro plan
4. Add to `.env`:
   ```bash
   COINGECKO_API_KEY=your-free-key
   COINGECKO_PRO_API_KEY=your-pro-key
   ```

**Alternative.me**
1. Visit [Alternative.me API](https://alternative.me/)
2. Check API documentation (currently free)
3. Add to `.env`:
   ```bash
   ALTERNATIVE_ME_API_KEY=your-api-key
   ```

#### On-chain Data APIs

**Glassnode**
1. Visit [Glassnode Studio](https://glassnode.com/)
2. Sign up for API access
3. Choose appropriate plan
4. Add to `.env`:
   ```bash
   GLASSNODE_API_KEY=your-api-key
   GLASSNODE_SECRET_KEY=your-secret-key
   ```

**CryptoQuant**
1. Visit [CryptoQuant](https://cryptoquant.com/)
2. Sign up for API access
3. Add to `.env`:
   ```bash
   CRYPTOQUANT_API_KEY=your-api-key
   CRYPTOQUANT_SECRET_KEY=your-secret-key
   ```

#### Derivatives Data APIs

**Coinglass**
1. Visit [Coinglass API](https://www.coinglass.com/api/)
2. Sign up for API key
3. Add to `.env`:
   ```bash
   COINGLASS_API_KEY=your-api-key
   ```

#### Social Sentiment APIs

**LunarCrush**
1. Visit [LunarCrush](https://lunarcrush.com/)
2. Sign up for API access
3. Add to `.env`:
   ```bash
   LUNARCRUSH_API_KEY=your-api-key
   ```

**Twitter/X API**
1. Visit [Twitter Developer Portal](https://developer.twitter.com/)
2. Create new app
3. Obtain API keys and tokens
4. Add to `.env`:
   ```bash
   TWITTER_API_KEY=your-api-key
   TWITTER_API_SECRET=your-api-secret
   TWITTER_ACCESS_TOKEN=your-access-token
   TWITTER_ACCESS_TOKEN_SECRET=your-access-token-secret
   TWITTER_BEARER_TOKEN=your-bearer-token
   ```

**Reddit API**
1. Visit [Reddit Apps](https://www.reddit.com/prefs/apps)
2. Create new application
3. Use "script" as application type
4. Add to `.env`:
   ```bash
   REDDIT_CLIENT_ID=your-client-id
   REDDIT_CLIENT_SECRET=your-client-secret
   REDDIT_USER_AGENT=your-app-name/1.0.0
   ```

#### News APIs

**News API**
1. Visit [NewsAPI.org](https://newsapi.org/)
2. Sign up for free API key
3. Add to `.env`:
   ```bash
   NEWS_API_KEY=your-api-key
   ```

**CryptoPanic**
1. Visit [CryptoPanic API](https://cryptopanic.com/developers/api/)
2. Sign up for API key
3. Add to `.env`:
   ```bash
   CRYPTOPANIC_API_KEY=your-api-key
   ```

## 🔧 Configuration Files

### Main Configuration (`src/lib/config.ts`)

The main configuration file manages all API keys and settings:

```typescript
// AI Configuration
export const AI_CONFIG = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    orgId: process.env.OPENAI_ORG_ID || '',
  },
  zai: {
    baseUrl: process.env.ZAI_BASE_URL || 'https://api.z-ai.dev',
    apiKey: process.env.ZAI_API_KEY || '',
    chatId: process.env.ZAI_CHAT_ID || '',
    userId: process.env.ZAI_USER_ID || '',
  },
};

// Market Data APIs
export const MARKET_DATA_APIS = {
  coingecko: {
    apiKey: process.env.COINGECKO_API_KEY || '',
    proApiKey: process.env.COINGECKO_PRO_API_KEY || '',
    baseUrl: 'https://api.coingecko.com/api/v3',
  },
  // ... other APIs
};
```

### API Services (`src/lib/api-services.ts`)

Centralized API service classes with proper authentication:

```typescript
export class GlassnodeService extends ApiService {
  protected getAuthHeaders(): Record<string, string> {
    if (!this.apiKey) return {};
    
    return {
      'X-API-KEY': this.apiKey
    };
  }
}
```

## 🧪 Testing API Keys

### Check Available Services

You can check which API services are available by running:

```typescript
import { getAvailableServices, hasApiKey } from '@/lib/config';

// Check specific API
console.log('OpenAI available:', hasApiKey('openai'));
console.log('CoinGecko available:', hasApiKey('coingecko'));

// Get all available services
const availableServices = getAvailableServices();
console.log('Available services:', availableServices);
```

### Validate Configuration

The system automatically validates API keys on startup:

```typescript
import { validateApiKeys } from '@/lib/config';

// Validate all required keys
const isValid = validateApiKeys();
if (!isValid) {
  console.warn('Some required API keys are missing');
}
```

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to version control
- Use `.env.example` as a template
- Add `.env` to `.gitignore`

### 2. API Key Management
- Use different keys for development and production
- Regularly rotate API keys
- Monitor usage and set up alerts

### 3. Rate Limiting
- Configure appropriate rate limits for each API
- Use caching to reduce API calls
- Implement retry logic with exponential backoff

## 📊 API Usage Monitoring

### Enable Logging

Set logging level in `.env`:

```bash
LOG_LEVEL=info
LOG_FILE_PATH=./logs/api.log
```

### Monitor Usage

The system logs API calls and errors. Check logs for:

- API key validation failures
- Rate limit exceeded errors
- Authentication errors
- Network timeouts

## 🔄 Fallback Mechanisms

The dashboard includes robust fallback mechanisms:

1. **Database Fallback**: Use cached data when APIs fail
2. **Mock Data**: Generate realistic mock data for development
3. **Graceful Degradation**: Continue functioning with limited features

## 🚀 Deployment

### Production Setup

1. **Environment Variables**: Set all required API keys in production environment
2. **Security**: Use secure secret management (AWS Secrets Manager, etc.)
3. **Monitoring**: Set up alerts for API usage and errors
4. **Scaling**: Configure appropriate rate limits for production load

### Development Setup

1. **Minimum Viable Keys**: At minimum, configure:
   - `OPENAI_API_KEY`
   - `COINGECKO_API_KEY`
   - `ZAI_API_KEY`

2. **Testing**: Use mock data for APIs without keys

## 🐛 Troubleshooting

### Common Issues

**API Key Not Found**
```bash
Error: API key not configured
```
- Check `.env` file exists and has required keys
- Verify environment variables are loaded

**Rate Limit Exceeded**
```bash
Error: API Error (429): Rate limit exceeded
```
- Reduce request frequency
- Check API plan limits
- Implement caching

**Authentication Failed**
```bash
Error: API Error (401): Unauthorized
```
- Verify API key is correct
- Check API key permissions
- Ensure key is not expired

### Debug Commands

```bash
# Check environment variables
node -e "console.log(process.env.OPENAI_API_KEY ? '✅ OpenAI configured' : '❌ OpenAI missing')"

# Test API connectivity
npm run test-api-keys
```

## 📝 Additional Resources

- [OpenAI Documentation](https://platform.openai.com/docs/api-reference)
- [CoinGecko API Documentation](https://www.coingecko.com/en/api/documentation)
- [Glassnode API Documentation](https://glassnodeacademy.com/api/)
- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [Reddit API Documentation](https://www.reddit.com/dev/api/)

## 📞 Support

For issues with specific APIs:
1. Check the API provider's documentation
2. Verify your account status and permissions
3. Contact the API provider's support team
4. Check system logs for detailed error information