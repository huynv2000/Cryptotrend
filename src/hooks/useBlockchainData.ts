// Hook for fetching and managing blockchain data

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBlockchainStore } from '@/store/blockchainStore';
import { API } from '@/lib/api/client';
import type { 
  BlockchainValue, 
  TimeframeValue,
  UsageMetrics,
  CashflowMetrics,
  MarketOverview,
  AIAnalysis
} from '@/lib/types';

// Query keys
export const blockchainKeys = {
  all: ['blockchain'] as const,
  usageMetrics: (blockchain: BlockchainValue, timeframe: TimeframeValue) => 
    ['blockchain', 'usage-metrics', blockchain, timeframe] as const,
  cashflowMetrics: (blockchain: BlockchainValue, timeframe: TimeframeValue) => 
    ['blockchain', 'cashflow-metrics', blockchain, timeframe] as const,
  marketOverview: (blockchain: BlockchainValue) => 
    ['blockchain', 'market-overview', blockchain] as const,
  aiAnalysis: (blockchain: BlockchainValue) => 
    ['blockchain', 'ai-analysis', blockchain] as const,
  historical: (blockchain: BlockchainValue, metric: string, timeframe: TimeframeValue) => 
    ['blockchain', 'historical', blockchain, metric, timeframe] as const,
};

// Hook for fetching usage metrics
export function useUsageMetrics(blockchain: BlockchainValue, timeframe: TimeframeValue) {
  const store = useBlockchainStore();
  
  return useQuery({
    queryKey: blockchainKeys.usageMetrics(blockchain, timeframe),
    queryFn: () => API.blockchain.getUsageMetrics(blockchain, timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
    enabled: !!blockchain,
    onSuccess: (data) => {
      store.setUsageMetrics(data);
    },
    onError: (error) => {
      store.setError(`Failed to fetch usage metrics: ${error.message}`);
    },
  });
}

// Hook for fetching cashflow metrics
export function useCashflowMetrics(blockchain: BlockchainValue, timeframe: TimeframeValue) {
  const store = useBlockchainStore();
  
  return useQuery({
    queryKey: blockchainKeys.cashflowMetrics(blockchain, timeframe),
    queryFn: () => API.blockchain.getCashflowMetrics(blockchain, timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
    enabled: !!blockchain,
    onSuccess: (data) => {
      store.setCashflowMetrics(data);
    },
    onError: (error) => {
      store.setError(`Failed to fetch cashflow metrics: ${error.message}`);
    },
  });
}

// Hook for fetching market overview
export function useMarketOverview(blockchain: BlockchainValue) {
  const store = useBlockchainStore();
  
  return useQuery({
    queryKey: blockchainKeys.marketOverview(blockchain),
    queryFn: () => API.blockchain.getMarketOverview(blockchain),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
    enabled: !!blockchain,
    onSuccess: (data) => {
      store.setMarketOverview(data);
    },
    onError: (error) => {
      store.setError(`Failed to fetch market overview: ${error.message}`);
    },
  });
}

// Hook for fetching AI analysis
export function useAIAnalysis(blockchain: BlockchainValue) {
  const store = useBlockchainStore();
  
  return useQuery({
    queryKey: blockchainKeys.aiAnalysis(blockchain),
    queryFn: () => API.blockchain.getAIAnalysis(blockchain),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    enabled: !!blockchain,
    onSuccess: (data) => {
      store.setAIAnalysis(data);
    },
    onError: (error) => {
      store.setError(`Failed to fetch AI analysis: ${error.message}`);
    },
  });
}

// Hook for fetching historical data
export function useHistoricalData(
  blockchain: BlockchainValue, 
  metric: string, 
  timeframe: TimeframeValue,
  enabled: boolean = true
) {
  const store = useBlockchainStore();
  
  return useQuery({
    queryKey: blockchainKeys.historical(blockchain, metric, timeframe),
    queryFn: () => API.blockchain.getHistoricalData(blockchain, metric, timeframe),
    staleTime: 15 * 60 * 1000, // 15 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!blockchain && !!metric,
    onSuccess: (data) => {
      const key = `${blockchain}-${metric}-${timeframe}`;
      store.setHistoricalData(key, data);
    },
    onError: (error) => {
      store.setError(`Failed to fetch historical data: ${error.message}`);
    },
  });
}

// Hook for refreshing data
export function useRefreshData() {
  const queryClient = useQueryClient();
  const store = useBlockchainStore();
  
  return useMutation({
    mutationFn: async ({ blockchain, timeframe }: { blockchain: BlockchainValue; timeframe: TimeframeValue }) => {
      return API.blockchain.refreshData(blockchain, timeframe);
    },
    onMutate: () => {
      store.setLoading(true);
    },
    onSuccess: (_, { blockchain, timeframe }) => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: blockchainKeys.usageMetrics(blockchain, timeframe) });
      queryClient.invalidateQueries({ queryKey: blockchainKeys.cashflowMetrics(blockchain, timeframe) });
      queryClient.invalidateQueries({ queryKey: blockchainKeys.marketOverview(blockchain) });
      queryClient.invalidateQueries({ queryKey: blockchainKeys.aiAnalysis(blockchain) });
      
      store.addNotification({
        type: 'success',
        title: 'Data Refreshed',
        message: 'All data has been refreshed successfully',
      });
    },
    onError: (error) => {
      store.setError(`Failed to refresh data: ${error.message}`);
      store.addNotification({
        type: 'error',
        title: 'Refresh Failed',
        message: 'Failed to refresh data. Please try again.',
      });
    },
    onSettled: () => {
      store.setLoading(false);
    },
  });
}

