import { db } from '@/lib/db';

interface DeFiLlamaChain {
  gecko_id: string;
  tvl: number;
  tokenSymbol: string;
  name: string;
  change_1d: number;
  change_7d: number;
  change_30d: number;
}

interface DeFiLlamaProtocol {
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

interface DeFiLlamaStablecoin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  marketCap: number;
  circulatingSupply: number;
  pegType: string;
  chains: string[];
}

interface DeFiLlamaDEX {
  name: string;
  slug: string;
  volume24h: number;
  volume7d: number;
  protocols: string[];
}

interface DeFiLlamaProtocolFees {
  name: string;
  slug: string;
  fees24h: number;
  fees7d: number;
  fees30d: number;
  fees1y: number;
  totalFees: number;
  revenue24h: number;
  revenue7d: number;
  revenue30d: number;
  revenue1y: number;
  totalRevenue: number;
}

interface DeFiLlamaYield {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number;
  apyReward: number;
  rewardTokens: string[];
  pool: string;
  poolMeta: string;
  mu: number;
  sigma: number;
  count: number;
  outlier: boolean;
}

interface DeFiLlamaBridge {
  chain: string;
  totalVolume: number;
  volume24h: number;
  volume7d: number;
  volume30d: number;
  deposits24h: number;
  deposits7d: number;
  deposits30d: number;
  withdrawals24h: number;
  withdrawals7d: number;
  withdrawals30d: number;
  totalDeposits: number;
  totalWithdrawals: number;
  canonicalVolume: number;
  canonicalVolume24h: number;
  canonicalVolume7d: number;
  canonicalVolume30d: number;
  nativeVolume: number;
  nativeVolume24h: number;
  nativeVolume7d: number;
  nativeVolume30d: number;
  solanaVolume: number;
  solanaVolume24h: number;
  solanaVolume7d: number;
  solanaVolume30d: number;
}

export class DeFiLlamaService {
  private static instance: DeFiLlamaService;
  private baseUrl = 'https://api.llama.fi';

  static getInstance(): DeFiLlamaService {
    if (!DeFiLlamaService.instance) {
      DeFiLlamaService.instance = new DeFiLlamaService();
    }
    return DeFiLlamaService.instance;
  }

