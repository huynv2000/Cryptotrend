// Multi-Layer Caching System for Trend Analysis

import type { TrendAnalysis } from '@/lib/trend-calculator';
import type { HistoricalDataPoint } from '@/lib/types';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  accessCount: number;
  lastAccessed: number;
}

export interface CacheConfig {
  memory: {
    maxSize: number; // Maximum number of entries
    defaultTTL: number; // Default TTL in milliseconds
    cleanupInterval: number; // Cleanup interval in milliseconds
  };
  redis?: {
    url: string;
    defaultTTL: number;
    keyPrefix: string;
  };
  compression: {
    enabled: boolean;
    threshold: number; // Size threshold for compression
  };
}

export interface CacheStats {
  memory: {
    hits: number;
    misses: number;
    size: number;
    evictions: number;
  };
  redis?: {
    hits: number;
    misses: number;
    errors: number;
  };
  compression: {
    ratio: number;
    enabled: boolean;
  };
}

export class TrendCache {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private redis?: any; // Redis client (optional)
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      memory: {
        maxSize: 1000,
        defaultTTL: 5 * 60 * 1000, // 5 minutes
        cleanupInterval: 60 * 1000 // 1 minute
      },
      redis: process.env.REDIS_URL ? {
        url: process.env.REDIS_URL,
        defaultTTL: 10 * 60 * 1000, // 10 minutes
        keyPrefix: 'trend:'
      } : undefined,
      compression: {
        enabled: true,
        threshold: 1024 // 1KB
      },
      ...config
    };

    this.stats = {
      memory: {
        hits: 0,
        misses: 0,
        size: 0,
        evictions: 0
      },
      redis: this.config.redis ? {
        hits: 0,
        misses: 0,
        errors: 0
      } : undefined,
      compression: {
        ratio: 1,
        enabled: this.config.compression.enabled
      }
    };

    this.initializeRedis();
    this.startCleanupTimer();
  }

  private async initializeRedis(): Promise<void> {
    if (!this.config.redis) return;

    try {
      // Dynamic import to avoid Redis dependency if not available
      const Redis = await import('redis').then(mod => mod.createClient);
      this.redis = Redis({ url: this.config.redis!.url });
      
      this.redis.on('error', (err: Error) => {
        console.warn('Redis connection error:', err.message);
        this.stats.redis!.errors++;
      });

      await this.redis.connect();
    } catch (error) {
      console.warn('Failed to initialize Redis:', error);
      this.config.redis = undefined;
      this.stats.redis = undefined;
    }
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.config.memory.cleanupInterval);
  }

  // Get trend analysis from cache
  async getTrendAnalysis(
    metric: string,
    timeframe: string,
    blockchain: string
  ): Promise<TrendAnalysis | null> {
    const cacheKey = this.generateKey(metric, timeframe, blockchain);

    // Try memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.updateAccessStats(memoryEntry);
      this.stats.memory.hits++;
      return memoryEntry.data;
    }

    // Try Redis cache if available
    if (this.redis && this.config.redis) {
      try {
        const redisData = await this.redis.get(this.config.redis.keyPrefix + cacheKey);
        if (redisData) {
          const parsed = this.parseRedisData(redisData);
          
          // Store in memory cache
          this.memoryCache.set(cacheKey, {
            data: parsed,
            timestamp: Date.now(),
            ttl: this.config.memory.defaultTTL,
            accessCount: 1,
            lastAccessed: Date.now()
          });
          
          this.stats.redis!.hits++;
          this.ensureMemoryLimit();
          return parsed;
        } else {
          this.stats.redis!.misses++;
        }
      } catch (error) {
        this.stats.redis!.errors++;
        console.warn('Redis get error:', error);
      }
    }

    this.stats.memory.misses++;
    return null;
  }

  // Set trend analysis in cache
  async setTrendAnalysis(
    metric: string,
    timeframe: string,
    blockchain: string,
    analysis: TrendAnalysis
  ): Promise<void> {
    const cacheKey = this.generateKey(metric, timeframe, blockchain);
    const ttl = this.calculateTTL(timeframe);

    // Store in memory cache
    const memoryEntry: CacheEntry<TrendAnalysis> = {
      data: analysis,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.memoryCache.set(cacheKey, memoryEntry);
    this.ensureMemoryLimit();

    // Store in Redis cache if available
    if (this.redis && this.config.redis) {
      try {
        const redisData = this.serializeForRedis(analysis);
        await this.redis.setEx(
          this.config.redis.keyPrefix + cacheKey,
          Math.floor(ttl / 1000), // Convert to seconds
          redisData
        );
      } catch (error) {
        this.stats.redis!.errors++;
        console.warn('Redis set error:', error);
      }
    }
  }

  // Delete trend analysis from cache
  async deleteTrendAnalysis(
    metric: string,
    timeframe: string,
    blockchain: string
  ): Promise<void> {
    const cacheKey = this.generateKey(metric, timeframe, blockchain);

    // Remove from memory cache
    this.memoryCache.delete(cacheKey);

    // Remove from Redis cache if available
    if (this.redis && this.config.redis) {
      try {
        await this.redis.del(this.config.redis.keyPrefix + cacheKey);
      } catch (error) {
        this.stats.redis!.errors++;
        console.warn('Redis delete error:', error);
      }
    }
  }

  // Clear all cache entries
  async clear(): Promise<void> {
    // Clear memory cache
    this.memoryCache.clear();
    this.stats.memory.size = 0;

    // Clear Redis cache if available
    if (this.redis && this.config.redis) {
      try {
        const keys = await this.redis.keys(this.config.redis.keyPrefix + '*');
        if (keys.length > 0) {
          await this.redis.del(keys);
        }
      } catch (error) {
        this.stats.redis!.errors++;
        console.warn('Redis clear error:', error);
      }
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Get memory cache entries for debugging
  getMemoryCacheEntries(): Array<{ key: string; entry: CacheEntry<any> }> {
    return Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
      key,
      entry
    }));
  }

  private generateKey(metric: string, timeframe: string, blockchain: string): string {
    return `${blockchain}:${metric}:${timeframe}`;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private updateAccessStats(entry: CacheEntry<any>): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  private calculateTTL(timeframe: string): number {
    switch (timeframe) {
      case '7d': return 5 * 60 * 1000; // 5 minutes
      case '30d': return 15 * 60 * 1000; // 15 minutes
      case '90d': return 30 * 60 * 1000; // 30 minutes
      default: return this.config.memory.defaultTTL;
    }
  }

  private ensureMemoryLimit(): void {
    if (this.memoryCache.size <= this.config.memory.maxSize) {
      this.stats.memory.size = this.memoryCache.size;
      return;
    }

    // LRU eviction policy
    const entries = Array.from(this.memoryCache.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    const toRemove = entries.length - this.config.memory.maxSize;
    for (let i = 0; i < toRemove; i++) {
      this.memoryCache.delete(entries[i][0]);
      this.stats.memory.evictions++;
    }

    this.stats.memory.size = this.memoryCache.size;
  }

  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        this.memoryCache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.stats.memory.size = this.memoryCache.size;
    }
  }

  private serializeForRedis(data: any): string {
    let serialized = JSON.stringify(data);
    
    if (this.config.compression.enabled && serialized.length > this.config.compression.threshold) {
      // Simple compression for large data
      serialized = this.compress(serialized);
    }

    return serialized;
  }

  private parseRedisData(data: string): any {
    let parsed = data;
    
    if (this.config.compression.enabled && this.isCompressed(data)) {
      parsed = this.decompress(data);
    }

    try {
      return JSON.parse(parsed);
    } catch (error) {
      console.warn('Failed to parse Redis data:', error);
      return null;
    }
  }

  private compress(data: string): string {
    // Simple compression (in real implementation, use a proper compression library)
    return Buffer.from(data).toString('base64');
  }

  private decompress(data: string): string {
    // Simple decompression
    return Buffer.from(data, 'base64').toString();
  }

  private isCompressed(data: string): boolean {
    try {
      Buffer.from(data, 'base64').toString();
      return true;
    } catch {
      return false;
    }
  }

  // Update compression ratio stats
  private updateCompressionStats(original: string, compressed: string): void {
    if (this.stats.compression.enabled) {
      const ratio = original.length / compressed.length;
      this.stats.compression.ratio = (this.stats.compression.ratio + ratio) / 2; // Moving average
    }
  }

  // Stop cleanup timer and close connections
  async destroy(): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    if (this.redis) {
      try {
        await this.redis.quit();
      } catch (error) {
        console.warn('Error closing Redis connection:', error);
      }
    }
  }
}

