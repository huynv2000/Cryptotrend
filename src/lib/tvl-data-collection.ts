import { db } from '@/lib/db';
import { DeFiLlamaService } from '@/lib/defillama-service';
import { DataValidationService } from '@/lib/data-validation';
import { TVLService } from '@/lib/tvl-service';
import { AdvancedTVLMetricsService } from '@/lib/advanced-tvl-metrics';

export interface TVLCollectionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface ComprehensiveTVLData {
  basic: {
    chainTVL: number;
    chainTVLChange24h: number;
    chainTVLChange7d: number;
    chainTVLChange30d: number;
    tvlDominance: number;
    tvlRank: number;
    tvlPeak: number;
    marketCapTVLRatio: number;
  };
  protocols: {
    total: number;
    top: Array<{
      name: string;
      tvl: number;
      change_1d: number;
      category: string;
    }>;
    categoryDistribution: { [key: string]: number };
  };
  advanced: {
    tvlVelocity: number;
    volumeToTVLRatio: number;
    turnoverRate: number;
    liquidityEfficiency: number;
    feeToTVLRatio: number;
    revenueToTVLRatio: number;
    roi: number;
    capitalEfficiency: number;
  };
  historical: Array<{
    date: string;
    tvl: number;
    dominance: number;
  }>;
  marketContext: {
    totalMarketTVL: number;
    topChains: Array<{
      name: string;
      tvl: number;
      dominance: number;
    }>;
    stablecoinMarketCap: number;
    dexVolume24h: number;
    avgYieldRate: number;
  };
  metadata: {
    lastUpdated: string;
    dataSources: string[];
    confidence: number;
    refreshInterval: number;
  };
}

export class TVLDataCollectionService {
  private static instance: TVLDataCollectionService;
  private defiLlamaService: DeFiLlamaService;
  private dataValidationService: DataValidationService;
  private tvlService: TVLService;
  private advancedTVLService: AdvancedTVLMetricsService;
  private cache = new Map<string, { data: ComprehensiveTVLData; timestamp: number; ttl: number }>();

  static getInstance(): TVLDataCollectionService {
    if (!TVLDataCollectionService.instance) {
      TVLDataCollectionService.instance = new TVLDataCollectionService();
    }
    return TVLDataCollectionService.instance;
  }

  constructor() {
    this.defiLlamaService = DeFiLlamaService.getInstance();
    this.dataValidationService = DataValidationService.getInstance();
    this.tvlService = TVLService.getInstance();
    this.advancedTVLService = AdvancedTVLMetricsService.getInstance();
  }

