'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TVLDataPoint } from '@/lib/tvl-analysis-service';
import { cacheService } from '@/lib/cache-service';

interface UseTVLHistoryOptions {
  coinId: string;
  timeframe?: '24H' | '7D' | '30D' | '90D' | undefined;
  enabled?: boolean | undefined;
  cacheKey?: string | undefined;
  refetchInterval?: number | undefined;
  retryCount?: number | undefined;
  onSuccess?: ((data: TVLDataPoint[]) => void) | undefined;
  onError?: ((error: Error) => void) | undefined;
}

interface UseTVLHistoryReturn {
  data: TVLDataPoint[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  mutate: (newData: TVLDataPoint[]) => void;
  isLoadingMore: boolean;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  cacheInfo: {
    hit: boolean;
    timestamp: number | null;
    size: number;
  };
}

export function useTVLHistory({
  coinId,
  timeframe = '30D',
  enabled = true,
  cacheKey,
  refetchInterval,
  retryCount = 3,
  onSuccess,
  onError
}: UseTVLHistoryOptions): UseTVLHistoryReturn {
  const [data, setData] = useState<TVLDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [retryAttempt, setRetryAttempt] = useState(0);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const defaultCacheKey = `tvl-history-${coinId}-${timeframe}`;
  const key = cacheKey || defaultCacheKey;

  // Calculate days based on timeframe
  const getDaysFromTimeframe = (tf: string): number => {
    switch (tf) {
      case '24H': return 1;
      case '7D': return 7;
      case '30D': return 30;
      case '90D': return 90;
      default: return 30;
    }
  };

  // Fetch TVL history data
  const fetchData = useCallback(async (
    isRefetch = false,
    page = 0,
    pageSize = 30
  ): Promise<TVLDataPoint[]> => {
    if (!enabled) return [];

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      const days = getDaysFromTimeframe(timeframe);
      
      // Check cache first
      const cacheData = cacheService.get<TVLDataPoint[]>(`${key}-page-${page}`);
      if (cacheData && !isRefetch) {
        console.log(`Cache hit for ${key}-page-${page}`);
        return cacheData;
      }

      console.log(`Fetching TVL history for ${coinId}, timeframe: ${timeframe}, page: ${page}`);

      const response = await fetch(
        `/api/v2/blockchain/tvl/history?coinId=${coinId}&days=${days}&page=${page}&pageSize=${pageSize}`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'Cache-Control': 'max-age=300',
            'Pragma': 'no-cache'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const pageData = result.data || [];

      // Cache the result
      cacheService.set(`${key}-page-${page}`, pageData, 5 * 60 * 1000); // 5 minutes

      console.log(`Fetched ${pageData.length} TVL history data points for page ${page}`);
      return pageData;

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request aborted');
        return [];
      }
      throw err;
    }
  }, [coinId, timeframe, enabled, key]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);
    setRetryAttempt(0);

    try {
      const initialData = await fetchData(true);
      setData(initialData);
      setHasMore(initialData.length >= 30); // Assume more data if we got a full page
      onSuccess?.(initialData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      
      // Retry logic
      if (retryAttempt < retryCount) {
        setRetryAttempt(prev => prev + 1);
        console.log(`Retrying... Attempt ${retryAttempt + 1} of ${retryCount}`);
        setTimeout(loadInitialData, 1000 * Math.pow(2, retryAttempt)); // Exponential backoff
      } else {
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchData, retryAttempt, retryCount, onSuccess, onError]);

  // Load more data (pagination)
  const loadMore = useCallback(async () => {
    if (!enabled || isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    
    try {
      const currentPage = Math.floor(data.length / 30);
      const moreData = await fetchData(false, currentPage);
      
      if (moreData.length > 0) {
        setData(prev => [...prev, ...moreData]);
        setHasMore(moreData.length >= 30); // Check if there might be more data
      } else {
        setHasMore(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoadingMore(false);
    }
  }, [enabled, isLoadingMore, hasMore, data.length, fetchData, onError]);

  // Refetch data
  const refetch = useCallback(async () => {
    if (!enabled) return;

    // Clear cache for this key
    cacheService.deleteByPattern(new RegExp(`^${key}-page-`));
    
    setLoading(true);
    setError(null);

    try {
      const freshData = await fetchData(true);
      setData(freshData);
      setHasMore(freshData.length >= 30);
      onSuccess?.(freshData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchData, key, onSuccess, onError]);

  // Mutate data (client-side update)
  const mutate = useCallback((newData: TVLDataPoint[]) => {
    setData(newData);
    // Update cache with new data
    cacheService.set(`${key}-page-0`, newData.slice(0, 30), 5 * 60 * 1000);
  }, [key]);

  // Get cache info
  const getCacheInfo = useCallback(() => {
    const cacheEntry = cacheService.getEntryInfo(`${key}-page-0`);
    return {
      hit: cacheEntry !== null,
      timestamp: cacheEntry?.timestamp || null,
      size: data.length
    };
  }, [key, data.length]);

  // Initial load
  useEffect(() => {
    if (enabled && data.length === 0) {
      loadInitialData();
    }
  }, [enabled, data.length, loadInitialData]);

  // Refetch interval
  useEffect(() => {
    if (!enabled || !refetchInterval) return;

    const interval = setInterval(refetch, refetchInterval);
    return () => clearInterval(interval);
  }, [enabled, refetchInterval, refetch]);

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
    loading,
    error,
    refetch,
    mutate,
    isLoadingMore,
    loadMore,
    hasMore,
    cacheInfo: getCacheInfo()
  };
}

// Hook for managing multiple TVL history requests
export function useMultipleTVLHistory(
  requests: Array<{
    coinId: string;
    timeframe?: '24H' | '7D' | '30D' | '90D';
  }>,
  options: Omit<UseTVLHistoryOptions, 'coinId' | 'timeframe'> = {}
) {
  // This is a simplified version - in a real implementation, you might want to use a context
  // or create individual hook instances differently
  const primaryRequest = requests[0]; // Use first request as primary
  const primaryResult = useTVLHistory({
    ...options,
    ...primaryRequest
  });

  // For now, return primary result only
  // In a full implementation, you would manage multiple hook instances
  return {
    data: { [primaryRequest.coinId]: primaryResult.data },
    loading: primaryResult.loading,
    error: primaryResult.error,
    refetch: primaryResult.refetch,
    individualResults: [primaryResult]
  };
}