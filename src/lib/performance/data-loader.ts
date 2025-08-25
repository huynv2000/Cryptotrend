// Optimized Data Loading Performance System

import type { HistoricalDataPoint } from '@/lib/types';
import type { HistoricalDataRequest } from '@/lib/data-sources/historical-data';
import { historicalDataIntegration } from '@/lib/data-sources/historical-data';
import { dataTransformer } from '@/lib/data-pipeline/transformer';
import { dataValidator } from '@/lib/data-validation/validator';
import { historicalDataCache } from '@/lib/cache/trend-cache';
import { dataErrorHandler } from '@/lib/error-handling/data-error-handler';

export interface PerformanceMetrics {
  requestCount: number;
  successRate: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  memoryUsage: number;
  throughput: number; // requests per second
}

export interface LoadOptions {
  useCache: boolean;
  validateData: boolean;
  transformData: boolean;
  retryOnFailure: boolean;
  timeout: number;
  priority: 'low' | 'medium' | 'high';
}

export interface LoadResult {
  success: boolean;
  data?: HistoricalDataPoint[];
  error?: string;
  metrics: {
    loadTime: number;
    cacheHit: boolean;
    source: string;
    validationScore?: number;
    transformationTime?: number;
  };
}

export class OptimizedDataLoader {
  private requestQueue: RequestQueue;
  private performanceMonitor: PerformanceMonitor;
  private loadBalancer: LoadBalancer;
  private activeRequests: Map<string, Promise<LoadResult>> = new Map();

  constructor() {
    this.requestQueue = new RequestQueue({
      maxConcurrent: 10,
      maxQueueSize: 100,
      timeout: 30000
    });
    
    this.performanceMonitor = new PerformanceMonitor();
    this.loadBalancer = new LoadBalancer();
  }

  async loadHistoricalData(
    requests: HistoricalDataRequest[],
    options: Partial<LoadOptions> = {}
  ): Promise<LoadResult[]> {
    const loadOptions: LoadOptions = {
      useCache: true,
      validateData: true,
      transformData: true,
      retryOnFailure: true,
      timeout: 30000,
      priority: 'medium',
      ...options
    };

    const startTime = Date.now();
    const perfId = this.performanceMonitor.start('batch-data-load');

    try {
      // Group similar requests for batching
      const batchedRequests = this.groupRequestsForBatching(requests);
      
      // Process batches with load balancing
      const results = await this.processBatches(batchedRequests, loadOptions);
      
      // Cache successful results
      await this.cacheSuccessfulResults(results, loadOptions);
      
      // End performance monitoring
      this.performanceMonitor.end(perfId, {
        requestCount: requests.length,
        batchSize: batchedRequests.length,
        successRate: results.filter(r => r.success).length / results.length,
        loadTime: Date.now() - startTime
      });

      return results;
    } catch (error) {
      this.performanceMonitor.end(perfId, { error: error.message });
      throw error;
    }
  }