// Hook for fetching all data at once
export function useAllBlockchainData(blockchain: BlockchainValue, timeframe: TimeframeValue) {
  const usageMetrics = useUsageMetrics(blockchain, timeframe);
  const cashflowMetrics = useCashflowMetrics(blockchain, timeframe);
  const marketOverview = useMarketOverview(blockchain);
  const aiAnalysis = useAIAnalysis(blockchain);
  const refreshData = useRefreshData();
  
  const isLoading = usageMetrics.isLoading || cashflowMetrics.isLoading || 
                    marketOverview.isLoading || aiAnalysis.isLoading;
  
  const isError = usageMetrics.isError || cashflowMetrics.isError || 
                  marketOverview.isError || aiAnalysis.isError;
  
  const error = usageMetrics.error || cashflowMetrics.error || 
                marketOverview.error || aiAnalysis.error;
  
  const data = {
    usageMetrics: usageMetrics.data,
    cashflowMetrics: cashflowMetrics.data,
    marketOverview: marketOverview.data,
    aiAnalysis: aiAnalysis.data,
  };
  
  const refresh = () => {
    refreshData.mutate({ blockchain, timeframe });
  };
  
  return {
    data,
    isLoading,
    isError,
    error,
    refresh,
    isRefreshing: refreshData.isPending,
  };
}

// Hook for comparing metrics across blockchains
export function useCompareMetrics(
  blockchains: BlockchainValue[],
  metric: string,
  timeframe: TimeframeValue = '24h'
) {
  return useQuery({
    queryKey: ['blockchain', 'compare', blockchains, metric, timeframe],
    queryFn: () => API.blockchain.compareMetrics(blockchains, metric, timeframe),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
    enabled: blockchains.length > 0 && !!metric,
  });
}

// Hook for health check
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => API.health.check(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });
}

