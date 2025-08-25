// Historical Data Integration Service

import type { HistoricalDataPoint } from '@/lib/types';

export interface HistoricalDataSource {
  name: string;
  endpoint: string;
  apiKey?: string;
  rateLimit: number; // requests per minute
  dataFormat: 'json' | 'csv' | 'protobuf';
  blockchain: string;
  metrics: string[];
}

export interface HistoricalDataRequest {
  blockchain: string;
  metric: string;
  timeframe: '7d' | '30d' | '90d';
  startTime?: Date;
  endTime?: Date;
}

export interface HistoricalDataResponse {
  success: boolean;
  data?: HistoricalDataPoint[];
  error?: string;
  source: string;
  timestamp: Date;
  cached: boolean;
}

export class HistoricalDataIntegration {
  private sources: Map<string, HistoricalDataSource> = new Map();
  private requestCache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  
  constructor() {
    this.initializeDataSources();
  }

  private initializeDataSources(): void {
    // Glassnode Data Source
    this.sources.set('glassnode', {
      name: 'Glassnode',
      endpoint: 'https://api.glassnode.com/v1/metrics',
      apiKey: process.env.GLASSNODE_API_KEY,
      rateLimit: 60,
      dataFormat: 'json',
      blockchain: 'bitcoin',
      metrics: ['bridge_flows', 'exchange_flows', 'staking_metrics', 'mining_validation']
    });

    // CoinMetrics Data Source
    this.sources.set('coinmetrics', {
      name: 'CoinMetrics',
      endpoint: 'https://api.coinmetrics.io/v4/timeseries',
      apiKey: process.env.COINMETRICS_API_KEY,
      rateLimit: 100,
      dataFormat: 'json',
      blockchain: 'ethereum',
      metrics: ['bridge_flows', 'exchange_flows', 'staking_metrics', 'mining_validation']
    });

    // DeFi Llama Data Source
    this.sources.set('defillama', {
      name: 'DeFi Llama',
      endpoint: 'https://api.llama.fi',
      rateLimit: 30,
      dataFormat: 'json',
      blockchain: 'solana',
      metrics: ['bridge_flows', 'exchange_flows', 'staking_metrics']
    });
  }

  async getHistoricalData(request: HistoricalDataRequest): Promise<HistoricalDataResponse> {
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    const cached = this.requestCache.get(cacheKey);
    if (cached && !this.isCacheExpired(cached)) {
      return {
        success: true,
        data: cached.data,
        source: 'cache',
        timestamp: new Date(),
        cached: true
      };
    }

    try {
      // Find appropriate data source
      const source = this.selectDataSource(request);
      if (!source) {
        throw new Error(`No data source found for ${request.blockchain}/${request.metric}`);
      }

      // Fetch data from source
      const rawData = await this.fetchFromSource(source, request);
      
      // Transform data
      const transformedData = this.transformData(rawData, request.metric);
      
      // Cache the result
      this.cacheResult(cacheKey, transformedData);
      
      return {
        success: true,
        data: transformedData,
        source: source.name,
        timestamp: new Date(),
        cached: false
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        source: 'error',
        timestamp: new Date(),
        cached: false
      };
    }
  }

  private selectDataSource(request: HistoricalDataRequest): HistoricalDataSource | null {
    // Find source that supports the blockchain and metric
    for (const [_, source] of this.sources) {
      if (source.blockchain === request.blockchain && 
          source.metrics.includes(request.metric)) {
        return source;
      }
    }
    return null;
  }

