/**
 * DeFi Metrics Collector for Enhanced On-chain Data
 * Integrates DeFi Llama data with existing on-chain metrics
 * 
 * Bộ thu thập DeFi Metrics để nâng cao dữ liệu on-chain
 * Tích hợp dữ liệu DeFi Llama với các chỉ số on-chain hiện có
 * 
 * @author Financial Systems Expert
 * @version 1.0
 */

import { db } from '@/lib/db'
import { DeFiLlamaService } from './defi-llama-service'
import { DataValidationService } from './data-validation'

export interface EnhancedOnChainMetrics {
  // Original on-chain metrics
  mvrv: number
  nupl: number
  sopr: number
  activeAddresses: number
  exchangeInflow: number
  exchangeOutflow: number
  transactionVolume: number
  
  // Enhanced DeFi metrics
  defiTvl: number                    // DeFi Total Value Locked
  defiTvlChange24h: number           // TVL change 24h
  defiUsers24h: number               // DeFi active users
  defiVolume24h: number             // DeFi volume 24h
  defiFees24h: number               // DeFi fees 24h
  defiRevenue24h: number            // DeFi revenue 24h
  userGrowth30d: number             // User growth 30 days
  volumeGrowth30d: number           // Volume growth 30 days
  
  // Calculated metrics
  defiPenetration: number           // DeFi penetration rate
  userActivityRatio: number         // User activity ratio
  revenueEfficiency: number         // Revenue efficiency
}

export class DeFiMetricsCollector {
  private static instance: DeFiMetricsCollector
  private defiLlamaService: DeFiLlamaService
  private dataValidationService: DataValidationService
  
  static getInstance(): DeFiMetricsCollector {
    if (!DeFiMetricsCollector.instance) {
      DeFiMetricsCollector.instance = new DeFiMetricsCollector()
    }
    return DeFiMetricsCollector.instance
  }
  
  private constructor() {
    this.defiLlamaService = DeFiLlamaService.getInstance()
    this.dataValidationService = DataValidationService.getInstance()
  }

  /**
   * Collect enhanced on-chain metrics with DeFi data
   * Thu thập on-chain metrics nâng cao với dữ liệu DeFi
   */
  async collectEnhancedMetrics(coinGeckoId: string): Promise<EnhancedOnChainMetrics | null> {
    try {
      console.log(`🔍 Collecting enhanced DeFi metrics for ${coinGeckoId}`)
      
      // Map CoinGecko ID to DeFi Llama chain name
      const chainName = this.mapToChainName(coinGeckoId)
      if (!chainName) {
        console.warn(`⚠️ No chain mapping for ${coinGeckoId}`)
        return null
      }
      
      // Get DeFi Llama metrics
      const defiMetrics = await this.defiLlamaService.getChainMetrics(chainName)
      if (!defiMetrics) {
        console.warn(`⚠️ No DeFi metrics available for ${chainName}`)
        return null
      }
      
      // Get existing on-chain metrics
      const existingMetrics = await this.getExistingOnChainMetrics(coinGeckoId)
      
      // Combine and enhance metrics
      const enhancedMetrics = this.combineMetrics(existingMetrics, defiMetrics)
      
      // Validate the enhanced metrics
      const validation = await this.dataValidationService.validateOnChainMetrics(coinGeckoId, enhancedMetrics)
      
      if (validation.isValid) {
        console.log(`✅ Enhanced metrics collected for ${coinGeckoId}`)
        return enhancedMetrics
      } else {
        console.warn(`⚠️ Enhanced metrics validation failed for ${coinGeckoId}`)
        return null
      }
    } catch (error) {
      console.error(`❌ Error collecting enhanced metrics for ${coinGeckoId}:`, error)
      return null
    }
  }

