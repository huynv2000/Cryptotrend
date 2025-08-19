// API v2 Client for Blockchain Dashboard

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface UsageMetricsData {
  dailyActiveAddresses: number;
  newAddresses: number;
  dailyTransactions: number;
  transactionVolume: number;
  averageTransactionFee: number;
  networkHashRate: number;
}

interface CashFlowMetricsData {
  bridgeFlows: number;
  exchangeFlows: number;
  stakingSupply: number;
  miningValidation: number;
}

interface MarketOverviewData {
  totalMarketCap: number;
  marketCapChange: number;
  totalVolume24h: number;
  volumeChange: number;
  btcDominance: number;
  ethDominance: number;
  topGainers: Array<{ symbol: string; change: number }>;
  topLosers: Array<{ symbol: string; change: number }>;
}

interface GrowthAnalysisData {
  dauTrend: number;
  transactionGrowth: number;
  userAcquisition: number;
  retentionRate: number;
  adoptionCurve: 'early' | 'growth' | 'mature' | 'declining';
  projections: Array<{ period: string; value: number }>;
}

interface CashFlowAnalysisData {
  bridgeFlows: Array<{ from: string; to: string; volume: number }>;
  stablecoinMovements: Array<{ token: string; flow: number; change: number }>;
  exchangeCorrelations: Array<{ exchange: string; correlation: number }>;
  liquidityMetrics: Array<{ metric: string; value: number; status: 'good' | 'warning' | 'critical' }>;
}

interface AIRecommendationData {
  type: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  signal: string;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  timeframe: string;
  indicators: string[];
}

class ApiV2Client {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/v2') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Usage Metrics API
  async getUsageMetrics(blockchain: string, timeRange: '7D' | '30D' | '90D' = '30D'): Promise<ApiResponse<UsageMetricsData>> {
    return this.request<UsageMetricsData>(`/blockchain/usage-metrics?blockchain=${blockchain}&timeRange=${timeRange}`);
  }

  async getUsageMetric(blockchain: string, metricId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/blockchain/usage-metrics/${metricId}?blockchain=${blockchain}`);
  }

  async getUsageMetricsHistorical(blockchain: string, metricId: string, days: number = 30): Promise<ApiResponse<any>> {
    return this.request<any>(`/blockchain/usage-metrics/historical?blockchain=${blockchain}&metricId=${metricId}&days=${days}`);
  }

  async compareUsageMetrics(blockchains: string[], metricId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/blockchain/usage-metrics/compare?blockchains=${blockchains.join(',')}&metricId=${metricId}`);
  }

  // Cash Flow Metrics API
  async getCashFlowMetrics(blockchain: string, timeRange: '7D' | '30D' | '90D' = '30D'): Promise<ApiResponse<CashFlowMetricsData>> {
    return this.request<CashFlowMetricsData>(`/blockchain/cashflow-metrics?blockchain=${blockchain}&timeRange=${timeRange}`);
  }

  async getCashFlowMetric(blockchain: string, metricId: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/blockchain/cashflow-metrics/${metricId}?blockchain=${blockchain}`);
  }

  async getCashFlowMetricsAggregate(blockchain: string, metrics: string[]): Promise<ApiResponse<any>> {
    return this.request<any>(`/blockchain/cashflow-metrics/aggregate?blockchain=${blockchain}&metrics=${metrics.join(',')}`);
  }

  async getCashFlowMetricsForecast(blockchain: string, metricId: string, days: number = 7): Promise<ApiResponse<any>> {
    return this.request<any>(`/blockchain/cashflow-metrics/forecast?blockchain=${blockchain}&metricId=${metricId}&days=${days}`);
  }

  // Market Overview API
  async getMarketOverview(blockchain: string): Promise<ApiResponse<MarketOverviewData>> {
    return this.request<MarketOverviewData>(`/blockchain/market-overview?blockchain=${blockchain}`);
  }

  async getMarketSummary(blockchain: string): Promise<ApiResponse<any>> {
    return this.request<any>(`/blockchain/market-overview/summary?blockchain=${blockchain}`);
  }

  async getMarketTrends(blockchain: string, period: '7D' | '30D' | '90D' = '30D'): Promise<ApiResponse<any>> {
    return this.request<any>(`/blockchain/market-overview/trends?blockchain=${blockchain}&period=${period}`);
  }

  // AI Analysis API
  async getAIAnalysis(blockchain: string): Promise<ApiResponse<{
    growthAnalysis: GrowthAnalysisData;
    cashFlowAnalysis: CashFlowAnalysisData;
    recommendations: AIRecommendationData[];
  }>> {
    return this.request<{
      growthAnalysis: GrowthAnalysisData;
      cashFlowAnalysis: CashFlowAnalysisData;
      recommendations: AIRecommendationData[];
    }>(`/blockchain/ai-analysis?blockchain=${blockchain}`);
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// Export singleton instance
export const apiV2 = new ApiV2Client();

// Export types for use in components
export type {
  UsageMetricsData,
  CashFlowMetricsData,
  MarketOverviewData,
  GrowthAnalysisData,
  CashFlowAnalysisData,
  AIRecommendationData,
  ApiResponse,
};