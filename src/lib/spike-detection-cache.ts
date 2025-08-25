// Type definitions for Spike Detection Cache
export interface SpikeDetectionResult {
  isSpike: boolean;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  message: string;
  threshold: number;
  currentValue: number;
  baseline: number;
  deviation: number;
}

interface CacheEntry {
  data: Record<string, SpikeDetectionResult>;
  timestamp: Date;
  ttl: number; // Time to live in milliseconds
}

/**
 * Simple in-memory cache for spike detection results
 * Optimizes performance by caching results and reducing redundant calculations
 */
export class SpikeDetectionCache {
  private static instance: SpikeDetectionCache;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): SpikeDetectionCache {
    if (!SpikeDetectionCache.instance) {
      SpikeDetectionCache.instance = new SpikeDetectionCache();
    }
    return SpikeDetectionCache.instance;
  }

  /**
   * Generate cache key for spike detection results
   */
  private generateCacheKey(
    blockchain: string,
    timeframe: string,
    metricType: 'usage' | 'tvl' | 'cashflow'
  ): string {
    return `${blockchain}:${timeframe}:${metricType}`;
  }

  /**
   * Get cached spike detection results
   */
  get(
    blockchain: string,
    timeframe: string,
    metricType: 'usage' | 'tvl' | 'cashflow'
  ): Record<string, SpikeDetectionResult> | null {
    const key = this.generateCacheKey(blockchain, timeframe, metricType);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry is expired
    const now = new Date();
    if (now.getTime() - entry.timestamp.getTime() > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Set spike detection results in cache
   */
  set(
    blockchain: string,
    timeframe: string,
    metricType: 'usage' | 'tvl' | 'cashflow',
    data: Record<string, SpikeDetectionResult>,
    ttl: number = this.DEFAULT_TTL
  ): void {
    const key = this.generateCacheKey(blockchain, timeframe, metricType);
    const entry: CacheEntry = {
      data,
      timestamp: new Date(),
      ttl
    };

    this.cache.set(key, entry);

    // Clean up expired entries periodically
    this.cleanup();
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear entries for a specific blockchain
   */
  clearForBlockchain(blockchain: string): void {
    for (const [key] of this.cache) {
      if (key.startsWith(`${blockchain}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    entriesByType: Record<string, number>;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const entries = Array.from(this.cache.values());
    const entriesByType: Record<string, number> = {};

    for (const [key] of this.cache) {
      const type = key.split(':')[2];
      entriesByType[type] = (entriesByType[type] || 0) + 1;
    }

    const timestamps = entries.map(entry => entry.timestamp);
    const oldestEntry = timestamps.length > 0 ? new Date(Math.min(...timestamps.map(t => t.getTime()))) : null;
    const newestEntry = timestamps.length > 0 ? new Date(Math.max(...timestamps.map(t => t.getTime()))) : null;

    return {
      totalEntries: this.cache.size,
      entriesByType,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = new Date();
    for (const [key, entry] of this.cache) {
      if (now.getTime() - entry.timestamp.getTime() > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Pre-warm cache for commonly accessed blockchains
   */
  async prewarmCache(blockchains: string[], timeframes: string[]): Promise<void> {
    for (const blockchain of blockchains) {
      for (const timeframe of timeframes) {
        // Generate placeholder cache entries to prevent cold starts
        const placeholderData: Record<string, SpikeDetectionResult> = {
          placeholder: {
            isSpike: false,
            severity: 'low',
            confidence: 0,
            message: 'Cache prewarm placeholder',
            threshold: 0,
            currentValue: 0,
            baseline: 0,
            deviation: 0
          }
        };

        this.set(blockchain, timeframe, 'usage', placeholderData, 60 * 1000); // 1 minute TTL
        this.set(blockchain, timeframe, 'tvl', placeholderData, 60 * 1000);
        this.set(blockchain, timeframe, 'cashflow', placeholderData, 60 * 1000);
      }
    }
    
    console.log('Spike detection cache prewarmed successfully');
  }
}

/**
 * Decorator function to add caching to spike detection methods
 */
export function withSpikeDetectionCache(
  target: any,
  propertyName: string,
  descriptor: TypedPropertyDescriptor<any>
) {
  const method = descriptor.value!;
  const cache = SpikeDetectionCache.getInstance();

  descriptor.value = async function(...args: any[]) {
    const [blockchain, timeframe, metricType] = args;
    
    // Try to get from cache first
    const cached = cache.get(blockchain, timeframe, metricType);
    if (cached) {
      return cached;
    }

    // Execute original method
    const result = await method.apply(this, args);
    
    // Cache the result
    if (result && typeof result === 'object') {
      cache.set(blockchain, timeframe, metricType, result);
    }

    return result;
  };
}

export default SpikeDetectionCache;