// Extended cache for historical data
export class HistoricalDataCache extends TrendCache {
  constructor(config?: Partial<CacheConfig>) {
    super({
      ...config,
      memory: {
        maxSize: 500, // Smaller cache for historical data
        defaultTTL: 10 * 60 * 1000, // 10 minutes
        cleanupInterval: 2 * 60 * 1000 // 2 minutes
      },
      ...config
    });
  }

  async getHistoricalData(
    blockchain: string,
    metric: string,
    timeframe: string
  ): Promise<HistoricalDataPoint[] | null> {
    return this.get(`${blockchain}:${metric}:${timeframe}:historical`);
  }

  async setHistoricalData(
    blockchain: string,
    metric: string,
    timeframe: string,
    data: HistoricalDataPoint[]
  ): Promise<void> {
    await this.set(`${blockchain}:${metric}:${timeframe}:historical`, data);
  }

  private async get(key: string): Promise<any> {
    const cacheKey = key;

    // Try memory cache first
    const memoryEntry = this.memoryCache.get(cacheKey);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.updateAccessStats(memoryEntry);
      this.stats.memory.hits++;
      return memoryEntry.data;
    }

    // Try Redis cache if available
    if (this.redis && this.config.redis) {
      try {
        const redisData = await this.redis.get(this.config.redis.keyPrefix + cacheKey);
        if (redisData) {
          const parsed = this.parseRedisData(redisData);
          
          // Store in memory cache
          this.memoryCache.set(cacheKey, {
            data: parsed,
            timestamp: Date.now(),
            ttl: this.config.memory.defaultTTL,
            accessCount: 1,
            lastAccessed: Date.now()
          });
          
          this.stats.redis!.hits++;
          this.ensureMemoryLimit();
          return parsed;
        } else {
          this.stats.redis!.misses++;
        }
      } catch (error) {
        this.stats.redis!.errors++;
        console.warn('Redis get error:', error);
      }
    }

    this.stats.memory.misses++;
    return null;
  }

  private async set(key: string, data: any): Promise<void> {
    const cacheKey = key;
    const ttl = this.config.memory.defaultTTL;

    // Store in memory cache
    const memoryEntry: CacheEntry<any> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 1,
      lastAccessed: Date.now()
    };

    this.memoryCache.set(cacheKey, memoryEntry);
    this.ensureMemoryLimit();

    // Store in Redis cache if available
    if (this.redis && this.config.redis) {
      try {
        const redisData = this.serializeForRedis(data);
        await this.redis.setEx(
          this.config.redis.keyPrefix + cacheKey,
          Math.floor(ttl / 1000),
          redisData
        );
      } catch (error) {
        this.stats.redis!.errors++;
        console.warn('Redis set error:', error);
      }
    }
  }
}

// Singleton instances
export const trendCache = new TrendCache();
export const historicalDataCache = new HistoricalDataCache();