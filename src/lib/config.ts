/**
 * Configuration file for API keys and settings
 * All sensitive data is loaded from environment variables
 */

// Database Configuration
export const DB_CONFIG = {
  url: process.env.DATABASE_URL || 'file:./db/custom.db',
};

// AI API Configuration
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
    demoKey: process.env.COINGECKO_DEMO_KEY || '',
    baseUrl: 'https://api.coingecko.com/api/v3',
    proBaseUrl: 'https://pro-api.coingecko.com/api/v3',
  },
  alternativeMe: {
    apiKey: process.env.ALTERNATIVE_ME_API_KEY || '',
    baseUrl: 'https://api.alternative.me',
  },
};

// On-chain Data APIs
export const ONCHAIN_APIS = {
  glassnode: {
    apiKey: process.env.GLASSNODE_API_KEY || '',
    secretKey: process.env.GLASSNODE_SECRET_KEY || '',
    baseUrl: 'https://api.glassnode.com/api/v1',
  },
  cryptoquant: {
    apiKey: process.env.CRYPTOQUANT_API_KEY || '',
    secretKey: process.env.CRYPTOQUANT_SECRET_KEY || '',
    baseUrl: 'https://api.cryptoquant.com/v1',
  },
};

// Derivatives Data APIs
export const DERIVATIVES_APIS = {
  coinglass: {
    apiKey: process.env.COINGLASS_API_KEY || '',
    baseUrl: 'https://open-api.coinglass.com/api/v1',
  },
};

// Social Sentiment APIs
export const SOCIAL_APIS = {
  lunarcrush: {
    apiKey: process.env.LUNARCRUSH_API_KEY || '',
    baseUrl: 'https://api.lunarcrush.com/v2',
  },
  twitter: {
    apiKey: process.env.TWITTER_API_KEY || '',
    apiSecret: process.env.TWITTER_API_SECRET || '',
    accessToken: process.env.TWITTER_ACCESS_TOKEN || '',
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET || '',
    bearerToken: process.env.TWITTER_BEARER_TOKEN || '',
    baseUrl: 'https://api.twitter.com/2',
  },
  reddit: {
    clientId: process.env.REDDIT_CLIENT_ID || '',
    clientSecret: process.env.REDDIT_CLIENT_SECRET || '',
    userAgent: process.env.REDDIT_USER_AGENT || 'CryptoAnalyticsDashboard/1.0',
    baseUrl: 'https://www.reddit.com',
  },
};

// News APIs
export const NEWS_APIS = {
  newsApi: {
    apiKey: process.env.NEWS_API_KEY || '',
    baseUrl: 'https://newsapi.org/v2',
  },
  cryptopanic: {
    apiKey: process.env.CRYPTOPANIC_API_KEY || '',
    baseUrl: 'https://cryptopanic.com/api/v1',
  },
};

// Google Trends Configuration
export const GOOGLE_TRENDS_CONFIG = {
  apiKey: process.env.GOOGLE_TRENDS_API_KEY || '',
  baseUrl: 'https://trends.googleapis.com/trends/v1',
};

// WebSocket Configuration
export const SOCKET_CONFIG = {
  port: parseInt(process.env.SOCKET_IO_PORT || '3000'),
  path: process.env.SOCKET_IO_PATH || '/api/socketio',
};

// Rate Limiting Configuration
export const RATE_LIMIT_CONFIG = {
  requestsPerMinute: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_MINUTE || '60'),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
};

// Cache Configuration
export const CACHE_CONFIG = {
  ttlSeconds: parseInt(process.env.CACHE_TTL_SECONDS || '300'),
  maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
};

// Logging Configuration
export const LOG_CONFIG = {
  level: process.env.LOG_LEVEL || 'info',
  filePath: process.env.LOG_FILE_PATH || './logs/app.log',
};

// Application Configuration
export const APP_CONFIG = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000'),
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

