// Real Data Integration with Trend Calculation

import type { HistoricalDataPoint, TrendAnalysis, MetricValue } from '@/lib/types';
import type { HistoricalDataRequest } from '@/lib/data-sources/historical-data';
import { calculateTrend, trendAnalysisToMetricValue } from '@/lib/trend-calculator';
import { optimizedDataLoader } from '@/lib/performance/data-loader';
import { trendCache } from '@/lib/cache/trend-cache';
import { dataErrorHandler } from '@/lib/error-handling/data-error-handler';

export interface TrendDataRequest {
  blockchain: string;
  metric: string;
  timeframe: '7d' | '30d' | '90d';
  includeHistoricalData?: boolean;
  forceRefresh?: boolean;
}

export interface TrendDataResult {
  success: boolean;
  trendAnalysis?: TrendAnalysis;
  metricValue?: MetricValue;
  historicalData?: HistoricalDataPoint[];
  error?: string;
  metadata: {
    source: string;
    cacheHit: boolean;
    loadTime: number;
    calculationTime: number;
    dataPoints: number;
    confidence: number;
  };
}

export class TrendDataIntegration {
  private readonly CACHE_TTL = {
    '7d': 5 * 60 * 1000,    // 5 minutes
    '30d': 15 * 60 * 1000,  // 15 minutes
    '90d': 30 * 60 * 1000   // 30 minutes
  };

