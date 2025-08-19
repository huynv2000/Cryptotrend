// Cache Warming Service
// Enterprise-grade cache warming for financial applications

import { multiLayerCachingStrategy } from './caching-strategy';
import { db } from '@/lib/db';

export interface CacheWarmingConfig {
  marketDataInterval: number; // minutes
  cryptoMetricsInterval: number; // minutes
  analysisDataInterval: number; // minutes
  sentimentDataInterval: number; // minutes
}

export interface CacheWarmingStats {
  marketDataWarmed: number;
  cryptoMetricsWarmed: number;
  analysisDataWarmed: number;
  sentimentDataWarmed: number;
  totalKeysWarmed: number;
  lastWarming: Date;
  success: boolean;
}

export class CacheWarmingService {
  private config: CacheWarmingConfig;
  private stats: CacheWarmingStats;
  private isRunning = false;
  private warmingTasks: Map<string, NodeJS.Timeout> = new Map();

  constructor(config?: CacheWarmingConfig) {
    this.config = config || {
      marketDataInterval: 5,
      cryptoMetricsInterval: 10,
      analysisDataInterval: 15,
      sentimentDataInterval: 30,
    };

    this.stats = {
      marketDataWarmed: 0,
      cryptoMetricsWarmed: 0,
      analysisDataWarmed: 0,
      sentimentDataWarmed: 0,
      totalKeysWarmed: 0,
      lastWarming: new Date(),
      success: false,
    };
  }

  async initialize(): Promise<void> {
    try {
      console.log('🔄 Initializing Cache Warming Service...');
      
      // Schedule cache warming tasks
      await this.scheduleWarmingTasks();
      
      // Run initial warming
      await this.runInitialWarming();
      
      console.log('✅ Cache Warming Service initialized successfully');
    } catch (error) {
      console.error('❌ Cache Warming Service initialization failed:', error);
      throw error;
    }
  }

  private async scheduleWarmingTasks(): Promise<void> {
    try {
      // Schedule market data warming
      this.scheduleTask('warm-market-data', this.config.marketDataInterval, () => this.warmMarketData());
      
      // Schedule crypto metrics warming
      this.scheduleTask('warm-crypto-metrics', this.config.cryptoMetricsInterval, () => this.warmCryptoMetrics());
      
      // Schedule analysis data warming
      this.scheduleTask('warm-analysis-data', this.config.analysisDataInterval, () => this.warmAnalysisData());
      
      // Schedule sentiment data warming
      this.scheduleTask('warm-sentiment-data', this.config.sentimentDataInterval, () => this.warmSentimentData());
      
      console.log('✅ Cache warming tasks scheduled');
    } catch (error) {
      console.error('❌ Failed to schedule cache warming tasks:', error);
      throw error;
    }
  }

  private scheduleTask(name: string, intervalMinutes: number, task: () => Promise<void>): void {
    const intervalMs = intervalMinutes * 60 * 1000;
    
    // Clear existing task if any
    const existingTask = this.warmingTasks.get(name);
    if (existingTask) {
      clearInterval(existingTask);
    }
    
    // Schedule new task
    const taskInterval = setInterval(async () => {
      try {
        await task();
      } catch (error) {
        console.error(`❌ Cache warming task ${name} failed:`, error);
      }
    }, intervalMs);
    
    this.warmingTasks.set(name, taskInterval);
    
    console.log(`📅 Scheduled ${name} every ${intervalMinutes} minutes`);
  }

  private async runInitialWarming(): Promise<void> {
    try {
      console.log('🔄 Running initial cache warming...');
      
      // Warm all data types
      await Promise.all([
        this.warmMarketData(),
        this.warmCryptoMetrics(),
        this.warmAnalysisData(),
        this.warmSentimentData(),
      ]);
      
      console.log('✅ Initial cache warming completed');
    } catch (error) {
      console.error('❌ Initial cache warming failed:', error);
      // Don't throw error for initial warming failure
    }
  }

