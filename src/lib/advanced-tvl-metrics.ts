// Advanced TVL Metrics Service
// Implements TVL Velocity and TVL Efficiency metrics

import { db } from '@/lib/db';
import { DeFiLlamaService } from './defillama-service';
import { TVLService } from './tvl-service';

interface TVLVelocityData {
  velocity: number;
  volumeToTVLRatio: number;
  turnoverRate: number;
  avgHoldingPeriod: number;
  liquidityEfficiency: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
}

interface TVLEfficiencyData {
  feeToTVLRatio: number;
  revenueToTVLRatio: number;
  roi: number;
  capitalEfficiency: number;
  protocolYield: number;
  economicOutput: number;
  trend: 'improving' | 'declining' | 'stable';
  confidence: number;
}

interface AdvancedTVLMetrics {
  tvlVelocity: TVLVelocityData;
  tvlEfficiency: TVLEfficiencyData;
  combinedScore: number;
  marketHealth: 'excellent' | 'good' | 'fair' | 'poor';
  recommendations: string[];
  lastUpdated: Date;
}

export class AdvancedTVLMetricsService {
  private static instance: AdvancedTVLMetricsService;
  private defiLlamaService: DeFiLlamaService;
  private tvlService: TVLService;
  private cache = new Map<string, { data: AdvancedTVLMetrics; timestamp: number; ttl: number }>();

  static getInstance(): AdvancedTVLMetricsService {
    if (!AdvancedTVLMetricsService.instance) {
      AdvancedTVLMetricsService.instance = new AdvancedTVLMetricsService();
    }
    return AdvancedTVLMetricsService.instance;
  }

  private constructor() {
    this.defiLlamaService = DeFiLlamaService.getInstance();
    this.tvlService = TVLService.getInstance();
  }

