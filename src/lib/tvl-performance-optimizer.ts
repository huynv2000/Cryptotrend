/**
 * TVL Performance Optimizer
 * Optimizes data fetching, caching, and rendering for TVL history charts
 */

import { cacheService } from './cache-service';
import { TVLDataPoint, TVLDataPointWithMA, MAMetrics } from './tvl-analysis-service';

interface PerformanceConfig {
  cacheTimeout: number;
  batchSize: number;
  enableCompression: boolean;
  maxConcurrentRequests: number;
  enablePrefetching: boolean;
}

interface OptimizedTVLData {
  history: TVLDataPoint[];
  movingAverage: TVLDataPointWithMA[];
  metrics: MAMetrics | null;
  stats: {
    currentTVL: number;
    change24h: number;
    avgTVL: number;
    peakTVL: number;
    troughTVL: number;
    volatility: number;
  };
  cacheInfo: {
    hit: boolean;
    timestamp: number;
    size: number;
  };
}

export class TVLPerformanceOptimizer {
  private static instance: TVLPerformanceOptimizer;
  private config: PerformanceConfig;
  private activeRequests: Map<string, Promise<any>> = new Map();
  private prefetchQueue: Array<{ coinId: string; timeframe: string }> = [];

  private constructor() {
    this.config = {
      cacheTimeout: 5 * 60 * 1000, // 5 minutes
      batchSize: 50,
      enableCompression: true,
      maxConcurrentRequests: 3,
      enablePrefetching: true
    };
  }

  static getInstance(): TVLPerformanceOptimizer {
    if (!TVLPerformanceOptimizer.instance) {
      TVLPerformanceOptimizer.instance = new TVLPerformanceOptimizer();
    }
    return TVLPerformanceOptimizer.instance;
  }

