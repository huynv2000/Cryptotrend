// Hook for fetching and managing blockchain data

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBlockchainStore } from '@/store/blockchainStore';
import { API } from '@/lib/api/client';
import type { 
  BlockchainValue, 
  TimeframeValue,
  UsageMetrics,
  TVLMetrics,
  CashflowMetrics,
  MarketOverview,
  AIAnalysis
} from '@/lib/types';

// Query keys
export const blockchainKeys = {
  all: ['blockchain'] as const,
  usageMetrics: (blockchain: BlockchainValue, timeframe: TimeframeValue) => 
    ['blockchain', 'usage-metrics', blockchain, timeframe] as const,
  tvlMetrics: (blockchain: BlockchainValue, timeframe: TimeframeValue) => 
    ['blockchain', 'tvl-metrics', blockchain, timeframe] as const,
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
    queryFn: async () => {
      try {
        const data = await API.blockchain.getUsageMetrics(blockchain, timeframe);
        
        if (!data) {
          // Return fallback data instead of null
          return getFallbackUsageMetrics(blockchain, timeframe);
        }
        
        // Check if data has the expected structure
        const requiredFields = ['id', 'blockchain', 'timeframe', 'dailyActiveAddresses'];
        const missingFields = requiredFields.filter(field => !(field in data));
        
        if (missingFields.length > 0) {
          // Return fallback data instead of null
          return getFallbackUsageMetrics(blockchain, timeframe);
        }
        
        return data;
      } catch (error) {
        console.error('Error fetching usage metrics:', error);
        // Return fallback data instead of throwing error
        return getFallbackUsageMetrics(blockchain, timeframe);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
    enabled: !!blockchain,
  });
}

