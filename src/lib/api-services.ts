/**
 * API Services for External Data Sources
 * Centralized management of all external API calls with proper authentication
 */

import axios from 'axios';
import { 
  MARKET_DATA_APIS, 
  ONCHAIN_APIS, 
  DERIVATIVES_APIS, 
  SOCIAL_APIS, 
  NEWS_APIS, 
  GOOGLE_TRENDS_CONFIG,
  hasApiKey,
  RATE_LIMIT_CONFIG 
} from './config';

// Generic API service class
export class ApiService {
  protected baseUrl: string;
  protected apiKey: string;
  protected serviceName: string;

  constructor(baseUrl: string, apiKey: string, serviceName: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.serviceName = serviceName;
  }

  protected async request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      params?: Record<string, any>;
      data?: any;
      headers?: Record<string, string>;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const { method = 'GET', params, data, headers = {}, timeout = 10000 } = options;

    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      // Add authentication headers if API key is available
      const authHeaders = this.getAuthHeaders();
      
      const response = await axios({
        url,
        method,
        params,
        data,
        headers: {
          ...authHeaders,
          ...headers,
          'User-Agent': 'CryptoAnalyticsDashboard/1.0'
        },
        timeout
      });

      return response.data;
    } catch (error) {
      console.error(`API call failed for ${this.serviceName}:`, error);
      throw this.handleApiError(error);
    }
  }

  protected getAuthHeaders(): Record<string, string> {
    if (!this.apiKey) {
      return {};
    }

    // Default authentication header - can be overridden by subclasses
    return {
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  protected handleApiError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      return new Error(`API Error (${status}): ${data.message || data.error || 'Unknown error'}`);
    } else if (error.request) {
      // No response received
      return new Error('Network Error: No response received from API');
    } else {
      // Request setup error
      return new Error(`Request Error: ${error.message}`);
    }
  }

  hasValidKey(): boolean {
    return !!this.apiKey;
  }
}

// Glassnode API Service
export class GlassnodeService extends ApiService {
  constructor() {
    super(
      ONCHAIN_APIS.glassnode.baseUrl,
      ONCHAIN_APIS.glassnode.apiKey,
      'Glassnode'
    );
  }

  protected getAuthHeaders(): Record<string, string> {
    if (!this.apiKey) return {};
    
    return {
      'X-API-KEY': this.apiKey
    };
  }

  async getOnChainMetrics(coinId: string): Promise<any> {
    if (!this.hasValidKey()) {
      throw new Error('Glassnode API key not configured');
    }

    try {
      const endpoints = [
        `/metrics/market/mvrv`,
        `/metrics/indicators/nupl`,
        `/metrics/indicators/sopr`,
        `/metrics/addresses/active_count`,
        `/metrics/transactions/transfers_volume_to_exchanges_sum`,
        `/metrics/transactions/transfers_volume_from_exchanges_sum`
      ];

      const responses = await Promise.allSettled(
        endpoints.map(endpoint => this.request<any>(endpoint, { params: { a: coinId } }))
      );

      return {
        mvrv: this.extractValue(responses[0]),
        nupl: this.extractValue(responses[1]),
        sopr: this.extractValue(responses[2]),
        activeAddresses: this.extractValue(responses[3]),
        exchangeInflow: this.extractValue(responses[4]),
        exchangeOutflow: this.extractValue(responses[5]),
        transactionVolume: this.extractValue(responses[4]) + this.extractValue(responses[5])
      };
    } catch (error) {
      console.error('Glassnode API error:', error);
      throw error;
    }
  }

  private extractValue(result: PromiseSettledResult<any>): number {
    if (result.status === 'fulfilled' && result.value) {
      return parseFloat(result.value) || 0;
    }
    return 0;
  }
}

// CryptoQuant API Service
export class CryptoQuantService extends ApiService {
  constructor() {
    super(
      ONCHAIN_APIS.cryptoquant.baseUrl,
      ONCHAIN_APIS.cryptoquant.apiKey,
      'CryptoQuant'
    );
  }

  protected getAuthHeaders(): Record<string, string> {
    if (!this.apiKey) return {};
    
    return {
      'X-API-KEY': this.apiKey
    };
  }

