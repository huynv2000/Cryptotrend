// Enhanced TVL Metrics Service
// Implements TVL Concentration Risk and TVL Sustainability Score metrics

import { db } from '@/lib/db';
import { TVLService } from './tvl-service';
import { DeFiLlamaService } from './defillama-service';

interface ConcentrationRiskData {
  concentrationRisk: number;
  herfindahlIndex: number;
  topProtocolDominance: number;
  top3ProtocolDominance: number;
  top5ProtocolDominance: number;
  protocolDiversity: number;
  concentrationLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  concentrationTrend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
}

interface SustainabilityData {
  sustainabilityScore: number;
  revenueStability: number;
  userGrowthRate: number;
  protocolHealth: number;
  ecosystemMaturity: number;
  riskAdjustedReturns: number;
  sustainabilityLevel: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  sustainabilityTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
}

interface EnhancedTVLMetrics {
  concentrationRisk: ConcentrationRiskData;
  sustainability: SustainabilityData;
  overallTVLHealth: number;
  recommendations: string[];
  riskFactors: string[];
  strengthFactors: string[];
  lastUpdated: Date;
}

export class EnhancedTVLMetricsService {
  private static instance: EnhancedTVLMetricsService;
  private tvlService: TVLService;
  private defiLlamaService: DeFiLlamaService;
  private cache = new Map<string, { data: EnhancedTVLMetrics; timestamp: number; ttl: number }>();

  static getInstance(): EnhancedTVLMetricsService {
    if (!EnhancedTVLMetricsService.instance) {
      EnhancedTVLMetricsService.instance = new EnhancedTVLMetricsService();
    }
    return EnhancedTVLMetricsService.instance;
  }

  private constructor() {
    this.tvlService = TVLService.getInstance();
    this.defiLlamaService = DeFiLlamaService.getInstance();
  }

  // Calculate TVL Concentration Risk - measures how concentrated TVL is among top protocols
  async calculateConcentrationRisk(coinGeckoId: string): Promise<ConcentrationRiskData> {
    try {
      // Get TVL data with protocol information
      const tvlData = await this.tvlService.getBlockchainTVL(coinGeckoId);
      const globalTVL = await this.tvlService.getGlobalTVL();
      
      // Get detailed protocol data
      const protocols = await this.tvlService.getTVLByProtocol(100);
      
      // Get chain-specific protocols
      const chainName = this.mapCoinGeckoToChain(coinGeckoId);
      const chainProtocols = protocols.filter(p => 
        p.chains.includes(chainName) || 
        p.chainTvls[chainName] > 0
      );

      // Calculate protocol TVL distribution
      const chainProtocolTVLs = chainProtocols.map(p => p.chainTvls[chainName] || 0);
      const totalChainTVL = chainProtocolTVLs.reduce((sum, tvl) => sum + tvl, 0);

      if (totalChainTVL === 0 || chainProtocolTVLs.length === 0) {
        return this.getDefaultConcentrationRisk();
      }

      // Sort protocols by TVL in descending order
      const sortedTVLs = chainProtocolTVLs.sort((a, b) => b - a);

      // Calculate concentration metrics
      const topProtocolDominance = (sortedTVLs[0] / totalChainTVL) * 100;
      const top3ProtocolDominance = sortedTVLs.slice(0, 3).reduce((sum, tvl) => sum + tvl, 0) / totalChainTVL * 100;
      const top5ProtocolDominance = sortedTVLs.slice(0, 5).reduce((sum, tvl) => sum + tvl, 0) / totalChainTVL * 100;

      // Calculate Herfindahl-Hirschman Index (HHI)
      const herfindahlIndex = sortedTVLs.reduce((sum, tvl) => {
        const marketShare = tvl / totalChainTVL;
        return sum + (marketShare * marketShare);
      }, 0) * 10000; // Scale to 0-10000

      // Calculate protocol diversity (inverse of concentration)
      const protocolDiversity = this.calculateProtocolDiversity(sortedTVLs, totalChainTVL);

      // Calculate overall concentration risk score
      const concentrationRisk = this.calculateConcentrationRiskScore(
        topProtocolDominance,
        top3ProtocolDominance,
        herfindahlIndex
      );

      // Determine concentration level
      const concentrationLevel = this.determineConcentrationLevel(concentrationRisk);

      // Calculate concentration trend
      const concentrationTrend = await this.calculateConcentrationTrend(coinGeckoId);

      return {
        concentrationRisk: Math.round(concentrationRisk * 100) / 100,
        herfindahlIndex: Math.round(herfindahlIndex * 100) / 100,
        topProtocolDominance: Math.round(topProtocolDominance * 100) / 100,
        top3ProtocolDominance: Math.round(top3ProtocolDominance * 100) / 100,
        top5ProtocolDominance: Math.round(top5ProtocolDominance * 100) / 100,
        protocolDiversity: Math.round(protocolDiversity * 100) / 100,
        concentrationLevel,
        concentrationTrend
      };
    } catch (error) {
      console.error('Error calculating concentration risk:', error);
      return this.getDefaultConcentrationRisk();
    }
  }