  // Calculate TVL Velocity - how quickly TVL circulates within the ecosystem
  async calculateTVLVelocity(coinGeckoId: string): Promise<TVLVelocityData> {
    try {
      // Get current TVL data
      const tvlData = await this.tvlService.getBlockchainTVL(coinGeckoId);
      const globalTVL = await this.tvlService.getGlobalTVL();
      
      // Get protocol fees and volume data
      const [protocolFees, dexVolume] = await Promise.all([
        this.defiLlamaService.getProtocolFees(),
        this.defiLlamaService.getDEXVolume()
      ]);

      // Get chain-specific data
      const chainName = this.mapCoinGeckoToChain(coinGeckoId);
      const chainProtocols = protocolFees.filter(p => 
        p.name.toLowerCase().includes(chainName.toLowerCase()) ||
        this.isProtocolRelevantToChain(p.name, chainName)
      );
      
      const chainDEXVolume = dexVolume.filter(d => 
        d.name.toLowerCase().includes(chainName.toLowerCase()) ||
        this.isDEXRelevantToChain(d.name, chainName)
      );

      // Calculate total fees and volume for the chain
      const totalFees24h = chainProtocols.reduce((sum, p) => sum + (p.fees24h || 0), 0);
      const totalVolume24h = chainDEXVolume.reduce((sum, d) => sum + (d.volume24h || 0), 0);
      
      // Calculate velocity metrics
      const velocity = tvlData.chainTVL > 0 ? (totalVolume24h * 365) / tvlData.chainTVL : 0;
      const volumeToTVLRatio = tvlData.chainTVL > 0 ? totalVolume24h / tvlData.chainTVL : 0;
      const turnoverRate = volumeToTVLRatio * 100; // Convert to percentage
      const avgHoldingPeriod = velocity > 0 ? 365 / velocity : 0; // In days
      const liquidityEfficiency = this.calculateLiquidityEfficiency(totalVolume24h, tvlData.chainTVL);
      
      // Determine trend based on historical data
      const trend = await this.calculateVelocityTrend(coinGeckoId);
      
      // Calculate confidence based on data quality
      const confidence = this.calculateVelocityConfidence(
        tvlData.chainTVL,
        totalVolume24h,
        totalFees24h,
        chainProtocols.length
      );

      return {
        velocity: Math.round(velocity * 100) / 100,
        volumeToTVLRatio: Math.round(volumeToTVLRatio * 10000) / 10000,
        turnoverRate: Math.round(turnoverRate * 100) / 100,
        avgHoldingPeriod: Math.round(avgHoldingPeriod * 100) / 100,
        liquidityEfficiency: Math.round(liquidityEfficiency * 100) / 100,
        trend,
        confidence: Math.round(confidence * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating TVL velocity:', error);
      throw error;
    }
  }

  // Calculate TVL Efficiency - ratio of TVL to economic output
  async calculateTVLEfficiency(coinGeckoId: string): Promise<TVLEfficiencyData> {
    try {
      // Get current TVL data
      const tvlData = await this.tvlService.getBlockchainTVL(coinGeckoId);
      
      // Get protocol fees and revenue data
      const protocolFees = await this.defiLlamaService.getProtocolFees();
      
      // Get chain-specific data
      const chainName = this.mapCoinGeckoToChain(coinGeckoId);
      const chainProtocols = protocolFees.filter(p => 
        p.name.toLowerCase().includes(chainName.toLowerCase()) ||
        this.isProtocolRelevantToChain(p.name, chainName)
      );

      // Calculate total fees and revenue for the chain
      const totalFees24h = chainProtocols.reduce((sum, p) => sum + (p.fees24h || 0), 0);
      const totalRevenue24h = chainProtocols.reduce((sum, p) => sum + (p.revenue24h || 0), 0);
      
      // Calculate annualized values
      const annualFees = totalFees24h * 365;
      const annualRevenue = totalRevenue24h * 365;
      
      // Calculate efficiency metrics
      const feeToTVLRatio = tvlData.chainTVL > 0 ? (annualFees / tvlData.chainTVL) * 100 : 0;
      const revenueToTVLRatio = tvlData.chainTVL > 0 ? (annualRevenue / tvlData.chainTVL) * 100 : 0;
      const roi = tvlData.chainTVL > 0 ? (annualRevenue / tvlData.chainTVL) * 100 : 0;
      const capitalEfficiency = this.calculateCapitalEfficiency(annualRevenue, tvlData.chainTVL);
      const protocolYield = tvlData.chainTVL > 0 ? (annualFees / tvlData.chainTVL) * 100 : 0;
      const economicOutput = annualRevenue;
      
      // Determine trend based on historical data
      const trend = await this.calculateEfficiencyTrend(coinGeckoId);
      
      // Calculate confidence based on data quality
      const confidence = this.calculateEfficiencyConfidence(
        tvlData.chainTVL,
        totalFees24h,
        totalRevenue24h,
        chainProtocols.length
      );

      return {
        feeToTVLRatio: Math.round(feeToTVLRatio * 100) / 100,
        revenueToTVLRatio: Math.round(revenueToTVLRatio * 100) / 100,
        roi: Math.round(roi * 100) / 100,
        capitalEfficiency: Math.round(capitalEfficiency * 100) / 100,
        protocolYield: Math.round(protocolYield * 100) / 100,
        economicOutput: Math.round(economicOutput * 100) / 100,
        trend,
        confidence: Math.round(confidence * 100) / 100
      };
    } catch (error) {
      console.error('Error calculating TVL efficiency:', error);
      throw error;
    }
  }

  // Get comprehensive advanced TVL metrics
  async getAdvancedTVLMetrics(coinGeckoId: string): Promise<AdvancedTVLMetrics> {
    const cacheKey = `advanced-tvl-${coinGeckoId}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if not expired (1 hour cache)
    if (cached && (now - cached.timestamp) < 3600000) {
      return cached.data;
    }

    try {
      const [tvlVelocity, tvlEfficiency] = await Promise.all([
        this.calculateTVLVelocity(coinGeckoId),
        this.calculateTVLEfficiency(coinGeckoId)
      ]);

      // Calculate combined score (weighted average)
      const combinedScore = this.calculateCombinedScore(tvlVelocity, tvlEfficiency);
      
      // Determine market health
      const marketHealth = this.determineMarketHealth(combinedScore, tvlVelocity, tvlEfficiency);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(tvlVelocity, tvlEfficiency, marketHealth);

      const metrics: AdvancedTVLMetrics = {
        tvlVelocity,
        tvlEfficiency,
        combinedScore,
        marketHealth,
        recommendations,
        lastUpdated: new Date()
      };

      // Cache the result
      this.cache.set(cacheKey, { data: metrics, timestamp: now, ttl: 3600000 });

      return metrics;
    } catch (error) {
      console.error('Error getting advanced TVL metrics:', error);
      throw error;
    }
  }

  // Store advanced TVL metrics in database
  async storeAdvancedTVLMetrics(coinGeckoId: string) {
    try {
      const crypto = await db.cryptocurrency.findFirst({
        where: { coinGeckoId }
      });

      if (!crypto) {
        throw new Error(`Cryptocurrency not found: ${coinGeckoId}`);
      }

      const metrics = await this.getAdvancedTVLMetrics(coinGeckoId);

      // Store in database
      const advancedMetrics = await db.advancedTVLMetric.create({
        data: {
          cryptoId: crypto.id,
          tvlVelocity: metrics.tvlVelocity.velocity,
          volumeToTVLRatio: metrics.tvlVelocity.volumeToTVLRatio,
          turnoverRate: metrics.tvlVelocity.turnoverRate,
          avgHoldingPeriod: metrics.tvlVelocity.avgHoldingPeriod,
          liquidityEfficiency: metrics.tvlVelocity.liquidityEfficiency,
          feeToTVLRatio: metrics.tvlEfficiency.feeToTVLRatio,
          revenueToTVLRatio: metrics.tvlEfficiency.revenueToTVLRatio,
          roi: metrics.tvlEfficiency.roi,
          capitalEfficiency: metrics.tvlEfficiency.capitalEfficiency,
          protocolYield: metrics.tvlEfficiency.protocolYield,
          economicOutput: metrics.tvlEfficiency.economicOutput,
          combinedScore: metrics.combinedScore,
          marketHealth: metrics.marketHealth,
          recommendations: JSON.stringify(metrics.recommendations),
          confidence: Math.min(metrics.tvlVelocity.confidence, metrics.tvlEfficiency.confidence),
          timestamp: new Date()
        }
      });

      return advancedMetrics;
    } catch (error) {
      console.error('Error storing advanced TVL metrics:', error);
      throw error;
    }
  }

  // Get latest advanced TVL metrics from database
  async getLatestAdvancedTVLMetrics(coinGeckoId: string) {
    try {
      const crypto = await db.cryptocurrency.findFirst({
        where: { coinGeckoId }
      });

      if (!crypto) {
        return null;
      }

      const latestMetrics = await db.advancedTVLMetric.findFirst({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' }
      });

      if (!latestMetrics) {
        return null;
      }

      return {
        ...latestMetrics,
        recommendations: JSON.parse(latestMetrics.recommendations || '[]')
      };
    } catch (error) {
      console.error('Error getting latest advanced TVL metrics:', error);
      throw error;
    }
  }

  // Helper methods
  private mapCoinGeckoToChain(coinGeckoId: string): string {
    const mapping: { [key: string]: string } = {
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

    return mapping[coinGeckoId] || coinGeckoId;
  }

  private isProtocolRelevantToChain(protocolName: string, chainName: string): boolean {
    const protocolChainMap: { [key: string]: string[] } = {
      'Ethereum': ['Lido', 'MakerDAO', 'Aave', 'Uniswap', 'Curve', 'Compound', 'Synthetix'],
      'Binance': ['PancakeSwap', 'Venus', 'Alpaca Finance', 'Biswap'],
      'Solana': ['Marinade', 'Raydium', 'Orca', 'Solend', 'Mango Markets'],
      'Polygon': ['Aave', 'QuickSwap', 'Curve', 'Uniswap', 'Balancer'],
      'Avalanche': ['Trader Joe', 'Benqi', 'Pangolin', 'Curve'],
      'Arbitrum': ['GMX', 'Uniswap', 'Curve', 'Balancer', 'Aave'],
      'Optimism': ['Uniswap', 'Synthetix', 'Curve', 'Aave', 'Balancer']
    };

    const relevantProtocols = protocolChainMap[chainName] || [];
    return relevantProtocols.some(protocol => 
      protocolName.toLowerCase().includes(protocol.toLowerCase())
    );
  }

  private isDEXRelevantToChain(dexName: string, chainName: string): boolean {
    const dexChainMap: { [key: string]: string[] } = {
      'Ethereum': ['Uniswap', 'Curve', 'Balancer', 'SushiSwap'],
      'Binance': ['PancakeSwap', 'Biswap'],
      'Solana': ['Raydium', 'Orca', 'Mango Markets'],
      'Polygon': ['QuickSwap', 'Uniswap', 'Curve'],
      'Avalanche': ['Trader Joe', 'Pangolin'],
      'Arbitrum': ['Uniswap', 'GMX', 'Curve'],
      'Optimism': ['Uniswap', 'Curve', 'Balancer']
    };

    const relevantDEXs = dexChainMap[chainName] || [];
    return relevantDEXs.some(dex => 
      dexName.toLowerCase().includes(dex.toLowerCase())
    );
  }

  private calculateLiquidityEfficiency(volume: number, tvl: number): number {
    if (tvl === 0) return 0;
    const ratio = volume / tvl;
    // Normalize to 0-100 scale where higher is better
    return Math.min(ratio * 100, 100);
  }

  private calculateCapitalEfficiency(revenue: number, tvl: number): number {
    if (tvl === 0) return 0;
    const ratio = (revenue / tvl) * 100;
    // Normalize to 0-100 scale
    return Math.min(ratio * 10, 100);
  }

  private async calculateVelocityTrend(coinGeckoId: string): Promise<'increasing' | 'decreasing' | 'stable'> {
    try {
      // Get historical data to calculate trend
      const historicalData = await this.tvlService.getHistoricalTVL(this.mapCoinGeckoToChain(coinGeckoId));
      
      if (historicalData.length < 7) {
        return 'stable';
      }

      // Calculate trend over last 7 days
      const recentData = historicalData.slice(-7);
      const firstValue = recentData[0].totalLiquidityUSD;
      const lastValue = recentData[recentData.length - 1].totalLiquidityUSD;
      
      const change = ((lastValue - firstValue) / firstValue) * 100;
      
      if (Math.abs(change) < 2) {
        return 'stable';
      }
      
      return change > 0 ? 'increasing' : 'decreasing';
    } catch (error) {
      console.error('Error calculating velocity trend:', error);
      return 'stable';
    }
  }

  private async calculateEfficiencyTrend(coinGeckoId: string): Promise<'improving' | 'declining' | 'stable'> {
    try {
      // This would ideally use historical fee data, but we'll approximate with TVL trend
      const historicalData = await this.tvlService.getHistoricalTVL(this.mapCoinGeckoToChain(coinGeckoId));
      
      if (historicalData.length < 7) {
        return 'stable';
      }

      const recentData = historicalData.slice(-7);
      const firstValue = recentData[0].totalLiquidityUSD;
      const lastValue = recentData[recentData.length - 1].totalLiquidityUSD;
      
      const change = ((lastValue - firstValue) / firstValue) * 100;
      
      if (Math.abs(change) < 1) {
        return 'stable';
      }
      
      return change > 0 ? 'improving' : 'declining';
    } catch (error) {
      console.error('Error calculating efficiency trend:', error);
      return 'stable';
    }
  }

  private calculateVelocityConfidence(tvl: number, volume: number, fees: number, protocolCount: number): number {
    let confidence = 0.5; // Base confidence
    
    // Higher TVL increases confidence
    if (tvl > 1000000000) confidence += 0.2; // > $1B
    else if (tvl > 100000000) confidence += 0.1; // > $100M
    
    // Higher volume increases confidence
    if (volume > 100000000) confidence += 0.2; // > $100M
    else if (volume > 10000000) confidence += 0.1; // > $10M
    
    // More protocols increase confidence
    if (protocolCount > 10) confidence += 0.1;
    else if (protocolCount > 5) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  private calculateEfficiencyConfidence(tvl: number, fees: number, revenue: number, protocolCount: number): number {
    let confidence = 0.5; // Base confidence
    
    // Higher TVL increases confidence
    if (tvl > 1000000000) confidence += 0.2;
    else if (tvl > 100000000) confidence += 0.1;
    
    // Higher fees/revenue increases confidence
    if (fees > 1000000) confidence += 0.2; // > $1M
    else if (fees > 100000) confidence += 0.1; // > $100K
    
    if (revenue > 500000) confidence += 0.1; // > $500K
    else if (revenue > 50000) confidence += 0.05; // > $50K
    
    // More protocols increase confidence
    if (protocolCount > 10) confidence += 0.1;
    else if (protocolCount > 5) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  private calculateCombinedScore(velocity: TVLVelocityData, efficiency: TVLEfficiencyData): number {
    // Weighted average where efficiency is slightly more important
    const velocityScore = (velocity.liquidityEfficiency + velocity.confidence * 100) / 2;
    const efficiencyScore = (efficiency.capitalEfficiency + efficiency.roi + efficiency.confidence * 100) / 3;
    
    return (velocityScore * 0.4 + efficiencyScore * 0.6);
  }

  private determineMarketHealth(
    combinedScore: number, 
    velocity: TVLVelocityData, 
    efficiency: TVLEfficiencyData
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    if (combinedScore >= 80 && velocity.confidence > 0.7 && efficiency.confidence > 0.7) {
      return 'excellent';
    } else if (combinedScore >= 60 && velocity.confidence > 0.5 && efficiency.confidence > 0.5) {
      return 'good';
    } else if (combinedScore >= 40) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  private generateRecommendations(
    velocity: TVLVelocityData, 
    efficiency: TVLEfficiencyData, 
    marketHealth: string
  ): string[] {
    const recommendations: string[] = [];
    
    if (velocity.liquidityEfficiency < 30) {
      recommendations.push('Consider improving DEX liquidity and trading volume');
    }
    
    if (efficiency.capitalEfficiency < 20) {
      recommendations.push('Focus on protocols with higher revenue generation');
    }
    
    if (efficiency.roi < 5) {
      recommendations.push('Explore higher-yield DeFi opportunities');
    }
    
    if (velocity.avgHoldingPeriod > 30) {
      recommendations.push('TVL may be stagnant - consider incentive programs');
    }
    
    if (marketHealth === 'excellent') {
      recommendations.push('Current market conditions are favorable for investment');
    } else if (marketHealth === 'poor') {
      recommendations.push('Exercise caution - consider risk mitigation strategies');
    }
    
    return recommendations;
  }
}