  async getOnChainData(coinId: string): Promise<any> {
    if (!this.hasValidKey()) {
      throw new Error('CryptoQuant API key not configured');
    }

    try {
      const [flowData, exchangeData] = await Promise.all([
        this.request<any>('/onchain/flow', { params: { asset: coinId } }),
        this.request<any>('/onchain/exchange-flows', { params: { asset: coinId } })
      ]);

      return {
        ...flowData,
        ...exchangeData
      };
    } catch (error) {
      console.error('CryptoQuant API error:', error);
      throw error;
    }
  }
}

// Coinglass API Service
export class CoinglassService extends ApiService {
  constructor() {
    super(
      DERIVATIVES_APIS.coinglass.baseUrl,
      DERIVATIVES_APIS.coinglass.apiKey,
      'Coinglass'
    );
  }

  protected getAuthHeaders(): Record<string, string> {
    if (!this.apiKey) return {};
    
    return {
      'X-API-KEY': this.apiKey
    };
  }

  async getDerivativeMetrics(coinId: string): Promise<any> {
    if (!this.hasValidKey()) {
      throw new Error('Coinglass API key not configured');
    }

    try {
      const [fundingRate, openInterest, liquidations] = await Promise.all([
        this.request<any>('/funding-rate', { params: { symbol: coinId.toUpperCase() } }),
        this.request<any>('/open-interest', { params: { symbol: coinId.toUpperCase() } }),
        this.request<any>('/liquidation', { params: { symbol: coinId.toUpperCase() } })
      ]);

      return {
        fundingRate: fundingRate.rate || 0,
        openInterest: openInterest.value || 0,
        liquidationVolume: liquidations.volume || 0,
        putCallRatio: fundingRate.putCallRatio || 1
      };
    } catch (error) {
      console.error('Coinglass API error:', error);
      throw error;
    }
  }
}

// LunarCrush API Service
export class LunarCrushService extends ApiService {
  constructor() {
    super(
      SOCIAL_APIS.lunarcrush.baseUrl,
      SOCIAL_APIS.lunarcrush.apiKey,
      'LunarCrush'
    );
  }