  // Calculate TVL Sustainability Score - evaluates sustainability based on multiple factors
  async calculateSustainabilityScore(coinGeckoId: string): Promise<SustainabilityData> {
    try {
      // Get base TVL data
      const tvlData = await this.tvlService.getBlockchainTVL(coinGeckoId);
      
      // Get protocol fees and revenue data
      const protocolFees = await this.defiLlamaService.getProtocolFees();
      
      // Get chain-specific data
      const chainName = this.mapCoinGeckoToChain(coinGeckoId);
      const chainProtocols = protocolFees.filter(p => 
        p.name.toLowerCase().includes(chainName.toLowerCase()) ||
        this.isProtocolRelevantToChain(p.name, chainName)
      );

      // Calculate sustainability factors
      const revenueStability = this.calculateRevenueStability(chainProtocols);
      const userGrowthRate = this.calculateUserGrowthRate(coinGeckoId);
      const protocolHealth = this.calculateProtocolHealth(chainProtocols);
      const ecosystemMaturity = this.calculateEcosystemMaturity(tvlData, chainProtocols.length);
      const riskAdjustedReturns = this.calculateRiskAdjustedReturns(tvlData, chainProtocols);

      // Calculate overall sustainability score
      const sustainabilityScore = this.calculateOverallSustainabilityScore(
        revenueStability,
        userGrowthRate,
        protocolHealth,
        ecosystemMaturity,
        riskAdjustedReturns
      );

      // Determine sustainability level
      const sustainabilityLevel = this.determineSustainabilityLevel(sustainabilityScore);

      // Calculate sustainability trend
      const sustainabilityTrend = await this.calculateSustainabilityTrend(coinGeckoId);

      return {
        sustainabilityScore: Math.round(sustainabilityScore * 100) / 100,
        revenueStability: Math.round(revenueStability * 100) / 100,
        userGrowthRate: Math.round(userGrowthRate * 100) / 100,
        protocolHealth: Math.round(protocolHealth * 100) / 100,
        ecosystemMaturity: Math.round(ecosystemMaturity * 100) / 100,
        riskAdjustedReturns: Math.round(riskAdjustedReturns * 100) / 100,
        sustainabilityLevel,
        sustainabilityTrend
      };
    } catch (error) {
      console.error('Error calculating sustainability score:', error);
      return this.getDefaultSustainabilityData();
    }
  }

  // Get comprehensive enhanced TVL metrics
  async getEnhancedTVLMetrics(coinGeckoId: string): Promise<EnhancedTVLMetrics> {
    const cacheKey = `enhanced-tvl-${coinGeckoId}`;
    const now = Date.now();
    const cached = this.cache.get(cacheKey);
    
    // Return cached data if not expired (2 hour cache)
    if (cached && (now - cached.timestamp) < 7200000) {
      return cached.data;
    }

    try {
      const [concentrationRisk, sustainability] = await Promise.all([
        this.calculateConcentrationRisk(coinGeckoId),
        this.calculateSustainabilityScore(coinGeckoId)
      ]);

      // Calculate overall TVL health
      const overallTVLHealth = this.calculateOverallTVLHealth(concentrationRisk, sustainability);

      // Generate recommendations
      const recommendations = this.generateRecommendations(concentrationRisk, sustainability);

      // Identify risk factors
      const riskFactors = this.identifyRiskFactors(concentrationRisk, sustainability);

      // Identify strength factors
      const strengthFactors = this.identifyStrengthFactors(concentrationRisk, sustainability);

      const metrics: EnhancedTVLMetrics = {
        concentrationRisk,
        sustainability,
        overallTVLHealth,
        recommendations,
        riskFactors,
        strengthFactors,
        lastUpdated: new Date()
      };

      // Cache the result
      this.cache.set(cacheKey, { data: metrics, timestamp: now, ttl: 7200000 });

      return metrics;
    } catch (error) {
      console.error('Error getting enhanced TVL metrics:', error);
      throw error;
    }
  }