  // Collect comprehensive TVL data for a specific cryptocurrency
  async collectComprehensiveTVLData(coinGeckoId: string, forceRefresh: boolean = false): Promise<TVLCollectionResult> {
    try {
      console.log(`Collecting comprehensive TVL data for ${coinGeckoId}`);

      // Check cache first
      const cacheKey = `comprehensive-tvl-${coinGeckoId}`;
      const now = Date.now();
      const cached = this.cache.get(cacheKey);
      
      if (!forceRefresh && cached && (now - cached.timestamp) < cached.ttl) {
        console.log(`Using cached comprehensive TVL data for ${coinGeckoId}`);
        return {
          success: true,
          message: 'Comprehensive TVL data retrieved from cache',
          data: cached.data
        };
      }

      // Get cryptocurrency info
      const crypto = await db.cryptocurrency.findFirst({
        where: { coinGeckoId }
      });

      if (!crypto) {
        return {
          success: false,
          message: 'Cryptocurrency not found',
          error: `Cryptocurrency with CoinGecko ID ${coinGeckoId} not found`
        };
      }

      // Collect all TVL data in parallel
      const [
        basicTVL,
        advancedTVL,
        defiContext,
        globalTVL
      ] = await Promise.all([
        this.defiLlamaService.getBlockchainTVLMetrics(coinGeckoId),
        this.advancedTVLService.getAdvancedTVLMetrics(coinGeckoId),
        this.defiLlamaService.getTokenDeFiMetrics(coinGeckoId),
        this.tvlService.getGlobalTVL()
      ]);

      // Process and structure the data
      const comprehensiveData: ComprehensiveTVLData = {
        basic: {
          chainTVL: basicTVL?.chain?.tvl || 0,
          chainTVLChange24h: basicTVL?.chain?.change_1d || 0,
          chainTVLChange7d: basicTVL?.chain?.change_7d || 0,
          chainTVLChange30d: basicTVL?.chain?.change_30d || 0,
          tvlDominance: basicTVL?.chain?.dominance || 0,
          tvlRank: basicTVL?.chain?.rank || 0,
          tvlPeak: basicTVL?.chain?.peak || 0,
          marketCapTVLRatio: this.calculateMarketCapTVLRatio(basicTVL?.chain?.tvl || 0, crypto.id)
        },
        protocols: {
          total: basicTVL?.protocols?.total || 0,
          top: (basicTVL?.protocols?.top || []).slice(0, 10).map(p => ({
            name: p.name,
            tvl: p.tvl,
            change_1d: p.change_1d || 0,
            category: p.category || 'Other'
          })),
          categoryDistribution: basicTVL?.protocols?.categoryDistribution || {}
        },
        advanced: {
          tvlVelocity: advancedTVL?.tvlVelocity?.velocity || 0,
          volumeToTVLRatio: advancedTVL?.tvlVelocity?.volumeToTVLRatio || 0,
          turnoverRate: advancedTVL?.tvlVelocity?.turnoverRate || 0,
          liquidityEfficiency: advancedTVL?.tvlVelocity?.liquidityEfficiency || 0,
          feeToTVLRatio: advancedTVL?.tvlEfficiency?.feeToTVLRatio || 0,
          revenueToTVLRatio: advancedTVL?.tvlEfficiency?.revenueToTVLRatio || 0,
          roi: advancedTVL?.tvlEfficiency?.roi || 0,
          capitalEfficiency: advancedTVL?.tvlEfficiency?.capitalEfficiency || 0
        },
        historical: (basicTVL?.chain?.history || []).slice(-30).map(h => ({
          date: h.date,
          tvl: h.tvl,
          dominance: this.calculateDominanceFromTVL(h.tvl, globalTVL.totalTVL)
        })),
        marketContext: {
          totalMarketTVL: globalTVL.totalTVL || 0,
          topChains: (globalTVL.topChains || []).slice(0, 10).map(c => ({
            name: c.name,
            tvl: c.tvl || 0,
            dominance: globalTVL.totalTVL > 0 ? (c.tvl || 0) / globalTVL.totalTVL * 100 : 0
          })),
          stablecoinMarketCap: defiContext?.totals?.totalStablecoinMarketCap || 0,
          dexVolume24h: defiContext?.totals?.totalDEXVolume24h || 0,
          avgYieldRate: defiContext?.totals?.avgYieldRate || 0
        },
        metadata: {
          lastUpdated: new Date().toISOString(),
          dataSources: ['DeFiLlama', 'CoinGecko', 'Custom Calculations'],
          confidence: this.calculateDataConfidence(basicTVL, advancedTVL),
          refreshInterval: 300000 // 5 minutes
        }
      };

      // Validate the comprehensive data
      const validationResult = await this.validateComprehensiveTVLData(comprehensiveData);
      if (!validationResult.isValid) {
        console.warn(`Comprehensive TVL data validation failed for ${coinGeckoId}:`, validationResult.errors);
        return {
          success: false,
          message: 'Comprehensive TVL data validation failed',
          error: validationResult.errors.join(', ')
        };
      }

      // Cache the result
      this.cache.set(cacheKey, { 
        data: comprehensiveData, 
        timestamp: now, 
        ttl: comprehensiveData.metadata.refreshInterval 
      });

      // Store in database for historical purposes
      await this.storeComprehensiveTVLData(crypto.id, comprehensiveData);

      console.log(`Successfully collected comprehensive TVL data for ${coinGeckoId}: $${comprehensiveData.basic.chainTVL.toLocaleString()}`);
      
      return {
        success: true,
        message: 'Comprehensive TVL data collected successfully',
        data: comprehensiveData
      };

    } catch (error) {
      console.error(`Error collecting comprehensive TVL data for ${coinGeckoId}:`, error);
      return {
        success: false,
        message: 'Failed to collect comprehensive TVL data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Store comprehensive TVL data in database
  private async storeComprehensiveTVLData(cryptoId: string, data: ComprehensiveTVLData) {
    try {
      // Store basic TVL metrics
      await db.tVLMetric.create({
        data: {
          cryptoId,
          totalTVL: data.marketContext.totalMarketTVL,
          chainTVL: data.basic.chainTVL,
          tvlChange24h: data.basic.chainTVLChange24h,
          tvlChange7d: data.basic.chainTVLChange7d,
          tvlChange30d: data.basic.chainTVLChange30d,
          dominance: data.basic.tvlDominance,
          marketCapTVLRatio: data.basic.marketCapTVLRatio,
          defiProtocols: JSON.stringify(data.protocols.top),
          protocolDistribution: JSON.stringify(data.protocols.categoryDistribution),
          topChainsByTVL: JSON.stringify(data.marketContext.topChains),
          tvlHistory: JSON.stringify(data.historical),
          dataSources: JSON.stringify(data.metadata.dataSources),
          confidence: data.metadata.confidence
        }
      });

      // Store advanced TVL metrics
      await db.advancedTVLMetric.create({
        data: {
          cryptoId,
          tvlVelocity: data.advanced.tvlVelocity,
          volumeToTVLRatio: data.advanced.volumeToTVLRatio,
          turnoverRate: data.advanced.turnoverRate,
          avgHoldingPeriod: data.advanced.tvlVelocity > 0 ? 365 / data.advanced.tvlVelocity : 0,
          liquidityEfficiency: data.advanced.liquidityEfficiency,
          feeToTVLRatio: data.advanced.feeToTVLRatio,
          revenueToTVLRatio: data.advanced.revenueToTVLRatio,
          roi: data.advanced.roi,
          capitalEfficiency: data.advanced.capitalEfficiency,
          protocolYield: data.advanced.feeToTVLRatio,
          economicOutput: data.advanced.revenueToTVLRatio * data.basic.chainTVL / 100,
          combinedScore: (data.advanced.liquidityEfficiency + data.advanced.capitalEfficiency) / 2,
          marketHealth: this.determineMarketHealth(data),
          recommendations: JSON.stringify(this.generateRecommendations(data)),
          confidence: data.metadata.confidence
        }
      });

    } catch (error) {
      console.error('Error storing comprehensive TVL data:', error);
      // Don't throw here - we don't want to fail the whole operation if storage fails
    }
  }

  // Helper methods
  private calculateMarketCapTVLRatio(tvl: number, cryptoId: string): number {
    // This would need to fetch current market cap from price data
    // For now, return a placeholder
    return tvl > 0 ? 0.1 : 0; // Placeholder: 10% ratio
  }

  private calculateDominanceFromTVL(tvl: number, totalTVL: number): number {
    return totalTVL > 0 ? (tvl / totalTVL) * 100 : 0;
  }

  private calculateDataConfidence(basicTVL: any, advancedTVL: any): number {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on data quality
    if (basicTVL?.chain?.tvl > 0) confidence += 0.2;
    if (basicTVL?.protocols?.top?.length > 0) confidence += 0.1;
    if (advancedTVL?.tvlVelocity?.velocity > 0) confidence += 0.1;
    if (advancedTVL?.tvlEfficiency?.roi > 0) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private determineMarketHealth(data: ComprehensiveTVLData): 'excellent' | 'good' | 'fair' | 'poor' {
    const score = (data.advanced.liquidityEfficiency + data.advanced.capitalEfficiency) / 2;
    
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'poor';
  }

  private generateRecommendations(data: ComprehensiveTVLData): string[] {
    const recommendations: string[] = [];
    
    if (data.advanced.liquidityEfficiency < 50) {
      recommendations.push('Consider increasing liquidity provision opportunities');
    }
    
    if (data.advanced.capitalEfficiency < 30) {
      recommendations.push('Explore higher-yield DeFi protocols');
    }
    
    if (data.basic.chainTVLChange24h < -10) {
      recommendations.push('Monitor TVL outflows - potential risk indicator');
    }
    
    if (data.advanced.roi > 20) {
      recommendations.push('Current yields are attractive - consider staking opportunities');
    }
    
    return recommendations;
  }

  // Validate comprehensive TVL data
  private async validateComprehensiveTVLData(data: ComprehensiveTVLData): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validate basic metrics
    if (data.basic.chainTVL < 0) {
      errors.push('Chain TVL cannot be negative');
    }

    if (data.basic.tvlDominance < 0 || data.basic.tvlDominance > 100) {
      errors.push('TVL dominance must be between 0 and 100');
    }

    // Validate advanced metrics
    if (data.advanced.tvlVelocity < 0) {
      errors.push('TVL velocity cannot be negative');
    }

    if (data.advanced.liquidityEfficiency < 0 || data.advanced.liquidityEfficiency > 100) {
      errors.push('Liquidity efficiency must be between 0 and 100');
    }

    // Validate market context
    if (data.marketContext.totalMarketTVL < 0) {
      errors.push('Total market TVL cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
  async collectTVLData(cryptoId: string, coinGeckoId: string): Promise<TVLCollectionResult> {
    try {
      console.log(`Collecting TVL data for ${coinGeckoId} (cryptoId: ${cryptoId})`);

      // Validate inputs
      if (!cryptoId || !coinGeckoId) {
        return {
          success: false,
          message: 'Invalid input parameters',
          error: 'cryptoId and coinGeckoId are required'
        };
      }

      // Check if we have recent data (less than 1 hour old)
      const recentData = await db.tVLMetric.findFirst({
        where: {
          cryptoId,
          timestamp: {
            gte: new Date(Date.now() - 60 * 60 * 1000) // 1 hour ago
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      if (recentData) {
        console.log(`Using recent TVL data for ${coinGeckoId} from ${recentData.timestamp}`);
        return {
          success: true,
          message: 'Using cached TVL data',
          data: recentData
        };
      }

      // Fetch fresh TVL data from DeFiLlama
      console.log(`Fetching fresh TVL data for ${coinGeckoId} from DeFiLlama`);
      const tvlMetrics = await this.defiLlamaService.storeTVLMetrics(coinGeckoId, cryptoId);

      if (!tvlMetrics) {
        return {
          success: false,
          message: 'Failed to fetch TVL data',
          error: 'DeFiLlama service returned null data'
        };
      }

      // Validate the collected data
      const validationResult = await this.validateTVLData(tvlMetrics);
      if (!validationResult.isValid) {
        console.warn(`TVL data validation failed for ${coinGeckoId}:`, validationResult.errors);
        return {
          success: false,
          message: 'TVL data validation failed',
          error: validationResult.errors.join(', ')
        };
      }

      console.log(`Successfully collected TVL data for ${coinGeckoId}: $${(tvlMetrics.chainTVL || 0).toLocaleString()}`);
      
      return {
        success: true,
        message: 'TVL data collected successfully',
        data: tvlMetrics
      };

    } catch (error) {
      console.error(`Error collecting TVL data for ${coinGeckoId}:`, error);
      return {
        success: false,
        message: 'Failed to collect TVL data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Collect TVL data for all active cryptocurrencies
  async collectAllTVLData(): Promise<TVLCollectionResult[]> {
    try {
      console.log('Starting TVL data collection for all active cryptocurrencies');

      // Get all active cryptocurrencies
      const activeCryptos = await db.cryptocurrency.findMany({
        where: { isActive: true },
        select: {
          id: true,
          coinGeckoId: true,
          symbol: true,
          name: true
        }
      });

      console.log(`Found ${activeCryptos.length} active cryptocurrencies`);

      const results: TVLCollectionResult[] = [];

      // Collect TVL data for each cryptocurrency
      for (const crypto of activeCryptos) {
        try {
          const result = await this.collectTVLData(crypto.id, crypto.coinGeckoId);
          results.push({
            ...result,
            data: result.data ? {
              ...result.data,
              cryptoSymbol: crypto.symbol,
              cryptoName: crypto.name
            } : undefined
          });

          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error collecting TVL data for ${crypto.coinGeckoId}:`, error);
          results.push({
            success: false,
            message: `Failed to collect TVL data for ${crypto.coinGeckoId}`,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`TVL data collection completed: ${successCount}/${activeCryptos.length} successful`);

      return results;

    } catch (error) {
      console.error('Error in collectAllTVLData:', error);
      return [{
        success: false,
        message: 'Failed to collect TVL data for all cryptocurrencies',
        error: error instanceof Error ? error.message : 'Unknown error'
      }];
    }
  }

  // Get TVL data for a specific cryptocurrency
  async getTVLData(cryptoId: string): Promise<TVLCollectionResult> {
    try {
      // Get the latest TVL data from database
      const latestData = await this.defiLlamaService.getLatestTVLMetrics(cryptoId);

      if (!latestData) {
        return {
          success: false,
          message: 'No TVL data available',
          error: 'No TVL data found in database'
        };
      }

      return {
        success: true,
        message: 'TVL data retrieved successfully',
        data: latestData
      };

    } catch (error) {
      console.error(`Error getting TVL data for cryptoId ${cryptoId}:`, error);
      return {
        success: false,
        message: 'Failed to get TVL data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get TVL summary statistics
  async getTVLSummary(): Promise<TVLCollectionResult> {
    try {
      // Get the latest TVL data for all cryptocurrencies
      const latestTVLData = await db.tVLMetric.findMany({
        orderBy: { timestamp: 'desc' },
        distinct: ['cryptoId'],
        include: {
          crypto: {
            select: {
              id: true,
              symbol: true,
              name: true,
              coinGeckoId: true
            }
          }
        }
      });

      if (!latestTVLData || latestTVLData.length === 0) {
        return {
          success: false,
          message: 'No TVL data available',
          error: 'No TVL data found in database'
        };
      }

      // Calculate summary statistics
      const totalTVL = latestTVLData.reduce((sum, data) => sum + (data.chainTVL || 0), 0);
      const totalMarketCap = latestTVLData.reduce((sum, data) => {
        // This would need to be fetched from price data
        return sum + 0; // Placeholder
      }, 0);

      const topChains = latestTVLData
        .sort((a, b) => (b.chainTVL || 0) - (a.chainTVL || 0))
        .slice(0, 10)
        .map(data => ({
          symbol: data.crypto.symbol,
          name: data.crypto.name,
          tvl: data.chainTVL || 0,
          change24h: data.chainTVLChange24h || 0,
          dominance: data.tvlDominance || 0
        }));

      const summary = {
        totalTVL,
        totalMarketCap,
        tvlToMarketCapRatio: totalMarketCap > 0 ? totalTVL / totalMarketCap : 0,
        chainsCount: latestTVLData.length,
        topChains,
        lastUpdated: new Date().toISOString()
      };

      return {
        success: true,
        message: 'TVL summary retrieved successfully',
        data: summary
      };

    } catch (error) {
      console.error('Error getting TVL summary:', error);
      return {
        success: false,
        message: 'Failed to get TVL summary',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Validate TVL data
  private async validateTVLData(data: any): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check required fields
    if (!data.chainTVL && data.chainTVL !== 0) {
      errors.push('chainTVL is required');
    }

    if (data.chainTVL < 0) {
      errors.push('chainTVL cannot be negative');
    }

    // Check for reasonable values
    if (data.chainTVL > 1e15) { // More than $1 quadrillion
      errors.push('chainTVL seems unreasonably high');
    }

    // Check percentage changes
    if (data.chainTVLChange24h && Math.abs(data.chainTVLChange24h) > 1000) {
      errors.push('24h change percentage seems unreasonable');
    }

    if (data.chainTVLChange7d && Math.abs(data.chainTVLChange7d) > 2000) {
      errors.push('7d change percentage seems unreasonable');
    }

    if (data.chainTVLChange30d && Math.abs(data.chainTVLChange30d) > 5000) {
      errors.push('30d change percentage seems unreasonable');
    }

    // Check dominance percentage
    if (data.tvlDominance && (data.tvlDominance < 0 || data.tvlDominance > 100)) {
      errors.push('dominance percentage must be between 0 and 100');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Clean up old TVL data (keep last 30 days)
  async cleanupOldData(): Promise<TVLCollectionResult> {
    try {
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

      const deletedCount = await db.tVLMetric.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });

      console.log(`Cleaned up ${deletedCount.count} old TVL records`);

      return {
        success: true,
        message: `Cleaned up ${deletedCount.count} old TVL records`,
        data: { deletedCount: deletedCount.count }
      };

    } catch (error) {
      console.error('Error cleaning up old TVL data:', error);
      return {
        success: false,
        message: 'Failed to clean up old TVL data',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}