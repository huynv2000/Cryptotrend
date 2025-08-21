'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  TVLDataPoint, 
  TVLDataPointWithMA, 
  MovingAverageResult, 
  MAMetrics 
} from '@/lib/tvl-analysis-service';
import { cacheService } from '@/lib/cache-service';

interface UseMovingAverageOptions {
  coinId: string;
  period?: number;
  enabled?: boolean;
  cacheKey?: string;
  refetchInterval?: number;
  autoRefresh?: boolean;
  forceRefresh?: boolean;
  onSuccess?: (result: MovingAverageResult) => void;
  onError?: (error: Error) => void;
  onMetricsChange?: (metrics: MAMetrics) => void;
}

interface UseMovingAverageReturn {
  data: TVLDataPointWithMA[];
  metrics: MAMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (newData: TVLDataPointWithMA[]) => void;
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

export function useMovingAverage({
  coinId,
  period = 30,
  enabled = true,
  cacheKey,
  refetchInterval,
  autoRefresh = false,
  forceRefresh = false,
  onSuccess,
  onError,
  onMetricsChange
}: UseMovingAverageOptions): UseMovingAverageReturn {
  const [data, setData] = useState<TVLDataPointWithMA[]>([]);
  const [metrics, setMetrics] = useState<MAMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const defaultCacheKey = `ma-${coinId}-${period}`;
  const key = cacheKey || defaultCacheKey;

  // Fetch moving average data
  const fetchData = useCallback(async (
    isRefetch = false
  ): Promise<MovingAverageResult> => {
    if (!enabled) {
      throw new Error('Hook is disabled');
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      console.log(`Fetching moving average for ${coinId}, period: ${period}`);

      const response = await fetch(
        `/api/v2/tvl/analysis?coinId=${coinId}&period=${period}&type=moving-average&refresh=${isRefetch || forceRefresh}`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'max-age=300',
            'Pragma': 'no-cache'
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch moving average data');
      }

      console.log(`Successfully fetched moving average data for ${coinId}`);
      return result.data;

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request aborted');
        throw new Error('Request aborted');
      }
      throw err;
    }
  }, [coinId, period, enabled, forceRefresh]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);
    setRetryAttempt(0);

    try {
      const result = await fetchData(true);
      
      setData(result.data);
      setMetrics(result.metrics);
      
      onSuccess?.(result);
      onMetricsChange?.(result.metrics);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchData, onSuccess, onError, onMetricsChange]);

  // Refresh metrics only
  const refreshMetrics = useCallback(async () => {
    if (!enabled || data.length === 0) return;

    try {
      const result = await fetchData(false);
      setMetrics(result.metrics);
      onMetricsChange?.(result.metrics);
    } catch (err) {
      console.error('Failed to refresh metrics:', err);
    }
  }, [enabled, data.length, fetchData, onMetricsChange]);

  // Refetch data
  const refetch = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchData(true);
      
      setData(result.data);
      setMetrics(result.metrics);
      
      onSuccess?.(result);
      onMetricsChange?.(result.metrics);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchData, onSuccess, onError, onMetricsChange]);

  // Mutate data (client-side update)
  const mutate = useCallback((newData: TVLDataPointWithMA[]) => {
    setData(newData);
    
    // Recalculate metrics if we have enough data
    if (newData.length > 0) {
      const currentTVL = newData[newData.length - 1]?.tvl || 0;
      const currentMA = newData[newData.length - 1]?.movingAverage || 0;
      const previousMA = newData.length > 1 ? newData[newData.length - 2]?.movingAverage || currentMA : currentMA;
      
      const maTrend = currentMA > previousMA ? 'up' : currentMA < previousMA ? 'down' : 'stable';
      const distanceFromMA = currentMA > 0 ? ((currentTVL - currentMA) / currentMA) * 100 : 0;
      
      const deviations = newData.map(item => Math.abs(item.maDeviation));
      const avgDeviation = deviations.reduce((sum, dev) => sum + dev, 0) / deviations.length;
      
      const newMetrics: MAMetrics = {
        currentTVL,
        currentMA,
        maTrend,
        volatility: avgDeviation,
        distanceFromMA,
        signal: distanceFromMA > 15 ? 'overbought' : 
                distanceFromMA < -15 ? 'oversold' :
                maTrend === 'up' && distanceFromMA < -5 ? 'buy_signal' :
                maTrend === 'down' && distanceFromMA > 5 ? 'sell_signal' : 'neutral'
      };
      
      setMetrics(newMetrics);
      onMetricsChange?.(newMetrics);
    }
  }, [onMetricsChange]);

  // Get cache info
  const getCacheInfo = useCallback(() => {
    const cacheEntry = cacheService.getEntryInfo(key);
    return {
      hit: cacheEntry !== null,
      timestamp: cacheEntry?.timestamp || null,
      size: data.length
    };
  }, [key, data.length]);

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

  // Full refetch interval
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
    metrics,
    loading,
    error,
    refetch,
    mutate,
    refreshMetrics,
    cacheInfo: getCacheInfo(),
    analysis: getAnalysis()
  };
}

// Hook for comparing multiple moving averages
export function useMultipleMovingAverages(
  requests: Array<{
    coinId: string;
    period?: number;
  }>,
  options: Omit<UseMovingAverageOptions, 'coinId' | 'period'> = {}
) {
  // This is a simplified version - in a real implementation, you might want to use a context
  // or create individual hook instances differently
  const primaryRequest = requests[0]; // Use first request as primary
  const primaryResult = useMovingAverage({
    ...options,
    ...primaryRequest
  });

  // For now, return primary result only
  // In a full implementation, you would manage multiple hook instances
  const key = `${primaryRequest.coinId}-${primaryRequest.period || 30}`;
  
  return {
    data: { [key]: primaryResult.data },
    metrics: { [key]: primaryResult.metrics },
    loading: primaryResult.loading,
    error: primaryResult.error,
    refetch: primaryResult.refetch,
    individualResults: [primaryResult]
  };
}

// Hook for real-time moving average updates
export function useRealTimeMovingAverage(
  coinId: string,
  period: number = 30,
  updateInterval: number = 30000 // 30 seconds
) {
  const { data, metrics, loading, error, refetch } = useMovingAverage({
    coinId,
    period,
    enabled: true,
    refetchInterval: updateInterval,
    autoRefresh: true
  });

  // Add real-time event listeners
  useEffect(() => {
    const handleRealTimeUpdate = (event: CustomEvent) => {
      if (event.detail.coinId === coinId) {
        refetch();
      }
    };

    window.addEventListener('tvl-update', handleRealTimeUpdate as EventListener);
    
    return () => {
      window.removeEventListener('tvl-update', handleRealTimeUpdate as EventListener);
    };
  }, [coinId, refetch]);

  return {
    data,
    metrics,
    loading,
    error,
    refetch,
    isRealTime: true,
    lastUpdate: data.length > 0 ? data[data.length - 1].date : null
  };
}