  // Store enhanced TVL metrics in database
  async storeEnhancedTVLMetrics(coinGeckoId: string) {
    try {
      const crypto = await db.cryptocurrency.findFirst({
        where: { coinGeckoId }
      });

      if (!crypto) {
        throw new Error(`Cryptocurrency not found: ${coinGeckoId}`);
      }

      const metrics = await this.getEnhancedTVLMetrics(coinGeckoId);

      // Store in database
      const enhancedMetrics = await db.enhancedTVLMetric.create({
        data: {
          cryptoId: crypto.id,
          
          // Concentration Risk Metrics
          concentrationRisk: metrics.concentrationRisk.concentrationRisk,
          herfindahlIndex: metrics.concentrationRisk.herfindahlIndex,
          topProtocolDominance: metrics.concentrationRisk.topProtocolDominance,
          top3ProtocolDominance: metrics.concentrationRisk.top3ProtocolDominance,
          top5ProtocolDominance: metrics.concentrationRisk.top5ProtocolDominance,
          protocolDiversity: metrics.concentrationRisk.protocolDiversity,
          concentrationLevel: metrics.concentrationRisk.concentrationLevel,
          concentrationTrend: metrics.concentrationRisk.concentrationTrend,
          
          // Sustainability Metrics
          sustainabilityScore: metrics.sustainability.sustainabilityScore,
          revenueStability: metrics.sustainability.revenueStability,
          userGrowthRate: metrics.sustainability.userGrowthRate,
          protocolHealth: metrics.sustainability.protocolHealth,
          ecosystemMaturity: metrics.sustainability.ecosystemMaturity,
          riskAdjustedReturns: metrics.sustainability.riskAdjustedReturns,
          sustainabilityLevel: metrics.sustainability.sustainabilityLevel,
          sustainabilityTrend: metrics.sustainability.sustainabilityTrend,
          
          // Combined Analysis
          overallTVLHealth: metrics.overallTVLHealth,
          recommendations: JSON.stringify(metrics.recommendations),
          riskFactors: JSON.stringify(metrics.riskFactors),
          strengthFactors: JSON.stringify(metrics.strengthFactors),
          
          // Metadata
          confidence: Math.min(
            this.calculateConcentrationConfidence(metrics.concentrationRisk),
            this.calculateSustainabilityConfidence(metrics.sustainability)
          ),
          timestamp: new Date()
        }
      });

      return enhancedMetrics;
    } catch (error) {
      console.error('Error storing enhanced TVL metrics:', error);
      throw error;
    }
  }

