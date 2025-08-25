'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TVLDataPoint, TVLDataPointWithMA, MAMetrics } from '@/lib/tvl-analysis-service';
import { TVLPerformanceOptimizer, OptimizedTVLData } from '@/lib/tvl-performance-optimizer';
import { cacheService } from '@/lib/cache-service';

interface UseOptimizedTVLHistoryOptions {
  coinId: string;
  timeframe?: '24H' | '7D' | '30D' | '90D' | undefined;
  enabled?: boolean | undefined;
  refetchInterval?: number | undefined;
  autoRefresh?: boolean | undefined;
  forceRefresh?: boolean | undefined;
  includeMovingAverage?: boolean | undefined;
  includeMetrics?: boolean | undefined;
  onSuccess?: ((data: OptimizedTVLData) => void) | undefined;
  onError?: ((error: Error) => void) | undefined;
}

interface UseOptimizedTVLHistoryReturn {
  data: TVLDataPoint[];
  movingAverageData: TVLDataPointWithMA[];
  metrics: MAMetrics | null;
  stats: {
    currentTVL: number;
    change24h: number;
    avgTVL: number;
    peakTVL: number;
    troughTVL: number;
    volatility: number;
  };
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (newData: TVLDataPoint[]) => void;
  refreshMetrics: () => Promise<void>;
  cacheInfo: {
    hit: boolean;
    timestamp: number | null;
    size: number;
  };
  analysis: {
    trend: 'bullish' | 'bearish' | 'sideways';
    signal: string;
    strength: number;
  };
}

export function useOptimizedTVLHistory({
  coinId,
  timeframe = '30D',
  enabled = true,
  refetchInterval,
  autoRefresh = false,
  forceRefresh = false,
  includeMovingAverage = true,
  includeMetrics = true,
  onSuccess,
  onError
}: UseOptimizedTVLHistoryOptions): UseOptimizedTVLHistoryReturn {
  const [data, setData] = useState<TVLDataPoint[]>([]);
  const [movingAverageData, setMovingAverageData] = useState<TVLDataPointWithMA[]>([]);
  const [metrics, setMetrics] = useState<MAMetrics | null>(null);
  const [stats, setStats] = useState<UseOptimizedTVLHistoryReturn['stats']>({
    currentTVL: 0,
    change24h: 0,
    avgTVL: 0,
    peakTVL: 0,
    troughTVL: 0,
    volatility: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  const optimizerRef = useRef(TVLPerformanceOptimizer.getInstance());
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch optimized data
  const fetchData = useCallback(async (
    isRefetch = false
  ): Promise<OptimizedTVLData> => {
    if (!enabled) {
      throw new Error('Hook is disabled');
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      console.log(`Fetching optimized TVL data for ${coinId}, timeframe: ${timeframe}`);

      const result = await optimizerRef.current.fetchOptimizedTVLData(
        coinId,
        timeframe,
        {
          forceRefresh: isRefetch || forceRefresh,
          includeMovingAverage,
          includeMetrics
        }
      );

      console.log(`Successfully fetched optimized TVL data for ${coinId}`);
      return result;

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request aborted');
        throw new Error('Request aborted');
      }
      throw err;
    }
  }, [coinId, timeframe, enabled, forceRefresh, includeMovingAverage, includeMetrics]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);
    setRetryAttempt(0);

    try {
      const result = await fetchData(true);
      
      setData(result.history);
      setMovingAverageData(result.movingAverage);
      setMetrics(result.metrics);
      setStats(result.stats);
      
      onSuccess?.(result);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchData, onSuccess, onError]);

  // Refresh metrics only
  const refreshMetrics = useCallback(async () => {
    if (!enabled || data.length === 0) return;

    try {
      const result = await fetchData(false);
      setMetrics(result.metrics);
      setStats(result.stats);
      
    } catch (err) {
      console.error('Failed to refresh metrics:', err);
    }
  }, [enabled, data.length, fetchData]);

  // Refetch data
  const refetch = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchData(true);
      
      setData(result.history);
      setMovingAverageData(result.movingAverage);
      setMetrics(result.metrics);
      setStats(result.stats);
      
      onSuccess?.(result);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchData, onSuccess, onError]);

  // Mutate data (client-side update)
  const mutate = useCallback((newData: TVLDataPoint[]) => {
    setData(newData);
    
    // Recalculate stats
    if (newData.length > 0) {
      const tvls = newData.map(d => d.tvl);
      const currentTVL = tvls[tvls.length - 1];
      const previousTVL = tvls.length > 1 ? tvls[tvls.length - 2] : currentTVL;
      const change24h = previousTVL > 0 ? ((currentTVL - previousTVL) / previousTVL) * 100 : 0;
      
      const avgTVL = tvls.reduce((sum, tvl) => sum + tvl, 0) / tvls.length;
      const peakTVL = Math.max(...tvls);
      const troughTVL = Math.min(...tvls);
      
      const variance = tvls.reduce((sum, tvl) => sum + Math.pow(tvl - avgTVL, 2), 0) / tvls.length;
      const volatility = Math.sqrt(variance) / avgTVL * 100;

      setStats({
        currentTVL,
        change24h,
        avgTVL,
        peakTVL,
        troughTVL,
        volatility
      });
    }
  }, []);

  // Get cache info
  const getCacheInfo = useCallback(() => {
    const cacheKey = `optimized-tvl-${coinId}-${timeframe}-${includeMovingAverage}-${includeMetrics}`;
    const cacheEntry = cacheService.getEntryInfo(cacheKey);
    return {
      hit: cacheEntry !== null,
      timestamp: cacheEntry?.timestamp || null,
      size: data.length + movingAverageData.length
    };
  }, [coinId, timeframe, includeMovingAverage, includeMetrics, data.length, movingAverageData.length]);

  // Calculate analysis
  const getAnalysis = useCallback(() => {
    if (!metrics) {
      return {
        trend: 'sideways' as const,
        signal: 'neutral',
        strength: 0
      };
    }

    const { maTrend, distanceFromMA, volatility } = metrics;
    
    // Determine trend
    let trend: 'bullish' | 'bearish' | 'sideways' = 'sideways';
    if (maTrend === 'up' && distanceFromMA > 2) {
      trend = 'bullish';
    } else if (maTrend === 'down' && distanceFromMA < -2) {
      trend = 'bearish';
    }

    // Calculate strength based on distance and volatility
    const strength = Math.min(100, Math.abs(distanceFromMA) * 2 + volatility);

    return {
      trend,
      signal: metrics.signal,
      strength
    };
  }, [metrics]);

  // Initial load
  useEffect(() => {
    if (enabled && data.length === 0) {
      loadInitialData();
    }
  }, [enabled, data.length, loadInitialData]);

  // Auto refresh for metrics
  useEffect(() => {
    if (!enabled || !autoRefresh || !refetchInterval) return;

    const interval = setInterval(refreshMetrics, refetchInterval);
    return () => clearInterval(interval);
  }, [enabled, autoRefresh, refetchInterval, refreshMetrics]);

  // Full refetch interval (less frequent)
  useEffect(() => {
    if (!enabled || !refetchInterval || !autoRefresh) return;

    const interval = setInterval(refetch, refetchInterval * 2); // Less frequent full refetch
    return () => clearInterval(interval);
  }, [enabled, refetchInterval, autoRefresh, refetch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    movingAverageData,
    metrics,
    stats,
    loading,
    error,
    refetch,
    mutate,
    refreshMetrics,
    cacheInfo: getCacheInfo(),
    analysis: getAnalysis()
  };
}