// Hook for detailed health check
export function useDetailedHealth() {
  return useQuery({
    queryKey: ['health', 'detailed'],
    queryFn: () => API.health.detailed(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook for prefetching data
export function usePrefetchData() {
  const queryClient = useQueryClient();
  
  const prefetchUsageMetrics = (blockchain: BlockchainValue, timeframe: TimeframeValue) => {
    queryClient.prefetchQuery({
      queryKey: blockchainKeys.usageMetrics(blockchain, timeframe),
      queryFn: () => API.blockchain.getUsageMetrics(blockchain, timeframe),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  const prefetchCashflowMetrics = (blockchain: BlockchainValue, timeframe: TimeframeValue) => {
    queryClient.prefetchQuery({
      queryKey: blockchainKeys.cashflowMetrics(blockchain, timeframe),
      queryFn: () => API.blockchain.getCashflowMetrics(blockchain, timeframe),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  const prefetchMarketOverview = (blockchain: BlockchainValue) => {
    queryClient.prefetchQuery({
      queryKey: blockchainKeys.marketOverview(blockchain),
      queryFn: () => API.blockchain.getMarketOverview(blockchain),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  const prefetchAIAnalysis = (blockchain: BlockchainValue) => {
    queryClient.prefetchQuery({
      queryKey: blockchainKeys.aiAnalysis(blockchain),
      queryFn: () => API.blockchain.getAIAnalysis(blockchain),
      staleTime: 10 * 60 * 1000,
    });
  };
  
  return {
    prefetchUsageMetrics,
    prefetchCashflowMetrics,
    prefetchMarketOverview,
    prefetchAIAnalysis,
  };
}

// Hook for data subscriptions (real-time updates)
export function useDataSubscription(blockchain: BlockchainValue, timeframe: TimeframeValue) {
  const queryClient = useQueryClient();
  const store = useBlockchainStore();
  
  // This would typically be used with WebSocket subscriptions
  // For now, we'll simulate with periodic refetching
  
  const handleDataUpdate = (type: string, data: any) => {
    switch (type) {
      case 'usage-metrics':
        queryClient.setQueryData(
          blockchainKeys.usageMetrics(blockchain, timeframe),
          data
        );
        store.setUsageMetrics(data);
        break;
      case 'cashflow-metrics':
        queryClient.setQueryData(
          blockchainKeys.cashflowMetrics(blockchain, timeframe),
          data
        );
        store.setCashflowMetrics(data);
        break;
      case 'market-overview':
        queryClient.setQueryData(
          blockchainKeys.marketOverview(blockchain),
          data
        );
        store.setMarketOverview(data);
        break;
      case 'ai-analysis':
        queryClient.setQueryData(
          blockchainKeys.aiAnalysis(blockchain),
          data
        );
        store.setAIAnalysis(data);
        break;
    }
  };
  
  return {
    handleDataUpdate,
  };
}

// Hook for data caching strategies
export function useDataCache() {
  const queryClient = useQueryClient();
  
  const getCachedData = <T>(key: any[]): T | undefined => {
    return queryClient.getQueryData<T>(key);
  };
  
  const setCachedData = <T>(key: any[], data: T, ttl?: number) => {
    queryClient.setQueryData(key, data, {
      staleTime: ttl || 5 * 60 * 1000,
    });
  };
  
  const removeCachedData = (key: any[]) => {
    queryClient.removeQueries({ queryKey: key });
  };
  
  const clearCache = () => {
    queryClient.clear();
  };
  
  return {
    getCachedData,
    setCachedData,
    removeCachedData,
    clearCache,
  };
}

// Hook for data transformation utilities
export function useDataTransform() {
  const transformForChart = (data: any[], options: {
    xKey?: string;
    yKey?: string;
    sortBy?: string;
    limit?: number;
  } = {}) => {
    const { xKey = 'timestamp', yKey = 'value', sortBy, limit } = options;
    
    let transformed = data.map(item => ({
      x: item[xKey],
      y: item[yKey],
      ...item,
    }));
    
    if (sortBy) {
      transformed = transformed.sort((a, b) => {
        if (sortBy === 'x') return new Date(a.x).getTime() - new Date(b.x).getTime();
        return a[sortBy] - b[sortBy];
      });
    }
    
    if (limit) {
      transformed = transformed.slice(-limit);
    }
    
    return transformed;
  };
  
  const calculateAggregates = (data: number[]) => {
    if (data.length === 0) return null;
    
    const sum = data.reduce((a, b) => a + b, 0);
    const mean = sum / data.length;
    const min = Math.min(...data);
    const max = Math.max(...data);
    
    // Calculate standard deviation
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    
    return {
      count: data.length,
      sum,
      mean,
      min,
      max,
      stdDev,
      median: data.length % 2 === 0 
        ? (data[data.length / 2 - 1] + data[data.length / 2]) / 2
        : data[Math.floor(data.length / 2)],
    };
  };
  
  const detectAnomalies = (data: number[], threshold: number = 2) => {
    const aggregates = calculateAggregates(data);
    if (!aggregates) return [];
    
    return data.filter((value, index) => {
      const zScore = Math.abs((value - aggregates.mean) / aggregates.stdDev);
      return zScore > threshold;
    });
  };
  
  return {
    transformForChart,
    calculateAggregates,
    detectAnomalies,
  };
}

export default useAllBlockchainData;