  private async warmMarketData(): Promise<void> {
    try {
      console.log('🔄 Warming market data cache...');
      
      const cryptocurrencies = await this.getActiveCryptocurrencies();
      const keys: string[] = [];
      const data: any[] = [];
      
      for (const crypto of cryptocurrencies) {
        try {
          const marketData = await this.getMarketData(crypto.id);
          const key = `market-data:${crypto.id}`;
          
          keys.push(key);
          data.push(marketData);
        } catch (error) {
          console.warn(`⚠️ Failed to get market data for ${crypto.id}:`, error);
        }
      }
      
      if (keys.length > 0) {
        await multiLayerCachingStrategy.warmCache(keys, data);
        this.stats.marketDataWarmed += keys.length;
        this.stats.totalKeysWarmed += keys.length;
        this.stats.lastWarming = new Date();
        this.stats.success = true;
        
        console.log(`✅ Market data cache warmed for ${keys.length} cryptocurrencies`);
      }
    } catch (error) {
      console.error('❌ Market data cache warming failed:', error);
      this.stats.success = false;
    }
  }

  private async warmCryptoMetrics(): Promise<void> {
    try {
      console.log('🔄 Warming crypto metrics cache...');
      
      const cryptocurrencies = await this.getActiveCryptocurrencies();
      const keys: string[] = [];
      const data: any[] = [];
      
      for (const crypto of cryptocurrencies) {
        try {
          const metrics = await this.getCryptoMetrics(crypto.id);
          const metricsKey = `crypto-metrics:${crypto.id}`;
          
          keys.push(metricsKey);
          data.push(metrics);
        } catch (error) {
          console.warn(`⚠️ Failed to get crypto metrics for ${crypto.id}:`, error);
        }
      }
      
      if (keys.length > 0) {
        await multiLayerCachingStrategy.warmCache(keys, data);
        this.stats.cryptoMetricsWarmed += keys.length;
        this.stats.totalKeysWarmed += keys.length;
        this.stats.lastWarming = new Date();
        this.stats.success = true;
        
        console.log(`✅ Crypto metrics cache warmed for ${keys.length} cryptocurrencies`);
      }
    } catch (error) {
      console.error('❌ Crypto metrics cache warming failed:', error);
      this.stats.success = false;
    }
  }

  private async warmAnalysisData(): Promise<void> {
    try {
      console.log('🔄 Warming analysis data cache...');
      
      const recentAnalyses = await this.getRecentAnalyses();
      const keys: string[] = [];
      const data: any[] = [];
      
      for (const analysis of recentAnalyses) {
        try {
          const key = `analysis:${analysis.cryptoId}:${analysis.analysisType}`;
          
          keys.push(key);
          data.push(analysis);
        } catch (error) {
          console.warn(`⚠️ Failed to process analysis data:`, error);
        }
      }
      
      if (keys.length > 0) {
        await multiLayerCachingStrategy.warmCache(keys, data);
        this.stats.analysisDataWarmed += keys.length;
        this.stats.totalKeysWarmed += keys.length;
        this.stats.lastWarming = new Date();
        this.stats.success = true;
        
        console.log(`✅ Analysis data cache warmed for ${keys.length} analyses`);
      }
    } catch (error) {
      console.error('❌ Analysis data cache warming failed:', error);
      this.stats.success = false;
    }
  }

  private async warmSentimentData(): Promise<void> {
    try {
      console.log('🔄 Warming sentiment data cache...');
      
      const sentimentData = await this.getSentimentData();
      const keys: string[] = [];
      const data: any[] = [];
      
      for (const data of sentimentData) {
        try {
          const key = `sentiment:${data.cryptoId}`;
          
          keys.push(key);
          data.push(data);
        } catch (error) {
          console.warn(`⚠️ Failed to process sentiment data:`, error);
        }
      }
      
      if (keys.length > 0) {
        await multiLayerCachingStrategy.warmCache(keys, data);
        this.stats.sentimentDataWarmed += keys.length;
        this.stats.totalKeysWarmed += keys.length;
        this.stats.lastWarming = new Date();
        this.stats.success = true;
        
        console.log(`✅ Sentiment data cache warmed for ${keys.length} cryptocurrencies`);
      }
    } catch (error) {
      console.error('❌ Sentiment data cache warming failed:', error);
      this.stats.success = false;
    }
  }

