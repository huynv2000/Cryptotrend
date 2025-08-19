// TVL Metrics Service - Specialized for Total Value Locked metrics
// Extends DeFiLlama service with TVL-specific functionality

import { db } from '@/lib/db';

interface TVLChainData {
  gecko_id: string;
  tvl: number;
  tokenSymbol: string;
  name: string;
  change_1d: number;
  change_7d: number;
  change_30d: number;
}

interface TVLProtocolData {
  name: string;
  slug: string;
  tvl: number;
  change_1d: number;
  change_7d: number;
  change_30d: number;
  category: string;
  chains: string[];
  description: string;
  url: string;
  twitter?: string;
  audit_note?: string;
  audits: string;
  chainTvls: { [key: string]: number };
}

interface TVLHistoricalData {
  date: string;
  totalLiquidityUSD: number;
}

interface TVLCategoryData {
  category: string;
  tvl: number;
  protocols: number;
  change_1d: number;
  change_7d: number;
  change_30d: number;
}

export class TVLService {
  private static instance: TVLService;
  private baseUrl = 'https://api.llama.fi';
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  static getInstance(): TVLService {
    if (!TVLService.instance) {
      TVLService.instance = new TVLService();
    }
    return TVLService.instance;
  }

  // Helper method for cached API calls
  private async cachedFetch<T>(key: string, url: string, ttl: number = 300000): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);
    
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.data;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.cache.set(key, { data, timestamp: now, ttl });
      return data;
    } catch (error) {
      console.error(`Error fetching ${key}:`, error);
      throw error;
    }
  }

  // Get TVL by chain
  async getTVLByChain(): Promise<TVLChainData[]> {
    return this.cachedFetch<TVLChainData[]>('tvl-chains', `${this.baseUrl}/v2/chains`);
  }

  // Get TVL by protocol
  async getTVLByProtocol(limit: number = 100): Promise<TVLProtocolData[]> {
    const protocols = await this.cachedFetch<TVLProtocolData[]>('tvl-protocols', `${this.baseUrl}/protocols`);
    return protocols.slice(0, limit);
  }

  // Get historical TVL data
  async getHistoricalTVL(chain?: string): Promise<TVLHistoricalData[]> {
    const url = chain ? `${this.baseUrl}/v2/historicalChainTvl/${chain}` : `${this.baseUrl}/v2/historicalTvl`;
    return this.cachedFetch<TVLHistoricalData[]>(`tvl-historical-${chain || 'global'}`, url, 600000); // 10 minute cache
  }

  // Get TVL by category
  async getTVLByCategory(): Promise<TVLCategoryData[]> {
    return this.cachedFetch<TVLCategoryData[]>('tvl-categories', `${this.baseUrl}/v2/categories`);
  }

  // Get TVL for specific blockchain
  async getBlockchainTVL(coinGeckoId: string): Promise<{
    chainTVL: number;
    dominance: number;
    change24h: number;
    change7d: number;
    change30d: number;
    protocolCount: number;
    topProtocols: TVLProtocolData[];
    historicalData: TVLHistoricalData[];
  }> {
    try {
      const [chains, protocols, historicalData] = await Promise.all([
        this.getTVLByChain(),
        this.getTVLByProtocol(50),
        this.getHistoricalTVL(this.mapCoinGeckoToChain(coinGeckoId))
      ]);

      // Map coinGeckoId to chain name
      const chainName = this.mapCoinGeckoToChain(coinGeckoId);
      const chainData = chains.find(c => c.name === chainName || c.gecko_id === coinGeckoId);
      
      // Get protocols for this chain
      const chainProtocols = protocols.filter(p => 
        p.chains.includes(chainName) || 
        p.chainTvls[chainName] > 0
      );

      // Calculate total TVL and dominance
      const totalMarketTVL = chains.reduce((sum, chain) => sum + (chain.tvl || 0), 0);
      const chainTVL = chainData?.tvl || chainProtocols.reduce((sum, p) => sum + (p.chainTvls[chainName] || 0), 0);
      const dominance = totalMarketTVL > 0 ? (chainTVL / totalMarketTVL) * 100 : 0;

      return {
        chainTVL,
        dominance,
        change24h: chainData?.change_1d || 0,
        change7d: chainData?.change_7d || 0,
        change30d: chainData?.change_30d || 0,
        protocolCount: chainProtocols.length,
        topProtocols: chainProtocols.slice(0, 10),
        historicalData: historicalData.slice(-30) // Last 30 days
      };
    } catch (error) {
      console.error('Error fetching blockchain TVL:', error);
      throw error;
    }
  }

  // Get global TVL metrics
  async getGlobalTVL(): Promise<{
    totalTVL: number;
    change24h: number;
    change7d: number;
    change30d: number;
    topChains: TVLChainData[];
    topProtocols: TVLProtocolData[];
    historicalData: TVLHistoricalData[];
  }> {
    try {
      const [chains, protocols, historicalData] = await Promise.all([
        this.getTVLByChain(),
        this.getTVLByProtocol(20),
        this.getHistoricalTVL()
      ]);

      const totalTVL = chains.reduce((sum, chain) => sum + (chain.tvl || 0), 0);
      
      // Calculate global changes from historical data
      const change24h = this.calculateChangeFromHistorical(historicalData, 1);
      const change7d = this.calculateChangeFromHistorical(historicalData, 7);
      const change30d = this.calculateChangeFromHistorical(historicalData, 30);

      return {
        totalTVL,
        change24h,
        change7d,
        change30d,
        topChains: chains.slice(0, 10),
        topProtocols: protocols.slice(0, 10),
        historicalData: historicalData.slice(-30)
      };
    } catch (error) {
      console.error('Error fetching global TVL:', error);
      throw error;
    }
  }

  // Store TVL metrics in database
  async storeTVLMetrics(coinGeckoId: string) {
    try {
      // Get cryptocurrency
      const crypto = await db.cryptocurrency.findFirst({
        where: { coinGeckoId }
      });

      if (!crypto) {
        throw new Error(`Cryptocurrency not found: ${coinGeckoId}`);
      }

      // Get TVL data
      const tvlData = await this.getBlockchainTVL(coinGeckoId);
      const globalTVL = await this.getGlobalTVL();

      // Store in database
      const tvlMetric = await db.tvlMetric.create({
        data: {
          cryptoId: crypto.id,
          totalTVL: globalTVL.totalTVL,
          chainTVL: tvlData.chainTVL,
          dominance: tvlData.dominance,
          tvlChange24h: tvlData.change24h,
          tvlChange7d: tvlData.change7d,
          tvlChange30d: tvlData.change30d,
          protocolCount: tvlData.protocolCount,
          topProtocols: JSON.stringify(tvlData.topProtocols),
          chainDistribution: JSON.stringify(globalTVL.topChains),
          categoryDistribution: JSON.stringify([]), // Will be implemented later
          historicalTrend: JSON.stringify(tvlData.historicalData),
          timestamp: new Date()
        }
      });

      return tvlMetric;
    } catch (error) {
      console.error('Error storing TVL metrics:', error);
      throw error;
    }
  }

  // Get latest TVL metrics from database
  async getLatestTVLMetrics(coinGeckoId: string) {
    try {
      const crypto = await db.cryptocurrency.findFirst({
        where: { coinGeckoId }
      });

      if (!crypto) {
        return null;
      }

      const latestMetric = await db.tvlMetric.findFirst({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' }
      });

      if (!latestMetric) {
        return null;
      }

      return {
        ...latestMetric,
        topProtocols: JSON.parse(latestMetric.topProtocols || '[]'),
        chainDistribution: JSON.parse(latestMetric.chainDistribution || '[]'),
        categoryDistribution: JSON.parse(latestMetric.categoryDistribution || '[]'),
        historicalTrend: JSON.parse(latestMetric.historicalTrend || '[]')
      };
    } catch (error) {
      console.error('Error getting latest TVL metrics:', error);
      throw error;
    }
  }

  // Get or create TVL metrics with automatic refresh
  async getOrCreateTVLMetrics(coinGeckoId: string, forceRefresh: boolean = false) {
    try {
      // Try to get latest metrics
      const latestMetrics = await this.getLatestTVLMetrics(coinGeckoId);
      
      // Check if data is outdated or refresh is forced
      const now = new Date();
      const isOutdated = !latestMetrics || 
        (now.getTime() - new Date(latestMetrics.timestamp).getTime()) > (2 * 60 * 60 * 1000); // 2 hours

      if (!latestMetrics || isOutdated || forceRefresh) {
        try {
          // Fetch fresh data
          const freshMetrics = await this.storeTVLMetrics(coinGeckoId);
          return {
            ...freshMetrics,
            topProtocols: JSON.parse(freshMetrics.topProtocols || '[]'),
            chainDistribution: JSON.parse(freshMetrics.chainDistribution || '[]'),
            categoryDistribution: JSON.parse(freshMetrics.categoryDistribution || '[]'),
            historicalTrend: JSON.parse(freshMetrics.historicalTrend || '[]')
          };
        } catch (error) {
          console.error('Error fetching fresh TVL metrics:', error);
          // Fallback to existing data if available
          if (latestMetrics) {
            return latestMetrics;
          }
          throw error;
        }
      }

      return latestMetrics;
    } catch (error) {
      console.error('Error getting or creating TVL metrics:', error);
      throw error;
    }
  }

  // Helper method to map CoinGecko ID to chain name
  private mapCoinGeckoToChain(coinGeckoId: string): string {
    const mapping: { [key: string]: string } = {
      'bitcoin': 'Bitcoin',
      'ethereum': 'Ethereum',
      'binancecoin': 'Binance Smart Chain',
      'solana': 'Solana',
      'cardano': 'Cardano',
      'polygon': 'Polygon',
      'avalanche-2': 'Avalanche',
      'chainlink': 'Chainlink',
      'polkadot': 'Polkadot',
      'dogecoin': 'Dogecoin'
    };

    return mapping[coinGeckoId] || coinGeckoId;
  }

  // Helper method to calculate percentage change from historical data
  private calculateChangeFromHistorical(historicalData: TVLHistoricalData[], daysAgo: number): number {
    if (historicalData.length < daysAgo + 1) {
      return 0;
    }

    const current = historicalData[historicalData.length - 1].totalLiquidityUSD;
    const previous = historicalData[historicalData.length - 1 - daysAgo].totalLiquidityUSD;
    
    if (previous === 0) {
      return 0;
    }

    return ((current - previous) / previous) * 100;
  }

  // Get TVL trends and analytics
  async getTVLAnalytics(coinGeckoId: string) {
    try {
      const tvlMetrics = await this.getOrCreateTVLMetrics(coinGeckoId);
      
      if (!tvlMetrics) {
        return null;
      }

      const historicalData = tvlMetrics.historicalTrend as TVLHistoricalData[];
      
      // Calculate trends
      const trend7d = this.calculateTrend(historicalData.slice(-7));
      const trend30d = this.calculateTrend(historicalData.slice(-30));
      
      // Calculate volatility
      const volatility = this.calculateVolatility(historicalData.slice(-30));
      
      // Find all-time high and low
      const allTimeHigh = Math.max(...historicalData.map(d => d.totalLiquidityUSD));
      const allTimeLow = Math.min(...historicalData.map(d => d.totalLiquidityUSD));
      
      return {
        currentTVL: tvlMetrics.chainTVL,
        dominance: tvlMetrics.dominance,
        trends: {
          '7d': trend7d,
          '30d': trend30d
        },
        volatility,
        allTimeHigh,
        allTimeLow,
        protocolCount: tvlMetrics.protocolCount,
        topProtocols: tvlMetrics.topProtocols,
        lastUpdated: tvlMetrics.timestamp
      };
    } catch (error) {
      console.error('Error getting TVL analytics:', error);
      throw error;
    }
  }

  // Helper method to calculate trend direction
  private calculateTrend(data: TVLHistoricalData[]): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 2) {
      return 'stable';
    }

    const first = data[0].totalLiquidityUSD;
    const last = data[data.length - 1].totalLiquidityUSD;
    const change = ((last - first) / first) * 100;

    if (Math.abs(change) < 1) {
      return 'stable';
    }
    
    return change > 0 ? 'increasing' : 'decreasing';
  }

  // Helper method to calculate volatility
  private calculateVolatility(data: TVLHistoricalData[]): number {
    if (data.length < 2) {
      return 0;
    }

    const values = data.map(d => d.totalLiquidityUSD);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }
}