  async loadSingleHistoricalData(
    request: HistoricalDataRequest,
    options: Partial<LoadOptions> = {}
  ): Promise<LoadResult> {
    const loadOptions: LoadOptions = {
      useCache: true,
      validateData: true,
      transformData: true,
      retryOnFailure: true,
      timeout: 30000,
      priority: 'medium',
      ...options
    };

    const requestKey = this.generateRequestKey(request);
    
    // Check for duplicate active requests
    if (this.activeRequests.has(requestKey)) {
      return this.activeRequests.get(requestKey)!;
    }

    const requestPromise = this.executeSingleRequest(request, loadOptions);
    this.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.activeRequests.delete(requestKey);
    }
  }

  private async executeSingleRequest(
    request: HistoricalDataRequest,
    options: LoadOptions
  ): Promise<LoadResult> {
    const startTime = Date.now();
    const metrics: LoadResult['metrics'] = {
      loadTime: 0,
      cacheHit: false,
      source: 'unknown'
    };

    try {
      // Step 1: Check cache if enabled
      if (options.useCache) {
        const cachedResult = await this.checkCache(request);
        if (cachedResult) {
          metrics.cacheHit = true;
          metrics.source = 'cache';
          metrics.loadTime = Date.now() - startTime;
          
          return {
            success: true,
            data: cachedResult,
            metrics
          };
        }
      }

      // Step 2: Load from data source
      const sourceResult = await this.loadFromDataSource(request, options);
      metrics.source = sourceResult.source;
      metrics.loadTime = Date.now() - startTime;

      if (!sourceResult.success) {
        return {
          success: false,
          error: sourceResult.error,
          metrics
        };
      }

      let data = sourceResult.data!;

      // Step 3: Transform data if enabled
      if (options.transformData && data) {
        const transformStart = Date.now();
        const transformResult = await dataTransformer.transformData(data, request);
        metrics.transformationTime = Date.now() - transformStart;
        
        if (transformResult.success) {
          data = transformResult.data;
        } else {
          // Use original data if transformation fails
          console.warn('Data transformation failed:', transformResult.errors);
        }
      }

      // Step 4: Validate data if enabled
      if (options.validateData && data) {
        const validation = dataValidator.validateData(data, request.metric);
        metrics.validationScore = validation.score;
        
        if (!validation.isValid) {
          console.warn('Data validation failed:', validation.errors);
        }
      }

      return {
        success: true,
        data,
        metrics
      };

    } catch (error) {
      metrics.loadTime = Date.now() - startTime;
      
      // Handle error with error handler
      const errorResult = await dataErrorHandler.handleDataError(
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'load_historical_data',
          blockchain: request.blockchain,
          metric: request.metric,
          timeframe: request.timeframe,
          timestamp: new Date()
        },
        () => this.loadFromDataSource(request, options)
      );

      if (errorResult.success) {
        return {
          success: true,
          data: errorResult.data?.data || [],
          metrics: {
            ...metrics,
            source: 'fallback',
            cacheHit: false,
            loadTime: Date.now() - startTime
          }
        };
      }

      return {
        success: false,
        error: errorResult.error?.userMessage || error.message,
        metrics
      };
    }
  }

  private async checkCache(request: HistoricalDataRequest): Promise<HistoricalDataPoint[] | null> {
    try {
      return await historicalDataCache.getHistoricalData(
        request.blockchain,
        request.metric,
        request.timeframe
      );
    } catch (error) {
      console.warn('Cache check failed:', error);
      return null;
    }
  }

  private async loadFromDataSource(
    request: HistoricalDataRequest,
    options: LoadOptions
  ): Promise<{ success: boolean; data?: HistoricalDataPoint[]; error?: string; source: string }> {
    try {
      // Use load balancer to select optimal data source
      const dataSource = await this.loadBalancer.selectDataSource(request);
      
      const response = await historicalDataIntegration.getHistoricalData(request);
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data,
          source: response.source
        };
      } else {
        return {
          success: false,
          error: response.error || 'Unknown error',
          source: 'error'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        source: 'exception'
      };
    }
  }

  private async cacheSuccessfulResults(
    results: LoadResult[],
    options: LoadOptions
  ): Promise<void> {
    if (!options.useCache) return;

    const cachePromises = results
      .filter(result => result.success && result.data)
      .map(async (result) => {
        try {
          // Extract request info from result (this would need to be passed differently in real implementation)
          // For now, we'll skip caching in batch mode
        } catch (error) {
          console.warn('Failed to cache result:', error);
        }
      });

    await Promise.allSettled(cachePromises);
  }

  private groupRequestsForBatching(requests: HistoricalDataRequest[]): HistoricalDataRequest[][] {
    const groups = new Map<string, HistoricalDataRequest[]>();

    requests.forEach(request => {
      const key = `${request.blockchain}:${request.metric}:${request.timeframe}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key)!.push(request);
    });

    return Array.from(groups.values());
  }

  private async processBatches(
    batches: HistoricalDataRequest[][],
    options: LoadOptions
  ): Promise<LoadResult[]> {
    const allResults: LoadResult[] = [];
    
    // Process batches with concurrency control
    const batchSize = 3; // Process 3 batches concurrently
    const batchPromises: Promise<LoadResult[]>[] = [];

    for (let i = 0; i < batches.length; i += batchSize) {
      const batchGroup = batches.slice(i, i + batchSize);
      
      const promise = Promise.all(
        batchGroup.map(batch => this.processBatch(batch, options))
      );
      
      batchPromises.push(promise);
    }

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(results => allResults.push(...results));

    return allResults;
  }

  private async processBatch(
    batch: HistoricalDataRequest[],
    options: LoadOptions
  ): Promise<LoadResult[]> {
    // For now, process each request in batch individually
    // In a real implementation, this would make a single batch API call
    return Promise.all(
      batch.map(request => this.executeSingleRequest(request, options))
    );
  }

  private generateRequestKey(request: HistoricalDataRequest): string {
    return `${request.blockchain}:${request.metric}:${request.timeframe}:${request.startTime?.toISOString() || 'now'}:${request.endTime?.toISOString() || 'now'}`;
  }

  // Get performance metrics
  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  // Get current queue status
  getQueueStatus(): any {
    return {
      queueSize: this.requestQueue.size,
      activeRequests: this.activeRequests.size,
      loadBalancerStatus: this.loadBalancer.getStatus()
    };
  }

  // Clear all caches and reset state
  async reset(): Promise<void> {
    this.activeRequests.clear();
    this.requestQueue.clear();
    await historicalDataCache.clear();
    this.performanceMonitor.reset();
  }
}

// Supporting classes
class RequestQueue {
  private queue: Array<{ request: any; resolve: (value: any) => void; reject: (reason?: any) => void }> = [];
  private active: Set<Promise<any>> = new Set();
  private config: { maxConcurrent: number; maxQueueSize: number; timeout: number };

  constructor(config: { maxConcurrent: number; maxQueueSize: number; timeout: number }) {
    this.config = config;
  }

  async add<T>(request: T, executor: (request: T) => Promise<any>): Promise<any> {
    return new Promise((resolve: (value: any) => void, reject: (reason?: any) => void) => {
      if (this.queue.length >= this.config.maxQueueSize) {
        reject(new Error('Request queue is full'));
        return;
      }

      this.queue.push({ request, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    while (this.active.size < this.config.maxConcurrent && this.queue.length > 0) {
      const { request, resolve, reject } = this.queue.shift()!;
      
      const promise = this.executeRequest(request, resolve, reject);
      this.active.add(promise);
      
      promise.finally(() => {
        this.active.delete(promise);
        this.processQueue();
      });
    }
  }

  private async executeRequest<T>(request: T, resolve: (value: any) => void, reject: (reason?: any) => void): Promise<void> {
    try {
      // This would call the actual executor function
      // For now, we'll simulate it
      const result = await this.simulateExecution(request);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }

  private async simulateExecution(request: any): Promise<any> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 100));
    return { success: true, data: request };
  }

  get size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
    this.active.clear();
  }
}

class PerformanceMonitor {
  private metrics: Map<string, any> = new Map();
  private performanceData: Array<{
    operation: string;
    startTime: number;
    endTime?: number;
    metadata?: any;
  }> = [];

  start(operation: string): string {
    const id = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.performanceData.push({
      operation,
      startTime: Date.now(),
      id
    });

    return id;
  }

  end(id: string, metadata?: any): void {
    const index = this.performanceData.findIndex(p => p.id === id);
    if (index !== -1) {
      this.performanceData[index].endTime = Date.now();
      this.performanceData[index].metadata = metadata;
    }
  }

  getMetrics(): PerformanceMetrics {
    const completed = this.performanceData.filter(p => p.endTime);
    const recent = completed.filter(p => p.startTime! > Date.now() - 5 * 60 * 1000); // Last 5 minutes

    if (recent.length === 0) {
      return {
        requestCount: 0,
        successRate: 0,
        averageResponseTime: 0,
        cacheHitRate: 0,
        errorRate: 0,
        memoryUsage: 0,
        throughput: 0
      };
    }

    const totalTime = recent.reduce((sum, p) => sum + (p.endTime! - p.startTime!), 0);
    const successCount = recent.filter(p => p.metadata?.successRate !== false).length;
    const cacheHits = recent.filter(p => p.metadata?.cacheHit).length;

    return {
      requestCount: recent.length,
      successRate: successCount / recent.length,
      averageResponseTime: totalTime / recent.length,
      cacheHitRate: cacheHits / recent.length,
      errorRate: (recent.length - successCount) / recent.length,
      memoryUsage: process.memoryUsage?.().heapUsed || 0,
      throughput: recent.length / (5 * 60) // requests per second over 5 minutes
    };
  }

  reset(): void {
    this.performanceData = [];
    this.metrics.clear();
  }
}

class LoadBalancer {
  private sourceHealth: Map<string, { healthy: boolean; latency: number; lastCheck: number }> = new Map();

  async selectDataSource(request: HistoricalDataRequest): Promise<string> {
    // Simple load balancing - in real implementation, this would be more sophisticated
    const sources = ['glassnode', 'coinmetrics', 'defillama'];
    
    // Select healthiest source
    const healthySources = sources.filter(source => {
      const health = this.sourceHealth.get(source);
      return !health || (health.healthy && Date.now() - health.lastCheck < 5 * 60 * 1000);
    });

    if (healthySources.length === 0) {
      return sources[0]; // Fallback to first source
    }

    // Select source with lowest latency
    return healthySources.reduce((best, current) => {
      const bestHealth = this.sourceHealth.get(best)!;
      const currentHealth = this.sourceHealth.get(current)!;
      return currentHealth.latency < bestHealth.latency ? current : best;
    });
  }

  updateSourceHealth(source: string, healthy: boolean, latency: number): void {
    this.sourceHealth.set(source, {
      healthy,
      latency,
      lastCheck: Date.now()
    });
  }

  getStatus(): any {
    return Object.fromEntries(this.sourceHealth);
  }
}

// Singleton instance
export const optimizedDataLoader = new OptimizedDataLoader();