  private async getActiveCryptocurrencies(): Promise<any[]> {
    try {
      const cryptocurrencies = await db.cryptocurrency.findMany({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          symbol: true,
          name: true,
        },
        take: 50, // Limit to top 50 for performance
      });

      return cryptocurrencies;
    } catch (error) {
      console.error('❌ Failed to get active cryptocurrencies:', error);
      return [];
    }
  }

  private async getMarketData(cryptoId: string): Promise<any> {
    try {
      // Get latest price history for the cryptocurrency
      const priceHistory = await db.priceHistory.findFirst({
        where: {
          cryptoId,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 1,
      });

      if (!priceHistory) {
        return null;
      }

      return {
        cryptoId,
        price: priceHistory.price,
        volume24h: priceHistory.volume24h,
        marketCap: priceHistory.marketCap,
        change24h: priceHistory.priceChange24h,
        timestamp: priceHistory.timestamp,
      };
    } catch (error) {
      console.error(`❌ Failed to get market data for ${cryptoId}:`, error);
      return null;
    }
  }

  private async getCryptoMetrics(cryptoId: string): Promise<any> {
    try {
      // Get latest on-chain metrics for the cryptocurrency
      const onChainMetrics = await db.onChainMetrics.findFirst({
        where: {
          cryptoId,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 1,
      });

      if (!onChainMetrics) {
        return null;
      }

      return {
        cryptoId,
        mvrv: onChainMetrics.mvrv,
        nupl: onChainMetrics.nupl,
        sopr: onChainMetrics.sopr,
        activeAddresses: onChainMetrics.activeAddresses,
        exchangeInflow: onChainMetrics.exchangeInflow,
        exchangeOutflow: onChainMetrics.exchangeOutflow,
        timestamp: onChainMetrics.timestamp,
      };
    } catch (error) {
      console.error(`❌ Failed to get crypto metrics for ${cryptoId}:`, error);
      return null;
    }
  }

  private async getRecentAnalyses(): Promise<any[]> {
    try {
      const analyses = await db.analysisHistory.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 100, // Limit to recent 100 analyses
      });

      return analyses;
    } catch (error) {
      console.error('❌ Failed to get recent analyses:', error);
      return [];
    }
  }

  private async getSentimentData(): Promise<any[]> {
    try {
      const sentimentData = await db.sentimentData.findMany({
        where: {
          timestamp: {
            gte: new Date(Date.now() - 6 * 60 * 60 * 1000), // Last 6 hours
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 50, // Limit to recent 50 sentiment data points
      });

      return sentimentData;
    } catch (error) {
      console.error('❌ Failed to get sentiment data:', error);
      return [];
    }
  }

  async getStats(): Promise<CacheWarmingStats> {
    return { ...this.stats };
  }

  async updateConfig(newConfig: Partial<CacheWarmingConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...newConfig };
      
      // Reschedule tasks with new intervals
      await this.scheduleWarmingTasks();
      
      console.log('✅ Cache warming config updated');
    } catch (error) {
      console.error('❌ Failed to update cache warming config:', error);
      throw error;
    }
  }

  async runManualWarming(dataType: 'market-data' | 'crypto-metrics' | 'analysis-data' | 'sentiment-data' | 'all'): Promise<void> {
    try {
      console.log(`🔄 Running manual cache warming for ${dataType}...`);
      
      switch (dataType) {
        case 'market-data':
          await this.warmMarketData();
          break;
        case 'crypto-metrics':
          await this.warmCryptoMetrics();
          break;
        case 'analysis-data':
          await this.warmAnalysisData();
          break;
        case 'sentiment-data':
          await this.warmSentimentData();
          break;
        case 'all':
          await Promise.all([
            this.warmMarketData(),
            this.warmCryptoMetrics(),
            this.warmAnalysisData(),
            this.warmSentimentData(),
          ]);
          break;
      }
      
      console.log(`✅ Manual cache warming completed for ${dataType}`);
    } catch (error) {
      console.error(`❌ Manual cache warming failed for ${dataType}:`, error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      console.log('🛑 Stopping Cache Warming Service...');
      
      // Clear all scheduled tasks
      for (const [name, task] of this.warmingTasks) {
        clearInterval(task);
        console.log(`🛑 Stopped ${name} task`);
      }
      
      this.warmingTasks.clear();
      this.isRunning = false;
      
      console.log('✅ Cache Warming Service stopped');
    } catch (error) {
      console.error('❌ Failed to stop Cache Warming Service:', error);
      throw error;
    }
  }
}

// Global instance
export const cacheWarmingService = new CacheWarmingService();