  private async fetchFromSource(source: HistoricalDataSource, request: HistoricalDataRequest): Promise<any> {
    // Calculate time range
    const endTime = request.endTime || new Date();
    const startTime = request.startTime || this.calculateStartTime(endTime, request.timeframe);
    
    // Build request URL based on source
    const url = this.buildRequestUrl(source, request, startTime, endTime);
    
    // Make API request with rate limiting
    await this.enforceRateLimit(source);
    
    const response = await fetch(url, {
      headers: this.buildHeaders(source),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  private buildRequestUrl(source: HistoricalDataSource, request: HistoricalDataRequest, startTime: Date, endTime: Date): string {
    const baseUrl = source.endpoint;
    const startTimeStr = startTime.toISOString();
    const endTimeStr = endTime.toISOString();
    
    switch (source.name) {
      case 'Glassnode':
        return `${baseUrl}/${request.metric}?a=${startTimeStr}&at=${endTimeStr}&i=24h`;
      
      case 'CoinMetrics':
        return `${baseUrl}/${request.metric}?start_time=${startTimeStr}&end_time=${endTimeStr}&page_size=1000`;
      
      case 'DeFi Llama':
        return `${baseUrl}/bridges/${request.blockchain}?start=${startTimeStr}&end=${endTimeStr}`;
      
      default:
        throw new Error(`Unknown data source: ${source.name}`);
    }
  }

  private buildHeaders(source: HistoricalDataSource): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'CryptoAnalyticsDashboard/1.0'
    };

    if (source.apiKey) {
      headers['Authorization'] = `Bearer ${source.apiKey}`;
    }

    return headers;
  }

  private transformData(rawData: any, metricType: string): HistoricalDataPoint[] {
    // Transform raw API data to standardized HistoricalDataPoint format
    switch (metricType) {
      case 'bridge_flows':
        return this.transformBridgeFlowsData(rawData);
      case 'exchange_flows':
        return this.transformExchangeFlowsData(rawData);
      case 'staking_metrics':
        return this.transformStakingMetricsData(rawData);
      case 'mining_validation':
        return this.transformMiningValidationData(rawData);
      default:
        return this.transformGenericData(rawData);
    }
  }

  private transformBridgeFlowsData(rawData: any): HistoricalDataPoint[] {
    // Glassnode bridge flows data transformation
    if (Array.isArray(rawData)) {
      return rawData.map(item => ({
        timestamp: new Date(item.t * 1000), // Convert Unix timestamp
        value: item.v / 1e9, // Convert to billions
        volume: item.volume || 0
      }));
    }
    
    // Fallback for other data formats
    return [];
  }

  private transformExchangeFlowsData(rawData: any): HistoricalDataPoint[] {
    // CoinMetrics exchange flows data transformation
    if (rawData.data && Array.isArray(rawData.data)) {
      return rawData.data.map(item => ({
        timestamp: new Date(item.time),
        value: item.value / 1e6, // Convert to millions
        volume: item.volume || 0
      }));
    }
    
    return [];
  }

  private transformStakingMetricsData(rawData: any): HistoricalDataPoint[] {
    // Staking metrics data transformation
    if (Array.isArray(rawData)) {
      return rawData.map(item => ({
        timestamp: new Date(item.timestamp),
        value: item.staking_rate || item.value || 0,
        volume: item.total_staked || 0
      }));
    }
    
    return [];
  }

  private transformMiningValidationData(rawData: any): HistoricalDataPoint[] {
    // Mining validation data transformation
    if (Array.isArray(rawData)) {
      return rawData.map(item => ({
        timestamp: new Date(item.timestamp),
        value: item.hashrate || item.difficulty || 0,
        volume: item.blocks_mined || 0
      }));
    }
    
    return [];
  }

  private transformGenericData(rawData: any): HistoricalDataPoint[] {
    // Generic transformation for unknown data formats
    if (Array.isArray(rawData)) {
      return rawData.map(item => ({
        timestamp: new Date(item.timestamp || item.time || item.t),
        value: item.value || item.v || 0,
        volume: item.volume || 0
      }));
    }
    
    return [];
  }

  private calculateStartTime(endTime: Date, timeframe: string): Date {
    const startTime = new Date(endTime);
    switch (timeframe) {
      case '7d':
        startTime.setDate(startTime.getDate() - 7);
        break;
      case '30d':
        startTime.setDate(startTime.getDate() - 30);
        break;
      case '90d':
        startTime.setDate(startTime.getDate() - 90);
        break;
    }
    return startTime;
  }

  private generateCacheKey(request: HistoricalDataRequest): string {
    return `${request.blockchain}:${request.metric}:${request.timeframe}:${request.startTime?.toISOString() || 'now'}:${request.endTime?.toISOString() || 'now'}`;
  }

  private isCacheExpired(cached: { timestamp: number; ttl: number }): boolean {
    return Date.now() - cached.timestamp > cached.ttl;
  }

  private cacheResult(key: string, data: any): void {
    const ttl = 5 * 60 * 1000; // 5 minutes cache
    this.requestCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private async enforceRateLimit(source: HistoricalDataSource): Promise<void> {
    const now = Date.now();
    const key = `rate_limit:${source.name}`;
    
    if (!this.requestCache.has(key)) {
      this.requestCache.set(key, { count: 0, timestamp: now });
      return;
    }

    const limitData = this.requestCache.get(key) as { count: number; timestamp: number };
    const timeWindow = 60 * 1000; // 1 minute

    if (now - limitData.timestamp > timeWindow) {
      // Reset window
      this.requestCache.set(key, { count: 1, timestamp: now });
      return;
    }

    if (limitData.count >= source.rateLimit) {
      // Wait until window resets
      const waitTime = timeWindow - (now - limitData.timestamp);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      this.requestCache.set(key, { count: 1, timestamp: Date.now() });
    } else {
      limitData.count++;
    }
  }

  // Health check for data sources
  async checkDataSourcesHealth(): Promise<Record<string, { healthy: boolean; latency: number; error?: string }>> {
    const health: Record<string, { healthy: boolean; latency: number; error?: string }> = {};
    
    for (const [key, source] of this.sources) {
      try {
        const startTime = Date.now();
        const response = await fetch(source.endpoint, {
          headers: this.buildHeaders(source),
          signal: AbortSignal.timeout(10000)
        });
        const latency = Date.now() - startTime;
        
        health[key] = {
          healthy: response.ok,
          latency
        };
      } catch (error) {
        health[key] = {
          healthy: false,
          latency: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    return health;
  }

  // Get available data sources for a blockchain
  getAvailableSources(blockchain: string): HistoricalDataSource[] {
    return Array.from(this.sources.values()).filter(source => 
      source.blockchain === blockchain
    );
  }

  // Clear cache
  clearCache(): void {
    this.requestCache.clear();
  }
}

// Singleton instance
export const historicalDataIntegration = new HistoricalDataIntegration();