  protected getAuthHeaders(): Record<string, string> {
    if (!this.apiKey) return {};
    
    return {
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  async getSocialMetrics(coinId: string): Promise<any> {
    if (!this.hasValidKey()) {
      throw new Error('LunarCrush API key not configured');
    }

    try {
      const response = await this.request<any>('/assets', {
        params: {
          symbol: coinId.toUpperCase(),
          data: 'social'
        }
      });

      return {
        twitterSentiment: response.data?.[0]?.twitter_sentiment || 0.5,
        redditSentiment: response.data?.[0]?.reddit_sentiment || 0.5,
        socialVolume: response.data?.[0]?.social_volume || 0,
        engagementRate: response.data?.[0]?.engagement_rate || 0,
        influencerSentiment: response.data?.[0]?.influencer_sentiment || 0.5,
        trendingScore: response.data?.[0]?.galaxy_score || 50
      };
    } catch (error) {
      console.error('LunarCrush API error:', error);
      throw error;
    }
  }
}

// Twitter API Service
export class TwitterService extends ApiService {
  constructor() {
    super(
      SOCIAL_APIS.twitter.baseUrl,
      SOCIAL_APIS.twitter.bearerToken,
      'Twitter'
    );
  }

  protected getAuthHeaders(): Record<string, string> {
    if (!this.apiKey) return {};
    
    return {
      'Authorization': `Bearer ${this.apiKey}`
    };
  }

  async getTweetMetrics(query: string): Promise<any> {
    if (!this.hasValidKey()) {
      throw new Error('Twitter API key not configured');
    }

    try {
      const response = await this.request<any>('/tweets/search/recent', {
        params: {
          query: `${query} -is:retweet`,
          max_results: 100,
          'tweet.fields': 'public_metrics,created_at'
        }
      });

      const tweets = response.data || [];
      const totalLikes = tweets.reduce((sum: number, tweet: any) => sum + (tweet.public_metrics?.like_count || 0), 0);
      const totalRetweets = tweets.reduce((sum: number, tweet: any) => sum + (tweet.public_metrics?.retweet_count || 0), 0);
      
      return {
        tweetCount: tweets.length,
        totalLikes,
        totalRetweets,
        avgLikes: tweets.length > 0 ? totalLikes / tweets.length : 0,
        avgRetweets: tweets.length > 0 ? totalRetweets / tweets.length : 0,
        sentiment: this.calculateSentiment(tweets)
      };
    } catch (error) {
      console.error('Twitter API error:', error);
      throw error;
    }
  }

  private calculateSentiment(tweets: any[]): number {
    // Simple sentiment calculation based on engagement metrics
    if (tweets.length === 0) return 0.5;
    
    const avgEngagement = tweets.reduce((sum: number, tweet: any) => {
      const metrics = tweet.public_metrics || {};
      return sum + (metrics.like_count || 0) + (metrics.retweet_count || 0);
    }, 0) / tweets.length;
    
    // Normalize to 0-1 range (this is a simplified approach)
    return Math.min(avgEngagement / 100, 1);
  }
}

// News API Service
export class NewsService extends ApiService {
  constructor() {
    super(
      NEWS_APIS.newsApi.baseUrl,
      NEWS_APIS.newsApi.apiKey,
      'NewsAPI'
    );
  }

  protected getAuthHeaders(): Record<string, string> {
    if (!this.apiKey) return {};
    
    return {
      'X-API-KEY': this.apiKey
    };
  }

  async getCryptoNews(q: string = 'cryptocurrency'): Promise<any> {
    if (!this.hasValidKey()) {
      throw new Error('News API key not configured');
    }

    try {
      const response = await this.request<any>('/everything', {
        params: {
          q,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: 50
        }
      });

      return {
        articles: response.articles || [],
        totalResults: response.totalResults || 0,
        sentiment: this.calculateNewsSentiment(response.articles || [])
      };
    } catch (error) {
      console.error('News API error:', error);
      throw error;
    }
  }

  private calculateNewsSentiment(articles: any[]): number {
    if (articles.length === 0) return 0.5;
    
    // Simple sentiment based on title keywords
    const positiveWords = ['bull', 'rise', 'gain', 'up', 'high', 'growth', 'positive', 'surge'];
    const negativeWords = ['bear', 'fall', 'loss', 'down', 'low', 'drop', 'negative', 'crash'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    articles.forEach(article => {
      const title = (article.title || '').toLowerCase();
      const description = (article.description || '').toLowerCase();
      const text = title + ' ' + description;
      
      positiveWords.forEach(word => {
        if (text.includes(word)) positiveCount++;
      });
      
      negativeWords.forEach(word => {
        if (text.includes(word)) negativeCount++;
      });
    });
    
    const total = positiveCount + negativeCount;
    if (total === 0) return 0.5;
    
    return positiveCount / total;
  }
}

// Factory function to create API services
export const createApiService = (serviceName: string): ApiService | null => {
  switch (serviceName.toLowerCase()) {
    case 'glassnode':
      return hasApiKey('glassnode') ? new GlassnodeService() : null;
    case 'cryptoquant':
      return hasApiKey('cryptoquant') ? new CryptoQuantService() : null;
    case 'coinglass':
      return hasApiKey('coinglass') ? new CoinglassService() : null;
    case 'lunarcrush':
      return hasApiKey('lunarcrush') ? new LunarCrushService() : null;
    case 'twitter':
      return hasApiKey('twitter') ? new TwitterService() : null;
    case 'newsapi':
      return hasApiKey('newsapi') ? new NewsService() : null;
    default:
      return null;
  }
};

// Check which API services are available
export const getAvailableServices = (): string[] => {
  const services = [
    'glassnode',
    'cryptoquant', 
    'coinglass',
    'lunarcrush',
    'twitter',
    'newsapi'
  ];
  
  return services.filter(service => hasApiKey(service));
};

// Export all services for direct use
export const apiServices = {
  glassnode: hasApiKey('glassnode') ? new GlassnodeService() : null,
  cryptoquant: hasApiKey('cryptoquant') ? new CryptoQuantService() : null,
  coinglass: hasApiKey('coinglass') ? new CoinglassService() : null,
  lunarcrush: hasApiKey('lunarcrush') ? new LunarCrushService() : null,
  twitter: hasApiKey('twitter') ? new TwitterService() : null,
  newsapi: hasApiKey('newsapi') ? new NewsService() : null,
};

export default apiServices;