// Hook for fetching TVL metrics
export function useTVLMetrics(blockchain: BlockchainValue, timeframe: TimeframeValue) {
  const store = useBlockchainStore();
  
  return useQuery({
    queryKey: blockchainKeys.tvlMetrics(blockchain, timeframe),
    queryFn: async () => {
      try {
        const data = await API.blockchain.getTVLMetrics(blockchain, timeframe);
        return data;
      } catch (error) {
        console.error('Error fetching TVL metrics:', error);
        // Return fallback data instead of throwing error
        return getFallbackTVLMetrics(blockchain, timeframe);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
    enabled: !!blockchain,
  });
}

// Hook for fetching cashflow metrics
export function useCashflowMetrics(blockchain: BlockchainValue, timeframe: TimeframeValue) {
  const store = useBlockchainStore();
  
  return useQuery({
    queryKey: blockchainKeys.cashflowMetrics(blockchain, timeframe),
    queryFn: async () => {
      try {
        const data = await API.blockchain.getCashflowMetrics(blockchain, timeframe);
        return data;
      } catch (error) {
        console.error('Error fetching cashflow metrics:', error);
        // Return fallback data instead of throwing error
        return getFallbackCashflowMetrics(blockchain, timeframe);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
    enabled: !!blockchain,
  });
}

// Hook for fetching market overview
export function useMarketOverview(blockchain: BlockchainValue) {
  const store = useBlockchainStore();
  
  return useQuery({
    queryKey: blockchainKeys.marketOverview(blockchain),
    queryFn: async () => {
      try {
        const data = await API.blockchain.getMarketOverview(blockchain);
        return data;
      } catch (error) {
        console.error('Error fetching market overview:', error);
        // Return fallback data instead of throwing error
        return getFallbackMarketOverview(blockchain);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 60 * 1000, // 1 minute
    enabled: !!blockchain,
  });
}

// Hook for fetching AI analysis
export function useAIAnalysis(blockchain: BlockchainValue) {
  const store = useBlockchainStore();
  
  return useQuery({
    queryKey: blockchainKeys.aiAnalysis(blockchain),
    queryFn: async () => {
      try {
        const data = await API.blockchain.getAIAnalysis(blockchain);
        return data;
      } catch (error) {
        console.error('Error fetching AI analysis:', error);
        // Return fallback data instead of throwing error
        return getFallbackAIAnalysis(blockchain);
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    enabled: !!blockchain,
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
    onSettled: () => {
      store.setLoading(false);
    },
  });
}

// Hook for fetching TVL comparison data
export function useTVLComparison(blockchains: string[] = ['ethereum', 'bitcoin', 'solana', 'binance-smart-chain', 'polygon']) {
  return useQuery({
    queryKey: ['blockchain', 'tvl-comparison', blockchains],
    queryFn: async () => {
      try {
        const data = await API.blockchain.getTVLComparison(blockchains);
        return data;
      } catch (error) {
        console.error('Error fetching TVL comparison:', error);
        return null;
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    enabled: blockchains.length > 0,
  });
}

// Hook for fetching all data at once
export function useAllBlockchainData(blockchain: BlockchainValue, timeframe: TimeframeValue) {
  const usageMetrics = useUsageMetrics(blockchain, timeframe);
  const tvlMetrics = useTVLMetrics(blockchain, timeframe);
  const tvlComparison = useTVLComparison();
  const cashflowMetrics = useCashflowMetrics(blockchain, timeframe);
  const marketOverview = useMarketOverview(blockchain);
  const aiAnalysis = useAIAnalysis(blockchain);
  const refreshData = useRefreshData();
  
  const isLoading = usageMetrics.isLoading || tvlMetrics.isLoading || tvlComparison.isLoading ||
                    cashflowMetrics.isLoading || marketOverview.isLoading || aiAnalysis.isLoading;
  
  const isError = usageMetrics.isError || tvlMetrics.isError || tvlComparison.isError ||
                  cashflowMetrics.isError || marketOverview.isError || aiAnalysis.isError;
  
  const error = usageMetrics.error || tvlMetrics.error || tvlComparison.error ||
                cashflowMetrics.error || marketOverview.error || aiAnalysis.error;
  
  const data = {
    usageMetrics: usageMetrics.data,
    tvlMetrics: tvlMetrics.data,
    tvlComparison: tvlComparison.data,
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

// Fallback data functions
function getFallbackUsageMetrics(blockchain: BlockchainValue, timeframe: TimeframeValue): any {
  const now = new Date();
  return {
    id: `usage-fallback-${blockchain}-${timeframe}-${now.getTime()}`,
    blockchain,
    timeframe,
    createdAt: now,
    updatedAt: now,
    dailyActiveAddresses: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    newAddresses: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    dailyTransactions: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    transactionVolume: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    averageFee: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    hashRate: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    rollingAverages: {
      dailyActiveAddresses: { '7d': 0, '30d': 0, '90d': 0 },
      newAddresses: { '7d': 0, '30d': 0, '90d': 0 },
      dailyTransactions: { '7d': 0, '30d': 0, '90d': 0 },
      transactionVolume: { '7d': 0, '30d': 0, '90d': 0 },
      averageFee: { '7d': 0, '30d': 0, '90d': 0 },
      hashRate: { '7d': 0, '30d': 0, '90d': 0 },
    },
    spikeDetection: {
      dailyActiveAddresses: {
        isSpike: false,
        severity: 'low',
        confidence: 0,
        message: 'No data available for spike detection',
        threshold: 0,
        currentValue: 0,
        baseline: 0,
        deviation: 0,
      },
      newAddresses: {
        isSpike: false,
        severity: 'low',
        confidence: 0,
        message: 'No data available for spike detection',
        threshold: 0,
        currentValue: 0,
        baseline: 0,
        deviation: 0,
      },
      dailyTransactions: {
        isSpike: false,
        severity: 'low',
        confidence: 0,
        message: 'No data available for spike detection',
        threshold: 0,
        currentValue: 0,
        baseline: 0,
        deviation: 0,
      },
      transactionVolume: {
        isSpike: false,
        severity: 'low',
        confidence: 0,
        message: 'No data available for spike detection',
        threshold: 0,
        currentValue: 0,
        baseline: 0,
        deviation: 0,
      },
      averageFee: {
        isSpike: false,
        severity: 'low',
        confidence: 0,
        message: 'No data available for spike detection',
        threshold: 0,
        currentValue: 0,
        baseline: 0,
        deviation: 0,
      },
      hashRate: {
        isSpike: false,
        severity: 'low',
        confidence: 0,
        message: 'No data available for spike detection',
        threshold: 0,
        currentValue: 0,
        baseline: 0,
        deviation: 0,
      },
    },
  };
}

function getFallbackTVLMetrics(blockchain: BlockchainValue, timeframe: TimeframeValue): any {
  const now = new Date();
  return {
    id: `tvl-fallback-${blockchain}-${timeframe}-${now.getTime()}`,
    blockchain,
    timeframe,
    createdAt: now,
    updatedAt: now,
    totalTVL: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    chainTVL: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    dominance: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    protocolCount: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    tvlAnalysis: {
      tvlChange24h: 0,
      tvlChange7d: 0,
      tvlChange30d: 0,
      topProtocols: [],
      chainDistribution: [],
      categoryDistribution: [],
      historicalTrend: [],
    },
  };
}

function getFallbackEnhancedTVLMetrics(blockchain: BlockchainValue, timeframe: TimeframeValue): any {
  const now = new Date();
  return {
    concentrationRisk: {
      concentrationRisk: 50,
      herfindahlIndex: 1500,
      topProtocolDominance: 25,
      top3ProtocolDominance: 50,
      top5ProtocolDominance: 65,
      protocolDiversity: 50,
      concentrationLevel: 'MEDIUM',
      concentrationTrend: 'STABLE',
    },
    sustainability: {
      sustainabilityScore: 50,
      revenueStability: 50,
      userGrowthRate: 5,
      protocolHealth: 50,
      ecosystemMaturity: 50,
      riskAdjustedReturns: 50,
      sustainabilityLevel: 'FAIR',
      sustainabilityTrend: 'STABLE',
    },
    overallTVLHealth: 50,
    recommendations: [],
    riskFactors: [],
    strengthFactors: [],
    lastUpdated: now.toISOString(),
    isOutdated: false,
    confidence: 0.5,
    source: 'Fallback Data',
  };
}

function getFallbackCashflowMetrics(blockchain: BlockchainValue, timeframe: TimeframeValue): any {
  const now = new Date();
  return {
    id: `cashflow-fallback-${blockchain}-${timeframe}-${now.getTime()}`,
    blockchain,
    timeframe,
    createdAt: now,
    updatedAt: now,
    bridgeFlows: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    exchangeFlows: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    stakingMetrics: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    miningValidation: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    flowAnalysis: {
      bridgeFlowPatterns: [],
      exchangeFlowCorrelations: [],
      stakingTrends: [],
      miningEfficiency: {
        current: 0,
        average: 0,
        peak: 0,
        efficiency: 0,
      },
    },
  };
}

function getFallbackMarketOverview(blockchain: BlockchainValue): any {
  const now = new Date();
  return {
    id: `market-fallback-${blockchain}-${now.getTime()}`,
    blockchain,
    createdAt: now,
    updatedAt: now,
    marketCap: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    dominance: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    volume24h: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    priceChange24h: {
      value: 0,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    fearGreedIndex: {
      value: 50,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      timestamp: now,
    },
    marketAnalysis: {
      sectorPerformance: [],
      marketCorrelations: {
        matrix: [],
        assets: [],
        timeframe: '24h',
      },
      liquidityMetrics: {
        totalLiquidity: 0,
        liquidityScore: 0,
        volumeDepth: 0,
        spread: 0,
      },
      volatilityMetrics: {
        current: 0,
        average: 0,
        high: 0,
        low: 0,
        index: 0,
      },
    },
  };
}

function getFallbackAIAnalysis(blockchain: BlockchainValue): any {
  const now = new Date();
  return {
    id: `ai-fallback-${blockchain}-${now.getTime()}`,
    blockchain,
    createdAt: now,
    updatedAt: now,
    sentiment: 'neutral',
    confidence: 50,
    signals: [
      {
        type: 'hold',
        strength: 5,
        confidence: 50,
        description: 'Insufficient data for analysis - recommend holding',
        timeframe: '24h',
        metrics: [],
      },
    ],
    recommendations: [
      {
        id: 'rec-fallback',
        title: 'Data Unavailable',
        description: 'AI analysis unavailable due to insufficient data',
        action: 'hold',
        priority: 'medium',
        confidence: 50,
        timeframe: '24h',
        expectedImpact: 'Maintain current position until data available',
      },
    ],
    riskAssessment: {
      overall: 'medium',
      factors: [],
      score: 5,
      maxScore: 10,
      recommendations: ['Monitor for data availability'],
    },
    marketInsights: [
      {
        id: 'insight-fallback',
        category: 'Data Quality',
        title: 'Limited Data Available',
        content: 'Current data insufficient for comprehensive AI analysis',
        importance: 5,
        confidence: 50,
        timeframe: '24h',
        relatedMetrics: [],
      },
    ],
    predictiveIndicators: [],
  };
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
    queryClient.setQueryData(key, data);
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

// Hook for real-time updates
export function useRealTimeUpdates(options: {
  blockchain: BlockchainValue;
  timeframe: TimeframeValue;
  enabled: boolean;
}) {
  const [connected, setConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const connect = () => {
    // Simulate WebSocket connection
    setConnected(true);
    setReconnectAttempts(0);
  };
  
  const disconnect = () => {
    setConnected(false);
  };
  
  // Simulate connection status changes
  useEffect(() => {
    if (options.enabled) {
      connect();
    } else {
      disconnect();
    }
  }, [options.enabled]);
  
  return {
    connected,
    connect,
    disconnect,
    reconnectAttempts
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