  // Get latest enhanced TVL metrics from database
  async getLatestEnhancedTVLMetrics(coinGeckoId: string) {
    try {
      const crypto = await db.cryptocurrency.findFirst({
        where: { coinGeckoId }
      });

      if (!crypto) {
        return null;
      }

      const latestMetrics = await db.enhancedTVLMetric.findFirst({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' }
      });

      if (!latestMetrics) {
        return null;
      }

      return {
        ...latestMetrics,
        recommendations: JSON.parse(latestMetrics.recommendations || '[]'),
        riskFactors: JSON.parse(latestMetrics.riskFactors || '[]'),
        strengthFactors: JSON.parse(latestMetrics.strengthFactors || '[]')
      };
    } catch (error) {
      console.error('Error getting latest enhanced TVL metrics:', error);
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

  private calculateProtocolDiversity(protocolTVLs: number[], totalTVL: number): number {
    if (protocolTVLs.length === 0) return 0;

    // Calculate Shannon Diversity Index adapted for TVL
    const shannonIndex = protocolTVLs.reduce((sum, tvl) => {
      const proportion = tvl / totalTVL;
      if (proportion > 0) {
        return sum - (proportion * Math.log(proportion));
      }
      return sum;
    }, 0);

    // Normalize to 0-100 scale
    const maxPossibleDiversity = Math.log(protocolTVLs.length);
    return maxPossibleDiversity > 0 ? (shannonIndex / maxPossibleDiversity) * 100 : 0;
  }

  private calculateConcentrationRiskScore(
    topProtocolDominance: number,
    top3ProtocolDominance: number,
    herfindahlIndex: number
  ): number {
    // Weighted calculation of concentration risk
    let riskScore = 0;

    // Top protocol dominance (40% weight)
    if (topProtocolDominance > 50) riskScore += 40;
    else if (topProtocolDominance > 30) riskScore += 30;
    else if (topProtocolDominance > 15) riskScore += 20;
    else riskScore += 10;

    // Top 3 protocol dominance (35% weight)
    if (top3ProtocolDominance > 80) riskScore += 35;
    else if (top3ProtocolDominance > 60) riskScore += 25;
    else if (top3ProtocolDominance > 40) riskScore += 15;
    else riskScore += 5;

    // Herfindahl Index (25% weight)
    if (herfindahlIndex > 2500) riskScore += 25;
    else if (herfindahlIndex > 1500) riskScore += 18;
    else if (herfindahlIndex > 1000) riskScore += 12;
    else riskScore += 5;

    return Math.min(riskScore, 100);
  }

  private determineConcentrationLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (riskScore >= 80) return 'CRITICAL';
    if (riskScore >= 60) return 'HIGH';
    if (riskScore >= 40) return 'MEDIUM';
    return 'LOW';
  }

  private async calculateConcentrationTrend(coinGeckoId: string): Promise<'IMPROVING' | 'STABLE' | 'DETERIORATING'> {
    try {
      // Get historical data to calculate trend
      const historicalData = await this.tvlService.getHistoricalTVL(this.mapCoinGeckoToChain(coinGeckoId));
      
      if (historicalData.length < 7) {
        return 'STABLE';
      }

      // For simplicity, we'll use TVL volatility as a proxy for concentration trend
      // In a real implementation, you'd analyze historical concentration data
      const recentData = historicalData.slice(-7);
      const values = recentData.map(d => d.totalLiquidityUSD);
      
      const volatility = this.calculateVolatility(values);
      
      if (volatility > 0.3) return 'DETERIORATING';
      if (volatility > 0.15) return 'STABLE';
      return 'IMPROVING';
    } catch (error) {
      console.error('Error calculating concentration trend:', error);
      return 'STABLE';
    }
  }

  private calculateRevenueStability(chainProtocols: any[]): number {
    if (chainProtocols.length === 0) return 50; // Default moderate stability

    // Calculate revenue stability based on fee consistency across protocols
    const fees = chainProtocols.map(p => p.fees24h || 0).filter(fee => fee > 0);
    
    if (fees.length === 0) return 30; // Low stability if no fees

    // Calculate coefficient of variation for fees
    const mean = fees.reduce((sum, fee) => sum + fee, 0) / fees.length;
    const variance = fees.reduce((sum, fee) => sum + Math.pow(fee - mean, 2), 0) / fees.length;
    const coefficientOfVariation = Math.sqrt(variance) / mean;

    // Convert to stability score (inverse of variation)
    const stabilityScore = Math.max(0, 100 - (coefficientOfVariation * 100));
    return Math.min(stabilityScore, 100);
  }

  private calculateUserGrowthRate(coinGeckoId: string): number {
    // This would ideally use on-chain data like active addresses
    // For now, we'll use a simplified approach based on TVL growth
    // In a real implementation, you'd fetch user growth data from on-chain APIs
    
    // Return a moderate growth rate as placeholder
    return 5.0; // 5% growth rate
  }

  private calculateProtocolHealth(chainProtocols: any[]): number {
    if (chainProtocols.length === 0) return 0;

    // Calculate protocol health based on multiple factors
    let healthScore = 0;

    // Factor 1: Number of healthy protocols (with positive fees)
    const healthyProtocols = chainProtocols.filter(p => (p.fees24h || 0) > 0).length;
    const protocolHealthRatio = healthyProtocols / chainProtocols.length;
    healthScore += protocolHealthRatio * 40;

    // Factor 2: Revenue generation
    const totalFees = chainProtocols.reduce((sum, p) => sum + (p.fees24h || 0), 0);
    const avgFeesPerProtocol = totalFees / chainProtocols.length;
    
    if (avgFeesPerProtocol > 100000) healthScore += 30; // > $100k daily fees
    else if (avgFeesPerProtocol > 10000) healthScore += 20; // > $10k daily fees
    else if (avgFeesPerProtocol > 1000) healthScore += 10; // > $1k daily fees

    // Factor 3: Protocol diversity
    if (chainProtocols.length > 20) healthScore += 30;
    else if (chainProtocols.length > 10) healthScore += 20;
    else if (chainProtocols.length > 5) healthScore += 10;

    return Math.min(healthScore, 100);
  }

  private calculateEcosystemMaturity(tvlData: any, protocolCount: number): number {
    let maturityScore = 0;

    // Factor 1: TVL size
    const tvl = tvlData.chainTVL || 0;
    if (tvl > 10000000000) maturityScore += 40; // > $10B
    else if (tvl > 1000000000) maturityScore += 30; // > $1B
    else if (tvl > 100000000) maturityScore += 20; // > $100M
    else if (tvl > 10000000) maturityScore += 10; // > $10M

    // Factor 2: Protocol count
    if (protocolCount > 50) maturityScore += 35;
    else if (protocolCount > 20) maturityScore += 25;
    else if (protocolCount > 10) maturityScore += 15;
    else if (protocolCount > 5) maturityScore += 5;

    // Factor 3: TVL stability (based on changes)
    const change24h = Math.abs(tvlData.change24h || 0);
    const change7d = Math.abs(tvlData.change7d || 0);
    const avgChange = (change24h + change7d) / 2;
    
    if (avgChange < 5) maturityScore += 25; // Very stable
    else if (avgChange < 15) maturityScore += 15; // Moderately stable
    else if (avgChange < 30) maturityScore += 5; // Somewhat stable

    return Math.min(maturityScore, 100);
  }

  private calculateRiskAdjustedReturns(tvlData: any, chainProtocols: any[]): number {
    // Calculate risk-adjusted returns based on revenue vs TVL ratio
    const totalFees = chainProtocols.reduce((sum, p) => sum + (p.fees24h || 0), 0);
    const tvl = tvlData.chainTVL || 0;

    if (tvl === 0) return 0;

    // Annualized fee to TVL ratio
    const annualFees = totalFees * 365;
    const feeToTVLRatio = (annualFees / tvl) * 100;

    // Convert to risk-adjusted returns score
    if (feeToTVLRatio > 10) return 90; // Excellent returns
    if (feeToTVLRatio > 5) return 75; // Good returns
    if (feeToTVLRatio > 2) return 60; // Moderate returns
    if (feeToTVLRatio > 1) return 45; // Low returns
    if (feeToTVLRatio > 0.5) return 30; // Very low returns
    return 15; // Minimal returns
  }

  private calculateOverallSustainabilityScore(
    revenueStability: number,
    userGrowthRate: number,
    protocolHealth: number,
    ecosystemMaturity: number,
    riskAdjustedReturns: number
  ): number {
    // Weighted calculation of sustainability score
    const weights = {
      revenueStability: 0.25,
      userGrowthRate: 0.20,
      protocolHealth: 0.25,
      ecosystemMaturity: 0.15,
      riskAdjustedReturns: 0.15
    };

    return (
      revenueStability * weights.revenueStability +
      Math.min(userGrowthRate * 2, 100) * weights.userGrowthRate + // Scale growth rate
      protocolHealth * weights.protocolHealth +
      ecosystemMaturity * weights.ecosystemMaturity +
      riskAdjustedReturns * weights.riskAdjustedReturns
    );
  }

  private determineSustainabilityLevel(score: number): 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'FAIR';
    return 'POOR';
  }