  /**
   * Optimized data fetching that combines TVL history and moving average data
   */
  async fetchOptimizedTVLData(
    coinId: string,
    timeframe: string,
    options: {
      forceRefresh?: boolean;
      includeMovingAverage?: boolean;
      includeMetrics?: boolean;
    } = {}
  ): Promise<OptimizedTVLData> {
    const {
      forceRefresh = false,
      includeMovingAverage = true,
      includeMetrics = true
    } = options;

    const cacheKey = `optimized-tvl-${coinId}-${timeframe}-${includeMovingAverage}-${includeMetrics}`;
    
    // Check cache first
    if (!forceRefresh) {
      const cachedData = cacheService.get<OptimizedTVLData>(cacheKey);
      if (cachedData) {
        console.log(`Cache hit for optimized TVL data: ${cacheKey}`);
        return cachedData;
      }
    }

    // Check if there's already an active request for this data
    const requestKey = `${coinId}-${timeframe}`;
    if (this.activeRequests.has(requestKey)) {
      console.log(`Waiting for existing request: ${requestKey}`);
      return this.activeRequests.get(requestKey);
    }

    // Create new request
    const requestPromise = this.performOptimizedFetch(
      coinId,
      timeframe,
      includeMovingAverage,
      includeMetrics,
      cacheKey
    );

    this.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  private async performOptimizedFetch(
    coinId: string,
    timeframe: string,
    includeMovingAverage: boolean,
    includeMetrics: boolean,
    cacheKey: string
  ): Promise<OptimizedTVLData> {
    try {
      console.log(`Fetching optimized TVL data for ${coinId}, timeframe: ${timeframe}`);

      // Convert timeframe to days
      const days = this.getTimeframeDays(timeframe);

      // Fetch combined data from single API endpoint
      const response = await fetch(
        `/api/v2/blockchain/tvl/combined?coinId=${coinId}&days=${days}&includeMovingAverage=${includeMovingAverage}`,
        {
          headers: {
            'Cache-Control': 'max-age=300',
            'Pragma': 'no-cache'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch combined TVL data: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch combined TVL data');
      }

      const data = result.data;
      const historyData: TVLDataPoint[] = data.history || [];
      const movingAverageData: TVLDataPointWithMA[] = data.movingAverage || [];
      const metrics: MAMetrics | null = data.metrics || null;

      // Calculate statistics
      const stats = data.stats || this.calculateStats(historyData);

      const optimizedData: OptimizedTVLData = {
        history: historyData,
        movingAverage: movingAverageData,
        metrics,
        stats,
        cacheInfo: {
          hit: false,
          timestamp: Date.now(),
          size: historyData.length + movingAverageData.length
        }
      };

      // Cache the result
      cacheService.set(cacheKey, optimizedData, this.config.cacheTimeout);

      console.log(`Optimized TVL data fetched for ${coinId}: ${historyData.length} history, ${movingAverageData.length} MA points (single request)`);

      // Queue prefetching for common timeframes
      if (this.config.enablePrefetching) {
        this.queuePrefetching(coinId, timeframe);
      }

      return optimizedData;

    } catch (error) {
      console.error('Error in optimized TVL fetch:', error);
      throw error;
    }
  }

  /**
   * Calculate TVL statistics efficiently
   */
  private calculateStats(data: TVLDataPoint[]): OptimizedTVLData['stats'] {
    if (data.length === 0) {
      return {
        currentTVL: 0,
        change24h: 0,
        avgTVL: 0,
        peakTVL: 0,
        troughTVL: 0,
        volatility: 0
      };
    }

    const tvls = data.map(d => d.tvl);
    const currentTVL = tvls[tvls.length - 1];
    const previousTVL = tvls.length > 1 ? tvls[tvls.length - 2] : currentTVL;
    const change24h = previousTVL > 0 ? ((currentTVL - previousTVL) / previousTVL) * 100 : 0;
    
    const avgTVL = tvls.reduce((sum, tvl) => sum + tvl, 0) / tvls.length;
    const peakTVL = Math.max(...tvls);
    const troughTVL = Math.min(...tvls);
    
    // Calculate volatility (standard deviation)
    const variance = tvls.reduce((sum, tvl) => sum + Math.pow(tvl - avgTVL, 2), 0) / tvls.length;
    const volatility = Math.sqrt(variance) / avgTVL * 100;

    return {
      currentTVL,
      change24h,
      avgTVL,
      peakTVL,
      troughTVL,
      volatility
    };
  }

  /**
   * Convert timeframe to days
   */
  private getTimeframeDays(timeframe: string): number {
    switch (timeframe) {
      case '24H': return 1;
      case '7D': return 7;
      case '30D': return 30;
      case '90D': return 90;
      default: return 30;
    }
  }

  /**
   * Queue prefetching for common timeframes
   */
  private queuePrefetching(coinId: string, currentTimeframe: string) {
    const timeframes = ['24H', '7D', '30D', '90D'].filter(tf => tf !== currentTimeframe);
    
    timeframes.forEach(timeframe => {
      if (!this.prefetchQueue.some(item => item.coinId === coinId && item.timeframe === timeframe)) {
        this.prefetchQueue.push({ coinId, timeframe });
      }
    });

    // Process prefetch queue
    this.processPrefetchQueue();
  }

  /**
   * Process prefetch queue with rate limiting
   */
  private async processPrefetchQueue() {
    if (this.prefetchQueue.length === 0) return;

    const batchSize = Math.min(2, this.prefetchQueue.length); // Prefetch 2 at a time
    const batch = this.prefetchQueue.splice(0, batchSize);

    try {
      await Promise.allSettled(
        batch.map(({ coinId, timeframe }) =>
          this.fetchOptimizedTVLData(coinId, timeframe, {
            forceRefresh: false,
            includeMovingAverage: false, // Don't prefetch MA data to save resources
            includeMetrics: false
          })
        )
      );
    } catch (error) {
      console.warn('Error during prefetching:', error);
    }
  }

  /**
   * Clear cache for a specific coin
   */
  clearCache(coinId?: string) {
    if (coinId) {
      cacheService.deleteByPattern(new RegExp(`^optimized-tvl-${coinId}-`));
      cacheService.deleteByPattern(new RegExp(`^tvl-history-${coinId}-`));
      cacheService.deleteByPattern(new RegExp(`^ma-${coinId}-`));
    } else {
      cacheService.deleteByPattern(new RegExp('^optimized-tvl-'));
      cacheService.deleteByPattern(new RegExp('^tvl-history-'));
      cacheService.deleteByPattern(new RegExp('^ma-'));
    }
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      activeRequests: this.activeRequests.size,
      prefetchQueueSize: this.prefetchQueue.length,
      cacheStats: cacheService.getStats(),
      config: this.config
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}