  // TVL by Chain
  async getTVLByChain(): Promise<DeFiLlamaChain[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/chains`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching TVL by chain:', error);
      throw error;
    }
  }

  // TVL by Protocol
  async getTVLByProtocol(limit: number = 50): Promise<DeFiLlamaProtocol[]> {
    try {
      const response = await fetch(`${this.baseUrl}/protocols`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.slice(0, limit);
    } catch (error) {
      console.error('Error fetching TVL by protocol:', error);
      throw error;
    }
  }

  // Stablecoins Market Cap
  async getStablecoins(): Promise<DeFiLlamaStablecoin[]> {
    try {
      const response = await fetch(`${this.baseUrl}/stablecoins`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching stablecoins:', error);
      throw error;
    }
  }

  // DEX Volume
  async getDEXVolume(): Promise<DeFiLlamaDEX[]> {
    try {
      const response = await fetch(`${this.baseUrl}/overview/dexs`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching DEX volume:', error);
      throw error;
    }
  }

  // Protocol Fees
  async getProtocolFees(): Promise<DeFiLlamaProtocolFees[]> {
    try {
      const response = await fetch(`${this.baseUrl}/overview/fees`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching protocol fees:', error);
      throw error;
    }
  }

  // Yield Rates
  async getYieldRates(limit: number = 100): Promise<DeFiLlamaYield[]> {
    try {
      const response = await fetch(`${this.baseUrl}/yields`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data.slice(0, limit);
    } catch (error) {
      console.error('Error fetching yield rates:', error);
      throw error;
    }
  }

  // Get TVL data for specific blockchain
  async getChainTVL(chainName: string): Promise<{
    tvl: number;
    change_1d: number;
    change_7d: number;
    change_30d: number;
    tvlHistory: Array<{ date: string; tvl: number }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/historicalChainTvl/${chainName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching TVL for chain ${chainName}:`, error);
      throw error;
    }
  }

  // Get TVL for specific protocol
  async getProtocolTVL(protocolSlug: string): Promise<{
    tvl: number;
    change_1d: number;
    change_7d: number;
    change_30d: number;
    tvlHistory: Array<{ date: string; tvl: number }>;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/historical/${protocolSlug}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching TVL for protocol ${protocolSlug}:`, error);
      throw error;
    }
  }

  // Get comprehensive TVL metrics for a blockchain
  async getBlockchainTVLMetrics(coinGeckoId: string) {
    try {
      // Map coinGeckoId to DeFiLlama chain names
      const chainMapping: { [key: string]: string } = {
        'bitcoin': 'Bitcoin',
        'ethereum': 'Ethereum',
        'binancecoin': 'Binance',
        'solana': 'Solana',
        'cardano': 'Cardano',
        'polygon': 'Polygon',
        'avalanche-2': 'Avalanche',
        'chainlink': 'Chainlink',
        'polkadot': 'Polkadot',
        'dogecoin': 'Dogecoin'
      };

      const chainName = chainMapping[coinGeckoId];
      if (!chainName) {
        throw new Error(`No chain mapping found for ${coinGeckoId}`);
      }

      // Get chain TVL data
      const chainTVLData = await this.getChainTVL(chainName);
      
      // Get protocols for this chain
      const protocols = await this.getTVLByProtocol(100);
      const chainProtocols = protocols.filter(p => 
        p.chains?.includes(chainName) || 
        p.chainTvls?.[chainName]
      );

      // Get top protocols for this chain
      const topProtocols = chainProtocols
        .sort((a, b) => (b.chainTvls?.[chainName] || 0) - (a.chainTvls?.[chainName] || 0))
        .slice(0, 10)
        .map(p => ({
          name: p.name,
          slug: p.slug,
          tvl: p.chainTvls?.[chainName] || 0,
          change_1d: p.change_1d || 0,
          change_7d: p.change_7d || 0,
          change_30d: p.change_30d || 0,
          category: p.category || 'Other',
          url: p.url
        }));

      // Calculate TVL composition by category
      const categoryTVL: { [key: string]: number } = {};
      chainProtocols.forEach(p => {
        const category = p.category || 'Other';
        const protocolTVL = p.chainTvls?.[chainName] || 0;
        categoryTVL[category] = (categoryTVL[category] || 0) + protocolTVL;
      });

      // Get all chains for comparison
      const allChains = await this.getTVLByChain();
      const chainRank = allChains.findIndex(c => c.name === chainName) + 1;
      const totalMarketTVL = allChains.reduce((sum, c) => sum + (c.tvl || 0), 0);
      const dominance = chainTVLData.tvl / totalMarketTVL * 100;

      // Calculate TVL peak
      const tvlPeak = chainTVLData.tvlHistory && chainTVLData.tvlHistory.length > 0 
        ? Math.max(...chainTVLData.tvlHistory.map(h => h.tvl))
        : chainTVLData.tvl;

      return {
        chain: {
          name: chainName,
          coinGeckoId,
          tvl: chainTVLData.tvl,
          change_1d: chainTVLData.change_1d,
          change_7d: chainTVLData.change_7d,
          change_30d: chainTVLData.change_30d,
          dominance,
          rank: chainRank,
          peak: tvlPeak,
          history: chainTVLData.tvlHistory
        },
        protocols: {
          total: chainProtocols.length,
          top: topProtocols,
          categoryDistribution: categoryTVL
        },
        market: {
          totalTVL: totalMarketTVL,
          topChains: allChains.slice(0, 10)
        },
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching blockchain TVL metrics:', error);
      throw error;
    }
  }

  // Store TVL metrics in database
  async storeTVLMetrics(coinGeckoId: string, cryptoId: string) {
    try {
      const tvlMetrics = await this.getBlockchainTVLMetrics(coinGeckoId);
      
      // Store in database
      const dbTVLMetrics = await db.tVLMetric.create({
        data: {
          cryptoId,
          chainTVL: tvlMetrics.chain.tvl,
          chainTVLChange24h: tvlMetrics.chain.change_1d,
          chainTVLChange7d: tvlMetrics.chain.change_7d,
          chainTVLChange30d: tvlMetrics.chain.change_30d,
          tvlDominance: tvlMetrics.chain.dominance,
          tvlRank: tvlMetrics.chain.rank,
          tvlPeak: tvlMetrics.chain.peak,
          tvlHistory: JSON.stringify(tvlMetrics.chain.history),
          topProtocolsByTVL: JSON.stringify(tvlMetrics.protocols.top),
          protocolCategories: JSON.stringify(tvlMetrics.protocols.categoryDistribution),
          confidence: 0.9 // DeFiLlama data is highly reliable
        }
      });

      return dbTVLMetrics;
    } catch (error) {
      console.error('Error storing TVL metrics:', error);
      throw error;
    }
  }

  // Get latest TVL metrics from database
  async getLatestTVLMetrics(cryptoId: string) {
    try {
      const latestMetrics = await db.tVLMetric.findFirst({
        where: { cryptoId },
        orderBy: { timestamp: 'desc' }
      });

      if (!latestMetrics) {
        return null;
      }

      return {
        ...latestMetrics,
        tvlHistory: JSON.parse(latestMetrics.tvlHistory || '[]'),
        topProtocolsByTVL: JSON.parse(latestMetrics.topProtocolsByTVL || '[]'),
        protocolCategories: JSON.parse(latestMetrics.protocolCategories || '{}')
      };
    } catch (error) {
      console.error('Error getting latest TVL metrics:', error);
      throw error;
    }
  }

  // Bridge Volume
  async getBridgeVolume(): Promise<DeFiLlamaBridge[]> {
    try {
      const response = await fetch(`${this.baseUrl}/bridges`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching bridge volume:', error);
      throw error;
    }
  }

  // Get DeFi metrics for specific token
  async getTokenDeFiMetrics(coinGeckoId: string) {
    try {
      const [chains, protocols, stablecoins, dexVolume, fees, yields, bridges] = await Promise.all([
        this.getTVLByChain(),
        this.getTVLByProtocol(50),
        this.getStablecoins(),
        this.getDEXVolume(),
        this.getProtocolFees(),
        this.getYieldRates(50),
        this.getBridgeVolume()
      ]);

      // Map coinGeckoId to chain/protocol names
      const tokenChainMap: { [key: string]: string } = {
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

      const tokenProtocolMap: { [key: string]: string[] } = {
        'bitcoin': [],
        'ethereum': ['Lido', 'MakerDAO', 'Aave', 'Uniswap', 'Curve Finance', 'Compound'],
        'binancecoin': ['PancakeSwap', 'Venus', 'Alpaca Finance'],
        'solana': ['Marinade', 'Raydium', 'Orca', 'Solend'],
        'cardano': ['SundaeSwap', 'Minswap', 'WingRiders'],
        'polygon': ['Aave', 'QuickSwap', 'Curve Finance', 'Uniswap'],
        'avalanche-2': ['Trader Joe', 'Benqi', 'Pangolin'],
        'chainlink': ['Chainlink Staking'],
        'polkadot': ['Acala', 'Moonbeam', 'Astar'],
        'dogecoin': []
      };

      const chainName = tokenChainMap[coinGeckoId] || coinGeckoId;
      const protocolNames = tokenProtocolMap[coinGeckoId] || [];

      // Find chain-specific TVL
      const chainData = chains.find(c => 
        c.name === chainName || c.gecko_id === coinGeckoId || c.tokenSymbol?.toLowerCase() === coinGeckoId
      );

      // Find protocol-specific TVL
      const protocolData = protocols.filter(p => 
        protocolNames.some(name => 
          p.name.toLowerCase().includes(name.toLowerCase()) || 
          p.slug?.toLowerCase().includes(name.toLowerCase())
        )
      );

      // Calculate token-specific metrics
      const tokenTVL = chainData?.tvl || protocolData.reduce((sum, p) => sum + (p.tvl || 0), 0);
      
      // Get protocols for this token
      const tokenProtocols = protocolData.slice(0, 5);
      
      // Get related chains
      const relatedChains = chains
        .filter(c => c.tvl > 1000000000) // Only chains with > $1B TVL
        .slice(0, 5);

      // Get top protocols across all chains
      const topProtocols = protocols.slice(0, 5);

      return {
        token: {
          coinGeckoId,
          chainName,
          tvl: tokenTVL,
          protocols: tokenProtocols,
          relatedChains
        },
        totals: {
          totalTVL: chains.reduce((sum, chain) => sum + (chain.tvl || 0), 0),
          totalStablecoinMarketCap: stablecoins.reduce((sum, stablecoin) => sum + (stablecoin.marketCap || 0), 0),
          totalDEXVolume24h: dexVolume.reduce((sum, dex) => sum + (dex.volume24h || 0), 0),
          totalProtocolFees24h: fees.reduce((sum, fee) => sum + (fee.fees24h || 0), 0),
          avgYieldRate: this.calculateAverageYield(yields),
          totalBridgeVolume24h: bridges.reduce((sum, bridge) => sum + (bridge.volume24h || 0), 0)
        },
        topChains: relatedChains,
        topProtocols: topProtocols,
        topStablecoins: stablecoins.slice(0, 5),
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching token DeFi metrics:', error);
      throw error;
    }
  }

  // Helper method to calculate average yield rate
  private calculateAverageYield(yields: DeFiLlamaYield[]): number {
    const validYields = yields.filter(y => y.apy > 0 && y.apy < 1000);
    return validYields.length > 0 
      ? validYields.reduce((sum, y) => sum + y.apy, 0) / validYields.length 
      : 0;
  }

  // Store DeFi metrics in database
  async storeDeFiMetrics(coinGeckoId?: string) {
    try {
      let metrics;
      
      if (coinGeckoId) {
        metrics = await this.getTokenDeFiMetrics(coinGeckoId);
      } else {
        // Fallback to aggregated metrics for backward compatibility
        metrics = await this.getAggregatedDeFiMetrics();
      }
      
      // Store in database
      const defiMetrics = await db.deFiMetric.create({
        data: {
          totalTVL: metrics.totals.totalTVL,
          totalStablecoinMarketCap: metrics.totals.totalStablecoinMarketCap,
          totalDEXVolume24h: metrics.totals.totalDEXVolume24h,
          totalProtocolFees24h: metrics.totals.totalProtocolFees24h,
          avgYieldRate: metrics.totals.avgYieldRate,
          totalBridgeVolume24h: metrics.totals.totalBridgeVolume24h,
          topChains: JSON.stringify(metrics.topChains),
          topProtocols: JSON.stringify(metrics.topProtocols),
          topStablecoins: JSON.stringify(metrics.topStablecoins),
          tokenData: metrics.token ? JSON.stringify(metrics.token) : null,
          timestamp: new Date()
        }
      });

      return defiMetrics;
    } catch (error) {
      console.error('Error storing DeFi metrics:', error);
      throw error;
    }
  }

  // Get aggregated DeFi metrics for dashboard (backward compatibility)
  async getAggregatedDeFiMetrics() {
    try {
      const [chains, protocols, stablecoins, dexVolume, fees, yields, bridges] = await Promise.all([
        this.getTVLByChain(),
        this.getTVLByProtocol(20),
        this.getStablecoins(),
        this.getDEXVolume(),
        this.getProtocolFees(),
        this.getYieldRates(50),
        this.getBridgeVolume()
      ]);

      // Calculate total TVL across all chains
      const totalTVL = chains.reduce((sum, chain) => sum + (chain.tvl || 0), 0);
      
      // Calculate total stablecoin market cap
      const totalStablecoinMarketCap = stablecoins.reduce((sum, stablecoin) => sum + (stablecoin.marketCap || 0), 0);
      
      // Calculate total DEX volume 24h
      const totalDEXVolume24h = dexVolume.reduce((sum, dex) => sum + (dex.volume24h || 0), 0);
      
      // Calculate total protocol fees 24h
      const totalProtocolFees24h = fees.reduce((sum, fee) => sum + (fee.fees24h || 0), 0);
      
      // Calculate average yield rate
      const validYields = yields.filter(y => y.apy > 0 && y.apy < 1000); // Filter out outliers
      const avgYieldRate = validYields.length > 0 
        ? validYields.reduce((sum, y) => sum + y.apy, 0) / validYields.length 
        : 0;
      
      // Calculate total bridge volume 24h
      const totalBridgeVolume24h = bridges.reduce((sum, bridge) => sum + (bridge.volume24h || 0), 0);

      // Get top 5 chains by TVL
      const topChains = chains
        .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
        .slice(0, 5);

      // Get top 5 protocols by TVL
      const topProtocols = protocols
        .sort((a, b) => (b.tvl || 0) - (a.tvl || 0))
        .slice(0, 5);

      // Get top 5 stablecoins by market cap
      const topStablecoins = stablecoins
        .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
        .slice(0, 5);

      return {
        totals: {
          totalTVL,
          totalStablecoinMarketCap,
          totalDEXVolume24h,
          totalProtocolFees24h,
          avgYieldRate,
          totalBridgeVolume24h
        },
        topChains,
        topProtocols,
        topStablecoins,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching aggregated DeFi metrics:', error);
      throw error;
    }
  }

  // Get latest DeFi metrics from database
  async getLatestDeFiMetrics(coinGeckoId?: string) {
    try {
      const latestMetrics = await db.deFiMetric.findFirst({
        orderBy: { timestamp: 'desc' }
      });

      if (!latestMetrics) {
        return null;
      }

      const result = {
        ...latestMetrics,
        topChains: JSON.parse(latestMetrics.topChains || '[]'),
        topProtocols: JSON.parse(latestMetrics.topProtocols || '[]'),
        topStablecoins: JSON.parse(latestMetrics.topStablecoins || '[]')
      };

      // Add token data if available
      if (latestMetrics.tokenData) {
        result.token = JSON.parse(latestMetrics.tokenData);
      }

      return result;
    } catch (error) {
      console.error('Error getting latest DeFi metrics:', error);
      throw error;
    }
  }

  // Get latest token-specific DeFi metrics from database
  async getLatestTokenDeFiMetrics(coinGeckoId: string) {
    try {
      // For now, get the latest metrics and filter/token-specific data
      // In a production system, you might want to store token-specific records
      const latestMetrics = await this.getLatestDeFiMetrics();
      
      if (!latestMetrics) {
        return null;
      }

      // If we have token data and it matches the requested coin, return it
      if (latestMetrics.token && latestMetrics.token.coinGeckoId === coinGeckoId) {
        return latestMetrics;
      }

      // Otherwise, fetch fresh token-specific data
      try {
        const freshMetrics = await this.storeDeFiMetrics(coinGeckoId);
        return {
          ...freshMetrics,
          topChains: JSON.parse(freshMetrics.topChains || '[]'),
          topProtocols: JSON.parse(freshMetrics.topProtocols || '[]'),
          topStablecoins: JSON.parse(freshMetrics.topStablecoins || '[]'),
          token: freshMetrics.tokenData ? JSON.parse(freshMetrics.tokenData) : null
        };
      } catch (error) {
        console.error('Error fetching fresh token DeFi metrics:', error);
        return latestMetrics; // Fallback to existing data
      }
    } catch (error) {
      console.error('Error getting latest token DeFi metrics:', error);
      throw error;
    }
  }

  // TVL-specific methods for enhanced TVL metrics collection

  // Get historical TVL data for a specific chain
  async getHistoricalTVL(chainName: string, days: number = 30) {
    try {
      const response = await fetch(`${this.baseUrl}/v2/historicalChainTvl/${chainName}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // Return last 'days' of data
      return data.slice(-days);
    } catch (error) {
      console.error(`Error fetching historical TVL for ${chainName}:`, error);
      throw error;
    }
  }

  // Get TVL for a specific protocol
  async getProtocolTVL(protocolSlug: string) {
    try {
      const response = await fetch(`${this.baseUrl}/protocol/${protocolSlug}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error fetching protocol TVL for ${protocolSlug}:`, error);
      throw error;
    }
  }

  // Get TVL by category for a specific chain
  async getChainTVLByCategory(chainName: string) {
    try {
      const protocols = await this.getTVLByProtocol(200);
      const chainProtocols = protocols.filter(p => 
        p.chains.includes(chainName) || p.chainTvls[chainName] > 0
      );

      const categories: { [key: string]: number } = {};
      
      chainProtocols.forEach(protocol => {
        const category = protocol.category || 'Other';
        const tvl = protocol.chainTvls[chainName] || 0;
        categories[category] = (categories[category] || 0) + tvl;
      });

      return Object.entries(categories)
        .map(([name, tvl]) => ({ name, tvl }))
        .sort((a, b) => b.tvl - a.tvl);
    } catch (error) {
      console.error(`Error fetching chain TVL by category for ${chainName}:`, error);
      throw error;
    }
  }

  // Get top protocols by TVL for a specific chain
  async getTopProtocolsByChain(chainName: string, limit: number = 20) {
    try {
      const protocols = await this.getTVLByProtocol(200);
      const chainProtocols = protocols
        .filter(p => p.chains.includes(chainName) || p.chainTvls[chainName] > 0)
        .map(p => ({
          name: p.name,
          slug: p.slug,
          tvl: p.chainTvls[chainName] || 0,
          change_1d: p.change_1d,
          change_7d: p.change_7d,
          category: p.category,
          url: p.url,
          description: p.description
        }))
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, limit);

      return chainProtocols;
    } catch (error) {
      console.error(`Error fetching top protocols for ${chainName}:`, error);
      throw error;
    }
  }

  // Get TVL dominance for a chain
  async getChainTVLDominance(chainName: string) {
    try {
      const chains = await this.getTVLByChain();
      const chain = chains.find(c => c.name === chainName);
      
      if (!chain) {
        return 0;
      }

      const totalTVL = chains.reduce((sum, c) => sum + (c.tvl || 0), 0);
      return totalTVL > 0 ? (chain.tvl / totalTVL) * 100 : 0;
    } catch (error) {
      console.error(`Error fetching TVL dominance for ${chainName}:`, error);
      throw error;
    }
  }

  // Get TVL ranking for chains
  async getChainTVLRanking() {
    try {
      const chains = await this.getTVLByChain();
      return chains
        .filter(chain => chain.tvl > 0)
        .sort((a, b) => b.tvl - a.tvl)
        .map((chain, index) => ({
          rank: index + 1,
          name: chain.name,
          symbol: chain.tokenSymbol,
          tvl: chain.tvl,
          change_1d: chain.change_1d,
          change_7d: chain.change_7d,
          change_30d: chain.change_30d
        }));
    } catch (error) {
      console.error('Error fetching chain TVL ranking:', error);
      throw error;
    }
  }

  // Get TVL trends and analytics
  async getTVLTrends(chainName: string) {
    try {
      const historicalData = await this.getHistoricalTVL(chainName, 90);
      
      if (historicalData.length < 2) {
        return {
          trend: 'insufficient_data',
          change_7d: 0,
          change_30d: 0,
          volatility: 0,
          support_level: 0,
          resistance_level: 0
        };
      }

      const currentTVL = historicalData[historicalData.length - 1].tvl;
      const previous7d = historicalData[Math.max(0, historicalData.length - 8)].tvl;
      const previous30d = historicalData[Math.max(0, historicalData.length - 31)].tvl;

      const change_7d = previous7d > 0 ? ((currentTVL - previous7d) / previous7d) * 100 : 0;
      const change_30d = previous30d > 0 ? ((currentTVL - previous30d) / previous30d) * 100 : 0;

      // Calculate volatility (standard deviation of daily changes)
      const dailyChanges = [];
      for (let i = 1; i < historicalData.length; i++) {
        const change = historicalData[i].tvl - historicalData[i - 1].tvl;
        dailyChanges.push(change);
      }

      const mean = dailyChanges.reduce((sum, change) => sum + change, 0) / dailyChanges.length;
      const variance = dailyChanges.reduce((sum, change) => sum + Math.pow(change - mean, 2), 0) / dailyChanges.length;
      const volatility = Math.sqrt(variance);

      // Simple support and resistance levels
      const tvlValues = historicalData.map(d => d.tvl);
      const support_level = Math.min(...tvlValues.slice(-30));
      const resistance_level = Math.max(...tvlValues.slice(-30));

      // Determine trend
      let trend = 'stable';
      if (change_7d > 5) trend = 'strong_growth';
      else if (change_7d > 2) trend = 'growth';
      else if (change_7d < -5) trend = 'strong_decline';
      else if (change_7d < -2) trend = 'decline';

      return {
        trend,
        change_7d,
        change_30d,
        volatility,
        support_level,
        resistance_level,
        current_tvl: currentTVL,
        data_points: historicalData.length
      };
    } catch (error) {
      console.error(`Error fetching TVL trends for ${chainName}:`, error);
      throw error;
    }
  }

  // Get comprehensive TVL analytics for a chain
  async getChainTVLAnalytics(chainName: string) {
    try {
      const [chains, protocols, categories, ranking, trends, dominance] = await Promise.all([
        this.getTVLByChain(),
        this.getTopProtocolsByChain(chainName, 50),
        this.getChainTVLByCategory(chainName),
        this.getChainTVLRanking(),
        this.getTVLTrends(chainName),
        this.getChainTVLDominance(chainName)
      ]);

      const chain = chains.find(c => c.name === chainName);

      return {
        chain: chain ? {
          name: chain.name,
          symbol: chain.tokenSymbol,
          tvl: chain.tvl,
          change_1d: chain.change_1d,
          change_7d: chain.change_7d,
          change_30d: chain.change_30d
        } : null,
        dominance,
        ranking: ranking.find(r => r.name === chainName)?.rank || 0,
        trends,
        top_protocols: protocols.slice(0, 10),
        categories: categories.slice(0, 10),
        total_protocols: protocols.length,
        analytics: {
          tvl_concentration: this.calculateTVLConcentration(protocols),
          category_diversity: categories.length,
          protocol_growth: this.calculateProtocolGrowth(protocols)
        }
      };
    } catch (error) {
      console.error(`Error fetching TVL analytics for ${chainName}:`, error);
      throw error;
    }
  }

  // Helper method to calculate TVL concentration (HHI index)
  private calculateTVLConcentration(protocols: any[]): number {
    if (protocols.length === 0) return 0;
    
    const totalTVL = protocols.reduce((sum, p) => sum + (p.tvl || 0), 0);
    if (totalTVL === 0) return 0;

    const hhi = protocols.reduce((sum, p) => {
      const marketShare = (p.tvl || 0) / totalTVL;
      return sum + Math.pow(marketShare, 2);
    }, 0);

    return hhi * 10000; // Return HHI index (0-10000)
  }

  // Helper method to calculate protocol growth
  private calculateProtocolGrowth(protocols: any[]): number {
    if (protocols.length === 0) return 0;
    
    const growingProtocols = protocols.filter(p => p.change_7d > 0).length;
    return (growingProtocols / protocols.length) * 100;
  }
}