  /**
   * Get DeFi protocol analysis for a chain
   * Lấy phân tích protocol DeFi cho một chuỗi
   */
  async getProtocolAnalysis(coinGeckoId: string): Promise<any> {
    try {
      const chainName = this.mapToChainName(coinGeckoId)
      if (!chainName) return null
      
      console.log(`🔍 Analyzing DeFi protocols for ${chainName}`)
      
      // Get top protocols
      const topProtocols = await this.defiLlamaService.getTopProtocols(chainName, 20)
      
      // Get historical TVL for growth analysis
      const historicalTVL = await this.defiLlamaService.getHistoricalTVL(chainName, 30)
      
      // Analyze protocol distribution
      const protocolDistribution = this.analyzeProtocolDistribution(topProtocols)
      
      // Calculate growth trends
      const growthTrends = this.calculateGrowthTrends(historicalTVL)
      
      return {
        chain: chainName,
        protocols: topProtocols,
        distribution: protocolDistribution,
        growthTrends,
        totalTVL: topProtocols.reduce((sum, p) => sum + p.tvl, 0),
        totalVolume: topProtocols.reduce((sum, p) => sum + p.volume24h, 0),
        totalFees: topProtocols.reduce((sum, p) => sum + p.fees24h, 0),
        analysisTimestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error(`❌ Error analyzing protocols for ${coinGeckoId}:`, error)
      return null
    }
  }

  /**
   * Map CoinGecko ID to DeFi Llama chain name
   */
  private mapToChainName(coinGeckoId: string): string | null {
    const mapping: Record<string, string> = {
      bitcoin: 'Bitcoin',
      ethereum: 'Ethereum',
      binancecoin: 'Binance',
      solana: 'Solana',
      cardano: 'Cardano',
      polygon: 'Polygon',
      avalanche: 'Avalanche',
      arbitrum: 'Arbitrum',
      optimism: 'Optimism'
    }
    
    return mapping[coinGeckoId] || null
  }

  /**
   * Get existing on-chain metrics from database
   */
  private async getExistingOnChainMetrics(coinGeckoId: string): Promise<any> {
    try {
      const crypto = await db.cryptocurrency.findFirst({
        where: { coinGeckoId }
      })
      
      if (!crypto) return null
      
      const latestMetrics = await db.onChainMetric.findFirst({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' }
      })
      
      if (!latestMetrics) return null
      
      return {
        mvrv: latestMetrics.mvrv || 0,
        nupl: latestMetrics.nupl || 0,
        sopr: latestMetrics.sopr || 0,
        activeAddresses: latestMetrics.activeAddresses || 0,
        exchangeInflow: latestMetrics.exchangeInflow || 0,
        exchangeOutflow: latestMetrics.exchangeOutflow || 0,
        transactionVolume: latestMetrics.transactionVolume || 0
      }
    } catch (error) {
      console.error('❌ Error getting existing metrics:', error)
      return null
    }
  }

  /**
   * Combine existing metrics with DeFi metrics
   */
  private combineMetrics(existingMetrics: any, defiMetrics: any): EnhancedOnChainMetrics {
    const baseMetrics = existingMetrics || {
      mvrv: 0,
      nupl: 0,
      sopr: 0,
      activeAddresses: 0,
      exchangeInflow: 0,
      exchangeOutflow: 0,
      transactionVolume: 0
    }
    
    // Calculate enhanced metrics
    const defiPenetration = this.calculateDefiPenetration(defiMetrics.tvl, baseMetrics.transactionVolume)
    const userActivityRatio = this.calculateUserActivityRatio(defiMetrics.activeUsers24h, baseMetrics.activeAddresses)
    const revenueEfficiency = this.calculateRevenueEfficiency(defiMetrics.revenue24h, defiMetrics.tvl)
    
    return {
      // Base on-chain metrics
      mvrv: baseMetrics.mvrv,
      nupl: baseMetrics.nupl,
      sopr: baseMetrics.sopr,
      activeAddresses: baseMetrics.activeAddresses,
      exchangeInflow: baseMetrics.exchangeInflow,
      exchangeOutflow: baseMetrics.exchangeOutflow,
      transactionVolume: baseMetrics.transactionVolume,
      
      // Enhanced DeFi metrics
      defiTvl: defiMetrics.tvl,
      defiTvlChange24h: defiMetrics.tvlChange24h,
      defiUsers24h: defiMetrics.activeUsers24h,
      defiVolume24h: defiMetrics.volume24h,
      defiFees24h: defiMetrics.fees24h,
      defiRevenue24h: defiMetrics.revenue24h,
      userGrowth30d: defiMetrics.userGrowth30d,
      volumeGrowth30d: defiMetrics.volumeGrowth30d,
      
      // Calculated metrics
      defiPenetration,
      userActivityRatio,
      revenueEfficiency
    }
  }

  /**
   * Calculate DeFi penetration rate
   */
  private calculateDefiPenetration(defiTvl: number, totalVolume: number): number {
    if (totalVolume === 0) return 0
    return Math.min(100, (defiTvl / totalVolume) * 100)
  }

  /**
   * Calculate user activity ratio
   */
  private calculateUserActivityRatio(defiUsers: number, totalAddresses: number): number {
    if (totalAddresses === 0) return 0
    return Math.min(100, (defiUsers / totalAddresses) * 100)
  }

  /**
   * Calculate revenue efficiency
   */
  private calculateRevenueEfficiency(revenue: number, tvl: number): number {
    if (tvl === 0) return 0
    return ((revenue * 365) / tvl) * 100 // Annualized revenue as percentage of TVL
  }

  /**
   * Analyze protocol distribution
   */
  private analyzeProtocolDistribution(protocols: any[]): any {
    const categories = protocols.reduce((acc, protocol) => {
      const category = protocol.category || 'Other'
      acc[category] = (acc[category] || 0) + protocol.tvl
      return acc
    }, {} as Record<string, number>)
    
    const totalTVL = Object.values(categories).reduce((sum, tvl) => sum + tvl, 0)
    
    return Object.entries(categories).map(([category, tvl]) => ({
      category,
      tvl,
      percentage: totalTVL > 0 ? (tvl / totalTVL) * 100 : 0,
      protocolCount: protocols.filter(p => p.category === category).length
    }))
  }

  /**
   * Calculate growth trends from historical data
   */
  private calculateGrowthTrends(historicalData: any[]): any {
    if (historicalData.length < 7) return { trend: 'insufficient_data' }
    
    const recent = historicalData.slice(-7)
    const previous = historicalData.slice(-14, -7)
    
    const recentAvg = recent.reduce((sum, d) => sum + d.tvl, 0) / recent.length
    const previousAvg = previous.reduce((sum, d) => sum + d.tvl, 0) / previous.length
    
    const growthRate = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0
    
    let trend = 'stable'
    if (growthRate > 5) trend = 'growing'
    else if (growthRate < -5) trend = 'declining'
    
    return {
      trend,
      growthRate,
      recentAvg,
      previousAvg,
      volatility: this.calculateVolatility(recent.map(d => d.tvl))
    }
  }

  /**
   * Calculate volatility from TVL data
   */
  private calculateVolatility(tvlData: number[]): number {
    if (tvlData.length < 2) return 0
    
    const mean = tvlData.reduce((sum, tvl) => sum + tvl, 0) / tvlData.length
    const variance = tvlData.reduce((sum, tvl) => sum + Math.pow(tvl - mean, 2), 0) / tvlData.length
    
    return Math.sqrt(variance) / mean // Coefficient of variation
  }

  /**
   * Get DeFi Llama API status
   */
  async getAPIStatus(): Promise<{status: string, latency: number}> {
    return await this.defiLlamaService.getAPIStatus()
  }
}