  private async calculateSustainabilityTrend(coinGeckoId: string): Promise<'IMPROVING' | 'STABLE' | 'DECLINING'> {
    try {
      // Get historical TVL data as a proxy for sustainability trend
      const historicalData = await this.tvlService.getHistoricalTVL(this.mapCoinGeckoToChain(coinGeckoId));
      
      if (historicalData.length < 7) {
        return 'STABLE';
      }

      const recentData = historicalData.slice(-7);
      const firstValue = recentData[0].totalLiquidityUSD;
      const lastValue = recentData[recentData.length - 1].totalLiquidityUSD;
      
      const change = ((lastValue - firstValue) / firstValue) * 100;
      
      if (Math.abs(change) < 2) {
        return 'STABLE';
      }
      
      return change > 0 ? 'IMPROVING' : 'DECLINING';
    } catch (error) {
      console.error('Error calculating sustainability trend:', error);
      return 'STABLE';
    }
  }

  private calculateOverallTVLHealth(
    concentrationRisk: ConcentrationRiskData,
    sustainability: SustainabilityData
  ): number {
    // Overall health is weighted average of inverse of concentration risk and sustainability
    const concentrationHealth = 100 - concentrationRisk.concentrationRisk;
    const sustainabilityHealth = sustainability.sustainabilityScore;

    // Weight sustainability slightly more than concentration (60/40 split)
    return (concentrationHealth * 0.4 + sustainabilityHealth * 0.6);
  }