// Validation Functions
export const validateApiKeys = () => {
  const requiredKeys = [
    { name: 'OpenAI API Key', key: AI_CONFIG.openai.apiKey },
    { name: 'Z.AI API Key', key: AI_CONFIG.zai.apiKey },
    { name: 'CoinGecko API Key', key: MARKET_DATA_APIS.coingecko.apiKey },
  ];

  const missingKeys = requiredKeys.filter(({ key }) => !key);
  
  if (missingKeys.length > 0) {
    console.warn('Missing API keys:', missingKeys.map(({ name }) => name).join(', '));
    console.warn('Please check your .env file and add the required API keys.');
  }

  return missingKeys.length === 0;
};

// Helper function to check if an API key is available
export const hasApiKey = (serviceName: string): boolean => {
  switch (serviceName.toLowerCase()) {
    case 'openai':
      return !!(AI_CONFIG.openai.apiKey && AI_CONFIG.openai.apiKey.length > 3 && !AI_CONFIG.openai.apiKey.includes('your-'));
    case 'zai':
      return !!(AI_CONFIG.zai.apiKey && AI_CONFIG.zai.apiKey.length > 3 && !AI_CONFIG.zai.apiKey.includes('your-'));
    case 'coingecko':
      return !!(MARKET_DATA_APIS.coingecko.apiKey && MARKET_DATA_APIS.coingecko.apiKey.length > 10 && !MARKET_DATA_APIS.coingecko.apiKey.includes('your-'));
    case 'glassnode':
      return !!(ONCHAIN_APIS.glassnode.apiKey && ONCHAIN_APIS.glassnode.apiKey.length > 10 && !ONCHAIN_APIS.glassnode.apiKey.includes('your-'));
    case 'cryptoquant':
      return !!(ONCHAIN_APIS.cryptoquant.apiKey && ONCHAIN_APIS.cryptoquant.apiKey.length > 10 && !ONCHAIN_APIS.cryptoquant.apiKey.includes('your-'));
    case 'coinglass':
      return !!(DERIVATIVES_APIS.coinglass.apiKey && DERIVATIVES_APIS.coinglass.apiKey.length > 10 && !DERIVATIVES_APIS.coinglass.apiKey.includes('your-'));
    case 'lunarcrush':
      return !!(SOCIAL_APIS.lunarcrush.apiKey && SOCIAL_APIS.lunarcrush.apiKey.length > 10 && !SOCIAL_APIS.lunarcrush.apiKey.includes('your-'));
    case 'twitter':
      return !!(SOCIAL_APIS.twitter.apiKey && SOCIAL_APIS.twitter.apiKey.length > 10 && !SOCIAL_APIS.twitter.apiKey.includes('your-'));
    case 'reddit':
      return !!(SOCIAL_APIS.reddit.clientId && SOCIAL_APIS.reddit.clientId.length > 10 && !SOCIAL_APIS.reddit.clientId.includes('your-'));
    case 'newsapi':
      return !!(NEWS_APIS.newsApi.apiKey && NEWS_APIS.newsApi.apiKey.length > 10 && !NEWS_APIS.newsApi.apiKey.includes('your-'));
    case 'cryptopanic':
      return !!(NEWS_APIS.cryptopanic.apiKey && NEWS_APIS.cryptopanic.apiKey.length > 10 && !NEWS_APIS.cryptopanic.apiKey.includes('your-'));
    default:
      return false;
  }
};

// Export all configurations for easy access
export const CONFIG = {
  db: DB_CONFIG,
  ai: AI_CONFIG,
  marketData: MARKET_DATA_APIS,
  onchain: ONCHAIN_APIS,
  derivatives: DERIVATIVES_APIS,
  social: SOCIAL_APIS,
  news: NEWS_APIS,
  googleTrends: GOOGLE_TRENDS_CONFIG,
  socket: SOCKET_CONFIG,
  rateLimit: RATE_LIMIT_CONFIG,
  cache: CACHE_CONFIG,
  logging: LOG_CONFIG,
  app: APP_CONFIG,
};

export default CONFIG;