import { db } from '@/lib/db';

export interface TVLDataPoint {
  date: string;
  tvl: number;
  changePercent?: number;
  dominance?: number;
  volume?: number;
  price?: number;
}

export interface TVLDataPointWithMA extends TVLDataPoint {
  movingAverage: number;
  maDeviation: number;
}

export interface MAMetrics {
  currentTVL: number;
  currentMA: number;
  maTrend: 'up' | 'down' | 'stable';
  volatility: number;
  distanceFromMA: number;
  signal: 'buy_signal' | 'sell_signal' | 'overbought' | 'oversold' | 'neutral';
}

export interface MovingAverageResult {
  coinId: string;
  period: number;
  data: TVLDataPointWithMA[];
  metrics: MAMetrics;
  lastUpdated: string;
}

export class TVLAnalysisService {
  private static instance: TVLAnalysisService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static getInstance(): TVLAnalysisService {
    if (!TVLAnalysisService.instance) {
      TVLAnalysisService.instance = new TVLAnalysisService();
    }
    return TVLAnalysisService.instance;
  }

  async calculateMovingAverage(
    coinId: string,
    period: number = 30,
    forceRefresh: boolean = false
  ): Promise<MovingAverageResult> {
    const cacheKey = `ma-${coinId}-${period}`;
    const now = Date.now();
    
    // Check cache first
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached && (now - cached.timestamp) < cached.ttl) {
        console.log(`Using cached moving average data for ${coinId}`);
        return cached.data;
      }
    }

    try {
      // Fetch historical TVL data from database
      const historicalData = await this.fetchHistoricalTVLFromDB(coinId, period);
      
      if (historicalData.length === 0) {
        throw new Error(`No historical TVL data found for ${coinId}`);
      }

      // Calculate moving average
      const maData = this.calculateMA(historicalData, period);
      
      // Calculate additional metrics
      const metrics = this.calculateMetrics(maData, historicalData);
      
      const result: MovingAverageResult = {
        coinId,
        period,
        data: maData,
        metrics,
        lastUpdated: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: now,
        ttl: 5 * 60 * 1000 // 5 minutes TTL
      });

      console.log(`Successfully calculated moving average for ${coinId}: ${result.data.length} data points`);
      return result;

    } catch (error) {
      console.error(`Error calculating moving average for ${coinId}:`, error);
      throw error;
    }
  }

  private async fetchHistoricalTVLFromDB(coinId: string, days: number): Promise<TVLDataPoint[]> {
    try {
      // Get cryptocurrency info
      const crypto = await db.cryptocurrency.findFirst({
        where: { coinGeckoId: coinId }
      });

      if (!crypto) {
        throw new Error(`Cryptocurrency not found: ${coinId}`);
      }

      // Get TVL metrics with historical data
      const tvlMetrics = await db.tVLMetric.findFirst({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' }
      });

      if (!tvlMetrics || !tvlMetrics.tvlHistory) {
        throw new Error(`No TVL history data found for ${coinId}`);
      }

      // Parse historical data
      const historicalData = JSON.parse(tvlMetrics.tvlHistory) as Array<{
        date: string;
        tvl: number;
        dominance?: number;
      }>;

      // Filter and format data for the requested period
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const filteredData = historicalData
        .filter(item => new Date(item.date) >= cutoffDate)
        .map(item => ({
          date: item.date,
          tvl: item.tvl,
          dominance: item.dominance
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      console.log(`Fetched ${filteredData.length} historical TVL data points for ${coinId}`);
      return filteredData;

    } catch (error) {
      console.error(`Error fetching historical TVL from DB for ${coinId}:`, error);
      throw error;
    }
  }

  private calculateMA(data: TVLDataPoint[], period: number): TVLDataPointWithMA[] {
    return data.map((item, index) => {
      const start = Math.max(0, index - period + 1);
      const subset = data.slice(start, index + 1);
      const sum = subset.reduce((acc, curr) => acc + curr.tvl, 0);
      const ma = sum / subset.length;
      
      return {
        ...item,
        movingAverage: ma,
        maDeviation: ma > 0 ? ((item.tvl - ma) / ma) * 100 : 0 // Percentage deviation from MA
      };
    });
  }

  private calculateMetrics(maData: TVLDataPointWithMA[], originalData: TVLDataPoint[]): MAMetrics {
    if (maData.length === 0 || originalData.length === 0) {
      return {
        currentTVL: 0,
        currentMA: 0,
        maTrend: 'stable',
        volatility: 0,
        distanceFromMA: 0,
        signal: 'neutral'
      };
    }

    const currentTVL = originalData[originalData.length - 1]?.tvl || 0;
    const currentMA = maData[maData.length - 1]?.movingAverage || 0;
    const previousMA = maData.length > 1 ? maData[maData.length - 2]?.movingAverage || currentMA : currentMA;
    
    // Calculate trend direction
    const maTrend = currentMA > previousMA ? 'up' : currentMA < previousMA ? 'down' : 'stable';
    
    // Calculate volatility (standard deviation of deviations)
    const deviations = maData.map(item => Math.abs(item.maDeviation));
    const avgDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
    const volatility = avgDeviation;
    
    // Calculate distance from MA
    const distanceFromMA = currentMA > 0 ? ((currentTVL - currentMA) / currentMA) * 100 : 0;
    
    return {
      currentTVL,
      currentMA,
      maTrend,
      volatility,
      distanceFromMA,
      signal: this.generateSignal(distanceFromMA, maTrend, volatility)
    };
  }

  private generateSignal(distanceFromMA: number, trend: string, volatility: number): string {
    // Overbought/Oversold signals based on distance from MA
    if (Math.abs(distanceFromMA) > 15 && volatility > 8) {
      return distanceFromMA > 0 ? 'overbought' : 'oversold';
    }
    
    // Buy/Sell signals based on trend and distance
    if (trend === 'up' && distanceFromMA < -5) {
      return 'buy_signal';
    }
    
    if (trend === 'down' && distanceFromMA > 5) {
      return 'sell_signal';
    }
    
    return 'neutral';
  }

  // Additional utility methods for enhanced analysis

  async getTVLTrendAnalysis(coinId: string, period: number = 30): Promise<{
    trend: 'bullish' | 'bearish' | 'sideways';
    strength: number;
    momentum: number;
    support: number;
    resistance: number;
  }> {
    try {
      const maResult = await this.calculateMovingAverage(coinId, period);
      const data = maResult.data;
      
      if (data.length < 2) {
        return {
          trend: 'sideways',
          strength: 0,
          momentum: 0,
          support: 0,
          resistance: 0
        };
      }

      // Calculate trend based on price action and moving average
      const recentData = data.slice(-7); // Last 7 days
      const olderData = data.slice(-14, -7); // Previous 7 days
      
      const recentAvg = recentData.reduce((sum, item) => sum + item.tvl, 0) / recentData.length;
      const olderAvg = olderData.reduce((sum, item) => sum + item.tvl, 0) / olderData.length;
      
      const trend = recentAvg > olderAvg * 1.02 ? 'bullish' : 
                   recentAvg < olderAvg * 0.98 ? 'bearish' : 'sideways';
      
      // Calculate trend strength
      const strength = Math.abs((recentAvg - olderAvg) / olderAvg) * 100;
      
      // Calculate momentum (rate of change)
      const momentum = data.length > 1 ? 
        ((data[data.length - 1].tvl - data[data.length - 2].tvl) / data[data.length - 2].tvl) * 100 : 0;
      
      // Find support and resistance levels
      const tvls = data.map(item => item.tvl);
      const support = Math.min(...tvls) * 0.98; // 2% below recent low
      const resistance = Math.max(...tvls) * 1.02; // 2% above recent high
      
      return {
        trend,
        strength,
        momentum,
        support,
        resistance
      };
      
    } catch (error) {
      console.error(`Error calculating trend analysis for ${coinId}:`, error);
      return {
        trend: 'sideways',
        strength: 0,
        momentum: 0,
        support: 0,
        resistance: 0
      };
    }
  }

  // Clear cache for specific coin or all coins
  clearCache(coinId?: string): void {
    if (coinId) {
      // Clear cache for specific coin
      for (const key of this.cache.keys()) {
        if (key.startsWith(`ma-${coinId}-`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  // Get cache statistics
  getCacheStats(): {
    totalEntries: number;
    memoryUsage: number;
    oldestEntry: number | null;
  } {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();
    
    return {
      totalEntries: entries.length,
      memoryUsage: JSON.stringify(entries).length,
      oldestEntry: entries.length > 0 ? 
        Math.min(...entries.map(([_, entry]) => entry.timestamp)) : null
    };
  }
}