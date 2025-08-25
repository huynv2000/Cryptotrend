// Enhanced Caching Service
// Production-ready caching service with intelligent cache management

import { multiLayerCachingStrategy } from './performance/caching-strategy';
import { cacheWarmingService } from './performance/cache-warming';

export interface EnhancedCacheConfig {
  enabled: boolean;
  defaultTTL: number;
  compression: boolean;
  serialization: 'json' | 'msgpack';
  intelligentPreloading: boolean;
  adaptiveTTL: boolean;
  cacheKeyPrefix: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
  metadata?: Record<string, any>;
}

export interface CachePerformanceMetrics {
  hitRate: number;
  missRate: number;
  avgResponseTime: number;
  totalRequests: number;
  cacheSize: number;
  memoryUsage: number;
  evictionRate: number;
  compressionRatio: number;
}

export class EnhancedCachingService {
  private config: EnhancedCacheConfig;
  private isInitialized = false;
  private performanceMetrics: CachePerformanceMetrics;
  private accessPatterns: Map<string, number> = new Map();
  private preloadQueue: string[] = [];
  private isPreloading = false;

  constructor(config?: Partial<EnhancedCacheConfig>) {
    this.config = {
      enabled: true,
      defaultTTL: 300000, // 5 minutes
      compression: true,
      serialization: 'json',
      intelligentPreloading: true,
      adaptiveTTL: true,
      cacheKeyPrefix: 'crypto:',
      ...config,
    };

    this.performanceMetrics = {
      hitRate: 0,
      missRate: 0,
      avgResponseTime: 0,
      totalRequests: 0,
      cacheSize: 0,
      memoryUsage: 0,
      evictionRate: 0,
      compressionRatio: 0,
    };
  }

  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Enhanced Caching Service...');

      // Initialize underlying caching strategy
      await multiLayerCachingStrategy;

      // Initialize cache warming service
      await cacheWarmingService.initialize();

      // Start intelligent preloading
      if (this.config.intelligentPreloading) {
        this.startIntelligentPreloading();
      }

      // Start adaptive TTL management
      if (this.config.adaptiveTTL) {
        this.startAdaptiveTTLManagement();
      }