  async getTrendAnalysis(request: TrendDataRequest): Promise<TrendDataResult> {
    const startTime = Date.now();
    const metadata: TrendDataResult['metadata'] = {
      source: 'unknown',
      cacheHit: false,
      loadTime: 0,
      calculationTime: 0,
      dataPoints: 0,
      confidence: 0
    };

    try {
      // Step 1: Check cache if not forcing refresh
      if (!request.forceRefresh) {
        const cachedResult = await this.checkCache(request);
        if (cachedResult) {
          metadata.cacheHit = true;
          metadata.source = 'cache';
          metadata.loadTime = Date.now() - startTime;
          
          return {
            success: true,
            ...cachedResult,
            metadata
          };
        }
      }

      // Step 2: Load historical data
      const dataRequest: HistoricalDataRequest = {
        blockchain: request.blockchain,
        metric: request.metric,
        timeframe: request.timeframe
      };

      const loadResult = await optimizedDataLoader.loadSingleHistoricalData(dataRequest, {
        useCache: !request.forceRefresh,
        validateData: true,
        transformData: true,
        retryOnFailure: true,
        timeout: 30000,
        priority: 'medium'
      });

      metadata.source = loadResult.metrics.source;
      metadata.loadTime = loadResult.metrics.loadTime;
      metadata.dataPoints = loadResult.data?.length || 0;

      if (!loadResult.success || !loadResult.data) {
        return {
          success: false,
          error: loadResult.error || 'Failed to load historical data',
          metadata
        };
      }

      const historicalData = loadResult.data;

      // Step 3: Calculate trend analysis
      const calculationStart = Date.now();
      const trendAnalysis = calculateTrend(historicalData);
      metadata.calculationTime = Date.now() - calculationStart;
      metadata.confidence = trendAnalysis.confidence;

      // Step 4: Convert to metric value
      const currentValue = historicalData[historicalData.length - 1]?.value || 0;
      const previousValue = historicalData.length > 1 ? historicalData[historicalData.length - 2]?.value : undefined;
      const metricValue = trendAnalysisToMetricValue(trendAnalysis, currentValue, previousValue);

      // Step 5: Cache result
      await this.cacheResult(request, {
        trendAnalysis,
        metricValue,
        historicalData: request.includeHistoricalData ? historicalData : undefined
      });

      return {
        success: true,
        trendAnalysis,
        metricValue,
        historicalData: request.includeHistoricalData ? historicalData : undefined,
        metadata
      };

    } catch (error) {
      // Handle error with comprehensive error handling
      const errorResult = await dataErrorHandler.handleDataError(
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'get_trend_analysis',
          blockchain: request.blockchain,
          metric: request.metric,
          timeframe: request.timeframe,
          timestamp: new Date()
        },
        () => this.getTrendAnalysisWithFallback(request)
      );

      if (errorResult.success) {
        const fallbackData = errorResult.data;
        return {
          success: true,
          trendAnalysis: fallbackData.trendAnalysis,
          metricValue: fallbackData.metricValue,
          historicalData: fallbackData.historicalData,
          metadata: {
            ...metadata,
            source: 'fallback',
            loadTime: Date.now() - startTime,
            confidence: fallbackData.trendAnalysis?.confidence || 0.5
          }
        };
      }

      return {
        success: false,
        error: errorResult.error?.userMessage || error.message,
        metadata
      };
    }
  }

  async getBatchTrendAnalysis(requests: TrendDataRequest[]): Promise<TrendDataResult[]> {
    const startTime = Date.now();
    
    try {
      // Group requests by blockchain and metric for optimization
      const groupedRequests = this.groupRequests(requests);
      
      const allResults: TrendDataResult[] = [];
      
      // Process each group
      for (const group of groupedRequests) {
        const groupResults = await this.processRequestGroup(group);
        allResults.push(...groupResults);
      }

      return allResults;
    } catch (error) {
      console.error('Batch trend analysis failed:', error);
      
      // Return error results for all requests
      return requests.map(request => ({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        metadata: {
          source: 'error',
          cacheHit: false,
          loadTime: Date.now() - startTime,
          calculationTime: 0,
          dataPoints: 0,
          confidence: 0
        }
      }));
    }
  }

  private async checkCache(request: TrendDataRequest): Promise<{
    trendAnalysis: TrendAnalysis;
    metricValue: MetricValue;
    historicalData?: HistoricalDataPoint[];
  } | null> {
    try {
      const cached = await trendCache.getTrendAnalysis(
        request.metric,
        request.timeframe,
        request.blockchain
      );

      if (cached) {
        // Get historical data separately if requested
        let historicalData: HistoricalDataPoint[] | undefined;
        if (request.includeHistoricalData) {
          historicalData = await this.getHistoricalDataForTrend(request);
        }

        const currentValue = this.getCurrentValueFromTrend(cached);
        const previousValue = this.getPreviousValueFromTrend(cached);
        const metricValue = trendAnalysisToMetricValue(cached, currentValue, previousValue);

        return {
          trendAnalysis: cached,
          metricValue,
          historicalData
        };
      }

      return null;
    } catch (error) {
      console.warn('Cache check failed:', error);
      return null;
    }
  }

  private async cacheResult(
    request: TrendDataRequest,
    data: {
      trendAnalysis: TrendAnalysis;
      metricValue: MetricValue;
      historicalData?: HistoricalDataPoint[];
    }
  ): Promise<void> {
    try {
      await trendCache.setTrendAnalysis(
        request.metric,
        request.timeframe,
        request.blockchain,
        data.trendAnalysis
      );
    } catch (error) {
      console.warn('Failed to cache trend result:', error);
    }
  }

  private async getTrendAnalysisWithFallback(request: TrendDataRequest): Promise<TrendDataResult> {
    // Generate fallback trend analysis
    const fallbackTrend: TrendAnalysis = {
      direction: 'stable',
      strength: 0.5,
      momentum: 'moderate',
      volatility: 0.1,
      confidence: 0.3,
      trendline: { slope: 0, intercept: 0, rSquared: 0 },
      keyPoints: { peak: 100, trough: 50, current: 75 },
      recommendations: ['Limited data available - using fallback analysis']
    };

    const fallbackMetric: MetricValue = {
      value: 75,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: new Date()
    };

    return {
      success: true,
      trendAnalysis: fallbackTrend,
      metricValue: fallbackMetric,
      metadata: {
        source: 'fallback',
        cacheHit: false,
        loadTime: 0,
        calculationTime: 0,
        dataPoints: 0,
        confidence: 0.3
      }
    };
  }

  private groupRequests(requests: TrendDataRequest[]): TrendDataRequest[][] {
    const groups = new Map<string, TrendDataRequest[]>();

    requests.forEach(request => {
      const key = `${request.blockchain}:${request.metric}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key)!.push(request);
    });

    return Array.from(groups.values());
  }

  private async processRequestGroup(group: TrendDataRequest[]): Promise<TrendDataResult[]> {
    // Process requests in group with optimized data loading
    const dataRequests: HistoricalDataRequest[] = group.map(request => ({
      blockchain: request.blockchain,
      metric: request.metric,
      timeframe: request.timeframe
    }));

    // Load historical data for the group
    const loadResults = await optimizedDataLoader.loadHistoricalData(dataRequests, {
      useCache: true,
      validateData: true,
      transformData: true,
      retryOnFailure: true,
      timeout: 30000,
      priority: 'medium'
    });

    // Calculate trend analysis for each request
    const results: TrendDataResult[] = [];
    
    for (let i = 0; i < group.length; i++) {
      const request = group[i];
      const loadResult = loadResults[i];

      try {
        if (!loadResult.success || !loadResult.data) {
          results.push({
            success: false,
            error: loadResult.error,
            metadata: {
              source: 'load_error',
              cacheHit: false,
              loadTime: loadResult.metrics.loadTime,
              calculationTime: 0,
              dataPoints: 0,
              confidence: 0
            }
          });
          continue;
        }

        const historicalData = loadResult.data;
        const calculationStart = Date.now();
        const trendAnalysis = calculateTrend(historicalData);
        const calculationTime = Date.now() - calculationStart;

        const currentValue = historicalData[historicalData.length - 1]?.value || 0;
        const previousValue = historicalData.length > 1 ? historicalData[historicalData.length - 2]?.value : undefined;
        const metricValue = trendAnalysisToMetricValue(trendAnalysis, currentValue, previousValue);

        // Cache individual result
        await this.cacheResult(request, {
          trendAnalysis,
          metricValue,
          historicalData: request.includeHistoricalData ? historicalData : undefined
        });

        results.push({
          success: true,
          trendAnalysis,
          metricValue,
          historicalData: request.includeHistoricalData ? historicalData : undefined,
          metadata: {
            source: loadResult.metrics.source,
            cacheHit: loadResult.metrics.cacheHit,
            loadTime: loadResult.metrics.loadTime,
            calculationTime,
            dataPoints: historicalData.length,
            confidence: trendAnalysis.confidence
          }
        });

      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : String(error),
          metadata: {
            source: 'calculation_error',
            cacheHit: false,
            loadTime: loadResult.metrics.loadTime,
            calculationTime: 0,
            dataPoints: loadResult.data?.length || 0,
            confidence: 0
          }
        });
      }
    }

    return results;
  }

  private async getHistoricalDataForTrend(request: TrendDataRequest): Promise<HistoricalDataPoint[]> {
    const dataRequest: HistoricalDataRequest = {
      blockchain: request.blockchain,
      metric: request.metric,
      timeframe: request.timeframe
    };

    const result = await optimizedDataLoader.loadSingleHistoricalData(dataRequest, {
      useCache: true,
      validateData: false, // Skip validation for cached data
      transformData: false, // Skip transformation for cached data
      retryOnFailure: false,
      timeout: 10000,
      priority: 'low'
    });

    return result.success ? result.data || [] : [];
  }

  private getCurrentValueFromTrend(trend: TrendAnalysis): number {
    return trend.keyPoints.current;
  }

  private getPreviousValueFromTrend(trend: TrendAnalysis): number | undefined {
    // Estimate previous value from trendline
    const now = Date.now();
    const onePeriodAgo = now - (24 * 60 * 60 * 1000); // 1 day ago
    return trend.trendline.intercept + trend.trendline.slope * onePeriodAgo;
  }

  // Get integration statistics
  async getIntegrationStats(): Promise<{
    cacheStats: any;
    performanceMetrics: any;
    errorStats: any;
    health: 'healthy' | 'degraded' | 'unhealthy';
  }> {
    const [cacheStats, performanceMetrics, errorStats] = await Promise.all([
      trendCache.getStats(),
      optimizedDataLoader.getPerformanceMetrics(),
      dataErrorHandler.getErrorStats()
    ]);

    // Determine overall health
    let health: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (performanceMetrics.errorRate > 0.1 || errorStats.totalErrors > 50) {
      health = 'unhealthy';
    } else if (performanceMetrics.cacheHitRate < 0.5 || performanceMetrics.averageResponseTime > 5000) {
      health = 'degraded';
    }

    return {
      cacheStats,
      performanceMetrics,
      errorStats,
      health
    };
  }

  // Clear all caches and reset integration
  async reset(): Promise<void> {
    await trendCache.clear();
    await optimizedDataLoader.reset();
  }

  // Prefetch trend data for commonly requested combinations
  async prefetchTrendData(requests: TrendDataRequest[]): Promise<void> {
    const prefetchPromises = requests.map(async (request) => {
      try {
        await this.getTrendAnalysis({ ...request, forceRefresh: false });
      } catch (error) {
        console.warn(`Prefetch failed for ${request.blockchain}:${request.metric}`, error);
      }
    });

    await Promise.allSettled(prefetchPromises);
  }
}

// Singleton instance
export const trendDataIntegration = new TrendDataIntegration();