  private generateRecommendations(
    concentrationRisk: ConcentrationRiskData,
    sustainability: SustainabilityData
  ): string[] {
    const recommendations: string[] = [];

    // Concentration risk recommendations
    if (concentrationRisk.concentrationLevel === 'CRITICAL') {
      recommendations.push('EXTREME concentration risk detected - consider diversifying across more protocols');
      recommendations.push('Monitor top protocol dominance closely for signs of failure');
    } else if (concentrationRisk.concentrationLevel === 'HIGH') {
      recommendations.push('High concentration risk - diversify TVL across additional protocols');
      recommendations.push('Consider allocating to smaller, promising protocols');
    } else if (concentrationRisk.concentrationLevel === 'MEDIUM') {
      recommendations.push('Moderate concentration risk - maintain balanced protocol allocation');
    }

    // Sustainability recommendations
    if (sustainability.sustainabilityLevel === 'POOR') {
      recommendations.push('Low sustainability score - monitor ecosystem health closely');
      recommendations.push('Consider reducing exposure until fundamentals improve');
    } else if (sustainability.sustainabilityLevel === 'FAIR') {
      recommendations.push('Moderate sustainability - watch for improvement in key metrics');
    }

    // Trend-based recommendations
    if (concentrationRisk.concentrationTrend === 'DETERIORATING') {
      recommendations.push('Concentration risk increasing - take action to diversify');
    }

    if (sustainability.sustainabilityTrend === 'DECLINING') {
      recommendations.push('Sustainability declining - investigate underlying causes');
    }

    return recommendations;
  }

  private identifyRiskFactors(
    concentrationRisk: ConcentrationRiskData,
    sustainability: SustainabilityData
  ): string[] {
    const riskFactors: string[] = [];

    if (concentrationRisk.topProtocolDominance > 40) {
      riskFactors.push('High dependency on single protocol');
    }

    if (concentrationRisk.top3ProtocolDominance > 70) {
      riskFactors.push('Concentrated TVL among few protocols');
    }

    if (sustainability.revenueStability < 40) {
      riskFactors.push('Unstable revenue generation');
    }

    if (sustainability.protocolHealth < 50) {
      riskFactors.push('Poor protocol health metrics');
    }

    if (sustainability.riskAdjustedReturns < 30) {
      riskFactors.push('Low risk-adjusted returns');
    }

    return riskFactors;
  }

  private identifyStrengthFactors(
    concentrationRisk: ConcentrationRiskData,
    sustainability: SustainabilityData
  ): string[] {
    const strengthFactors: string[] = [];

    if (concentrationRisk.protocolDiversity > 70) {
      strengthFactors.push('High protocol diversity');
    }

    if (sustainability.revenueStability > 70) {
      strengthFactors.push('Stable revenue generation');
    }

    if (sustainability.ecosystemMaturity > 80) {
      strengthFactors.push('Mature ecosystem');
    }

    if (sustainability.riskAdjustedReturns > 70) {
      strengthFactors.push('Strong risk-adjusted returns');
    }

    if (concentrationRisk.concentrationTrend === 'IMPROVING') {
      strengthFactors.push('Improving concentration risk');
    }

    return strengthFactors;
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private calculateConcentrationConfidence(concentrationRisk: ConcentrationRiskData): number {
    let confidence = 0.7; // Base confidence

    // Higher confidence with more diverse data
    if (concentrationRisk.protocolDiversity > 50) confidence += 0.2;
    else if (concentrationRisk.protocolDiversity > 30) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private calculateSustainabilityConfidence(sustainability: SustainabilityData): number {
    let confidence = 0.6; // Base confidence

    // Higher confidence with better metrics
    if (sustainability.revenueStability > 60) confidence += 0.2;
    if (sustainability.protocolHealth > 60) confidence += 0.1;
    if (sustainability.ecosystemMaturity > 60) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }

  private getDefaultConcentrationRisk(): ConcentrationRiskData {
    return {
      concentrationRisk: 50,
      herfindahlIndex: 1500,
      topProtocolDominance: 25,
      top3ProtocolDominance: 50,
      top5ProtocolDominance: 65,
      protocolDiversity: 50,
      concentrationLevel: 'MEDIUM',
      concentrationTrend: 'STABLE'
    };
  }

  private getDefaultSustainabilityData(): SustainabilityData {
    return {
      sustainabilityScore: 50,
      revenueStability: 50,
      userGrowthRate: 5,
      protocolHealth: 50,
      ecosystemMaturity: 50,
      riskAdjustedReturns: 50,
      sustainabilityLevel: 'FAIR',
      sustainabilityTrend: 'STABLE'
    };
  }
}