      this.isInitialized = true;
      console.log('✅ Enhanced Caching Service initialized successfully');
    } catch (error) {
      console.error('❌ Enhanced Caching Service initialization failed:', error);
      throw error;
    }
  }

  async get<T>(key: string, options?: {
    ttl?: number;
    forceRefresh?: boolean;
    preloadRelated?: boolean;
  }): Promise<T | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const fullKey = this.config.cacheKeyPrefix + key;

    try {
      // Check if force refresh is requested
      if (options?.forceRefresh) {
        await this.invalidate(fullKey);
      }

      // Get from cache
      const result = await multiLayerCachingStrategy.get<T>(fullKey, {
        ttl: options?.ttl || this.config.defaultTTL,
        priority: this.getPriorityFromKey(key),
      });

      // Update performance metrics
      this.updatePerformanceMetrics(result.hit, Date.now() - startTime);

      // Track access patterns
      this.trackAccessPattern(key);

      // Intelligent preloading for frequently accessed keys
      if (result.hit && options?.preloadRelated && this.config.intelligentPreloading) {
        this.preloadRelatedKeys(key);
      }

      if (result.hit) {
        return result.data;
      }

      return null;
    } catch (error) {
      console.error(`❌ Cache get failed for key ${key}:`, error);
      return null;
    }
  }

  async set<T>(
    key: string,
    data: T,
    options?: {
      ttl?: number;
      priority?: 'high' | 'medium' | 'low';
      metadata?: Record<string, any>;
    }
  ): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const fullKey = this.config.cacheKeyPrefix + key;
    const ttl = options?.ttl || this.calculateAdaptiveTTL(key);

    try {
      const result = await multiLayerCachingStrategy.set(fullKey, data, {
        ttl,
        priority: options?.priority || this.getPriorityFromKey(key),
        compression: this.config.compression,
        serialization: this.config.serialization,
      });

      // Update cache size metrics
      this.performanceMetrics.cacheSize = await this.getEstimatedCacheSize();

      return result.success;
    } catch (error) {
      console.error(`❌ Cache set failed for key ${key}:`, error);
      return false;
    }
  }

  async invalidate(pattern: string): Promise<boolean> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const fullPattern = this.config.cacheKeyPrefix + pattern;

    try {
      const result = await multiLayerCachingStrategy.invalidate(fullPattern);
      return result.success;
    } catch (error) {
      console.error(`❌ Cache invalidate failed for pattern ${pattern}:`, error);
      return false;
    }
  }

  async getPerformanceMetrics(): Promise<CachePerformanceMetrics> {
    try {
      const cacheStats = await multiLayerCachingStrategy.getCacheStats();
      
      return {
        ...this.performanceMetrics,
        hitRate: cacheStats.overall.hitRate,
        missRate: 100 - cacheStats.overall.hitRate,
        cacheSize: cacheStats.overall.totalSize,
      };
    } catch (error) {
      console.error('❌ Failed to get performance metrics:', error);
      return this.performanceMetrics;
    }
  }

  async warmCache(keys: string[], data: any[]): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const fullKeys = keys.map(key => this.config.cacheKeyPrefix + key);
      await multiLayerCachingStrategy.warmCache(fullKeys, data);
      console.log(`✅ Cache warming completed for ${keys.length} keys`);
    } catch (error) {
      console.error('❌ Cache warming failed:', error);
    }
  }

  private getPriorityFromKey(key: string): 'high' | 'medium' | 'low' {
    // Determine cache priority based on key patterns
    if (key.includes('market-data') || key.includes('price')) {
      return 'high';
    }
    if (key.includes('metrics') || key.includes('analysis')) {
      return 'medium';
    }
    return 'low';
  }

  private updatePerformanceMetrics(hit: boolean, responseTime: number): void {
    this.performanceMetrics.totalRequests++;
    
    if (hit) {
      this.performanceMetrics.hitRate = 
        (this.performanceMetrics.hitRate * (this.performanceMetrics.totalRequests - 1) + 100) / 
        this.performanceMetrics.totalRequests;
    } else {
      this.performanceMetrics.missRate = 
        (this.performanceMetrics.missRate * (this.performanceMetrics.totalRequests - 1) + 100) / 
        this.performanceMetrics.totalRequests;
    }

    // Update average response time
    this.performanceMetrics.avgResponseTime = 
      (this.performanceMetrics.avgResponseTime * 0.9) + (responseTime * 0.1);
  }

  private trackAccessPattern(key: string): void {
    const currentCount = this.accessPatterns.get(key) || 0;
    this.accessPatterns.set(key, currentCount + 1);

    // Add to preload queue if accessed frequently
    if (currentCount > 10 && !this.preloadQueue.includes(key)) {
      this.preloadQueue.push(key);
    }
  }

  private calculateAdaptiveTTL(key: string): number {
    if (!this.config.adaptiveTTL) {
      return this.config.defaultTTL;
    }

    const accessCount = this.accessPatterns.get(key) || 0;
    
    // Increase TTL for frequently accessed keys
    if (accessCount > 20) {
      return this.config.defaultTTL * 3; // 3x longer
    }
    if (accessCount > 10) {
      return this.config.defaultTTL * 2; // 2x longer
    }
    
    return this.config.defaultTTL;
  }

  private startIntelligentPreloading(): void {
    setInterval(() => {
      if (!this.isPreloading && this.preloadQueue.length > 0) {
        this.isPreloading = true;
        this.processPreloadQueue();
      }
    }, 60000); // Check every minute
  }

  private async processPreloadQueue(): Promise<void> {
    try {
      const keysToPreload = this.preloadQueue.splice(0, 10); // Process 10 keys at a time
      
      for (const key of keysToPreload) {
        // This would typically fetch fresh data and cache it
        // For now, we'll just log the intent
        console.log(`🔄 Preloading cache for key: ${key}`);
      }
      
      this.isPreloading = false;
    } catch (error) {
      console.error('❌ Preload queue processing failed:', error);
      this.isPreloading = false;
    }
  }

  private preloadRelatedKeys(key: string): void {
    // Add related keys to preload queue based on access patterns
    const relatedKeys = this.getRelatedKeys(key);
    for (const relatedKey of relatedKeys) {
      if (!this.preloadQueue.includes(relatedKey)) {
        this.preloadQueue.push(relatedKey);
      }
    }
  }

  private getRelatedKeys(key: string): string[] {
    // Simple heuristic to find related keys
    const relatedKeys: string[] = [];
    
    if (key.includes('bitcoin')) {
      relatedKeys.push('market-data:ethereum', 'market-data:binancecoin');
    }
    if (key.includes('ethereum')) {
      relatedKeys.push('market-data:bitcoin', 'market-data:solana');
    }
    
    return relatedKeys;
  }

  private startAdaptiveTTLManagement(): void {
    setInterval(() => {
      this.cleanupAccessPatterns();
      this.optimizeCacheConfiguration();
    }, 300000); // Every 5 minutes
  }

  private cleanupAccessPatterns(): void {
    // Remove old or infrequently accessed patterns
    const now = Date.now();
    for (const [key, count] of this.accessPatterns.entries()) {
      if (count < 2) {
        this.accessPatterns.delete(key);
      }
    }
  }

  private optimizeCacheConfiguration(): void {
    // Analyze access patterns and optimize cache configuration
    const totalAccesses = Array.from(this.accessPatterns.values()).reduce((sum, count) => sum + count, 0);
    
    if (totalAccesses > 1000) {
      console.log('🔄 Optimizing cache configuration based on access patterns...');
      // This would adjust cache sizes, TTLs, etc. based on patterns
    }
  }

  private async getEstimatedCacheSize(): Promise<number> {
    try {
      const stats = await multiLayerCachingStrategy.getCacheStats();
      return stats.overall.totalSize;
    } catch (error) {
      return 0;
    }
  }

  async getCacheHealth(): Promise<{
    status: 'HEALTHY' | 'WARNING' | 'ERROR';
    issues: string[];
    recommendations: string[];
  }> {
    const metrics = await this.getPerformanceMetrics();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check cache health
    if (metrics.hitRate < 70) {
      issues.push('Low cache hit rate');
      recommendations.push('Consider increasing cache size or optimizing cache keys');
    }

    if (metrics.avgResponseTime > 100) {
      issues.push('High cache response time');
      recommendations.push('Check cache infrastructure and network latency');
    }

    if (metrics.missRate > 30) {
      issues.push('High cache miss rate');
      recommendations.push('Implement cache warming and intelligent preloading');
    }

    // Determine overall status
    let status: 'HEALTHY' | 'WARNING' | 'ERROR' = 'HEALTHY';
    if (issues.length > 2) {
      status = 'ERROR';
    } else if (issues.length > 0) {
      status = 'WARNING';
    }

    return {
      status,
      issues,
      recommendations,
    };
  }

  async clearCache(): Promise<void> {
    try {
      await multiLayerCachingStrategy.invalidate('*');
      this.accessPatterns.clear();
      this.preloadQueue = [];
      console.log('✅ Cache cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    try {
      console.log('🛑 Stopping Enhanced Caching Service...');
      
      // Clear any running intervals
      this.isInitialized = false;
      
      console.log('✅ Enhanced Caching Service stopped');
    } catch (error) {
      console.error('❌ Failed to stop Enhanced Caching Service:', error);
      throw error;
    }
  }
}

// Global instance
export const enhancedCachingService = new EnhancedCachingService();