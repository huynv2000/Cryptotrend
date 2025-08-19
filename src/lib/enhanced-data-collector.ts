/**
 * Enhanced Data Collector for Crypto Analytics
 * Integrates multiple free data sources for comprehensive metrics collection
 * 
 * Bộ thu thập dữ liệu nâng cao cho phân tích tiền điện tử
 * Tích hợp nhiều nguồn dữ liệu miễn phí để thu thập chỉ số toàn diện
 * 
 * @author Financial Systems Expert
 * @version 2.0
 */

import { db } from '@/lib/db'
import { DeFiLlamaService } from './defi-llama-service'
import { DataValidationService } from './data-validation'
import { rateLimiter } from './rate-limiter'

// Data Source Interfaces
interface DataSource {
  name: string
  priority: number
  rateLimit: number // requests per minute
  baseUrl: string
  apiKey?: string
  health: 'healthy' | 'degraded' | 'down'
  lastCall: number
}

interface CollectionResult {
  success: boolean
  data?: any
  source?: string
  confidence?: number
  error?: string
  timestamp: Date
}

// Enhanced Metrics Interface
interface EnhancedUsageMetrics {
  dailyActiveAddresses: number
  newAddresses: number
  dailyTransactions: number
  transactionVolumeUSD: number
  networkRevenueUSD: number
  tvlUSD: number
  defiTvlChange24h: number
  defiUsers24h: number
  defiVolume24h: number
  userGrowth30d: number
  volumeGrowth30d: number
  dataSources: string[]
  confidenceScore: number
}

interface EnhancedCashflowMetrics {
  crossChainNetInflow: number
  stablecoinSupply: number
  exchangeNetflow: number
  largeTransactionsVolume: number
  realizedCap: number
  dexVolume24h: number
  stakingInflow: number
  validatorCount: number
  hashRate?: number
  dataSources: string[]
  confidenceScore: number
}

export class EnhancedDataCollector {
  private static instance: EnhancedDataCollector
  private dataValidationService: DataValidationService
  private defiLlamaService: DeFiLlamaService
  
  // Data Sources Configuration
  private dataSources: Map<string, DataSource> = new Map()
  private requestHistory: Map<string, number[]> = new Map()
  
  // Cache Management
  private cache: Map<string, { data: any; timestamp: Date; confidence: number }> = new Map()
  private cacheTTL: number = 5 * 60 * 1000 // 5 minutes default
  
  static getInstance(): EnhancedDataCollector {
    if (!EnhancedDataCollector.instance) {
      EnhancedDataCollector.instance = new EnhancedDataCollector()
    }
    return EnhancedDataCollector.instance
  }
  
  private constructor() {
    this.dataValidationService = DataValidationService.getInstance()
    this.defiLlamaService = DeFiLlamaService.getInstance()
    this.initializeDataSources()
    this.startHealthMonitoring()
  }

  /**
   * Initialize all data sources with configuration
   */
  private initializeDataSources(): void {
    const sources: DataSource[] = [
      {
        name: 'defillama',
        priority: 1,
        rateLimit: 100,
        baseUrl: 'https://api.llama.fi',
        health: 'healthy',
        lastCall: 0
      },
      {
        name: 'tokenterminal',
        priority: 2,
        rateLimit: 30,
        baseUrl: 'https://api.tokenterminal.com',
        health: 'healthy',
        lastCall: 0
      },
      {
        name: 'artemis',
        priority: 3,
        rateLimit: 20,
        baseUrl: 'https://api.artemis.xyz',
        health: 'healthy',
        lastCall: 0
      },
      {
        name: 'glassnode',
        priority: 4,
        rateLimit: 10,
        baseUrl: 'https://api.glassnode.com',
        health: 'healthy',
        lastCall: 0
      },
      {
        name: 'blockchain',
        priority: 5,
        rateLimit: 60,
        baseUrl: 'https://blockchain.info',
        health: 'healthy',
        lastCall: 0
      },
      {
        name: 'cryptoquant',
        priority: 6,
        rateLimit: 15,
        baseUrl: 'https://cryptoquant.com/api',
        health: 'healthy',
        lastCall: 0
      }
    ]
    
    sources.forEach(source => {
      this.dataSources.set(source.name, source)
      this.requestHistory.set(source.name, [])
    })
  }

  /**
   * Collect comprehensive usage metrics with multi-source fallback
   */
  async collectUsageMetrics(coinGeckoId: string): Promise<EnhancedUsageMetrics | null> {
    try {
      console.log(`🔍 Collecting enhanced usage metrics for ${coinGeckoId}`)
      
      const chainName = this.mapToChainName(coinGeckoId)
      if (!chainName) {
        console.warn(`⚠️ No chain mapping for ${coinGeckoId}`)
        return null
      }

      // Collect metrics from multiple sources with fallback
      const results = await Promise.allSettled([
        this.collectDailyActiveAddresses(chainName),
        this.collectNewAddresses(chainName),
        this.collectDailyTransactions(chainName),
        this.collectTransactionVolume(chainName),
        this.collectNetworkRevenue(chainName),
        this.collectTVL(chainName),
        this.collectUserGrowthMetrics(chainName)
      ])

      // Process results and calculate confidence
      const successfulResults = results
        .filter((r): r is PromiseFulfilledResult<CollectionResult> => 
          r.status === 'fulfilled' && r.value.success
        )
        .map(r => r.value)

      if (successfulResults.length < 4) {
        console.warn(`⚠️ Insufficient data sources for ${coinGeckoId}`)
        return null
      }

      // Aggregate metrics
      const metrics = this.aggregateUsageMetrics(successfulResults)
      
      // Validate aggregated metrics
      const validation = await this.dataValidationService.validateOnChainMetrics(coinGeckoId, metrics)
      
      if (validation.isValid) {
        console.log(`✅ Enhanced usage metrics collected for ${coinGeckoId} (confidence: ${(validation.confidence * 100).toFixed(1)}%)`)
        return {
          ...metrics,
          dataSources: [...new Set(successfulResults.map(r => r.source || 'unknown'))],
          confidenceScore: validation.confidence
        }
      } else {
        console.warn(`⚠️ Usage metrics validation failed for ${coinGeckoId}`)
        return null
      }
    } catch (error) {
      console.error(`❌ Error collecting usage metrics for ${coinGeckoId}:`, error)
      return null
    }
  }

  /**
   * Collect comprehensive cashflow metrics with multi-source fallback
   */
  async collectCashflowMetrics(coinGeckoId: string): Promise<EnhancedCashflowMetrics | null> {
    try {
      console.log(`🔍 Collecting enhanced cashflow metrics for ${coinGeckoId}`)
      
      const chainName = this.mapToChainName(coinGeckoId)
      if (!chainName) {
        console.warn(`⚠️ No chain mapping for ${coinGeckoId}`)
        return null
      }

      // Collect metrics from multiple sources
      const results = await Promise.allSettled([
        this.collectCrossChainInflow(chainName),
        this.collectStablecoinSupply(chainName),
        this.collectExchangeNetflow(chainName),
        this.collectLargeTransactions(chainName),
        this.collectRealizedCap(chainName),
        this.collectDEXVolume(chainName),
        this.collectStakingMetrics(chainName),
        this.collectNetworkMetrics(chainName)
      ])

      // Process results
      const successfulResults = results
        .filter((r): r is PromiseFulfilledResult<CollectionResult> => 
          r.status === 'fulfilled' && r.value.success
        )
        .map(r => r.value)

      if (successfulResults.length < 3) {
        console.warn(`⚠️ Insufficient cashflow data for ${coinGeckoId}`)
        return null
      }

      // Aggregate metrics
      const metrics = this.aggregateCashflowMetrics(successfulResults)
      
      console.log(`✅ Enhanced cashflow metrics collected for ${coinGeckoId}`)
      return {
        ...metrics,
        dataSources: [...new Set(successfulResults.map(r => r.source || 'unknown'))],
        confidenceScore: this.calculateConfidenceScore(successfulResults)
      }
    } catch (error) {
      console.error(`❌ Error collecting cashflow metrics for ${coinGeckoId}:`, error)
      return null
    }
  }

  /**
   * Daily Active Addresses Collection with Multi-source Fallback
   */
  private async collectDailyActiveAddresses(chainName: string): Promise<CollectionResult> {
    const sources = ['artemis', 'glassnode', 'blockchain']
    
    for (const sourceName of sources) {
      try {
        const result = await this.safeAPICall(sourceName, async () => {
          const source = this.dataSources.get(sourceName)
          if (!source || source.health !== 'healthy') return null
          
          switch (sourceName) {
            case 'artemis':
              return await this.fetchArtemisActiveAddresses(chainName)
            case 'glassnode':
              return await this.fetchGlassnodeActiveAddresses(chainName)
            case 'blockchain':
              return await this.fetchBlockchainActiveAddresses(chainName)
            default:
              return null
          }
        })
        
        if (result) {
          return {
            success: true,
            data: { dailyActiveAddresses: result },
            source: sourceName,
            confidence: this.getSourceConfidence(sourceName),
            timestamp: new Date()
          }
        }
      } catch (error) {
        console.warn(`⚠️ ${sourceName} DAA failed:`, error)
        continue
      }
    }
    
    // Fallback to estimation
    const estimated = await this.estimateDailyActiveAddresses(chainName)
    return {
      success: true,
      data: { dailyActiveAddresses: estimated },
      source: 'estimation',
      confidence: 0.6,
      timestamp: new Date()
    }
  }

  /**
   * TVL Collection with Multi-source Fallback
   */
  private async collectTVL(chainName: string): Promise<CollectionResult> {
    try {
      // Try DeFi Llama first (highest priority)
      const defiLlamaResult = await this.safeAPICall('defillama', async () => {
        return await this.defiLlamaService.getChainMetrics(chainName)
      })
      
      if (defiLlamaResult) {
        return {
          success: true,
          data: {
            tvlUSD: defiLlamaResult.tvl,
            defiTvlChange24h: defiLlamaResult.tvlChange24h,
            defiUsers24h: defiLlamaResult.activeUsers24h,
            defiVolume24h: defiLlamaResult.volume24h
          },
          source: 'defillama',
          confidence: 0.95,
          timestamp: new Date()
        }
      }
      
      // Fallback to Token Terminal
      const tokenTerminalResult = await this.safeAPICall('tokenterminal', async () => {
        return await this.fetchTokenTerminalTVL(chainName)
      })
      
      if (tokenTerminalResult) {
        return {
          success: true,
          data: {
            tvlUSD: tokenTerminalResult.tvl,
            defiTvlChange24h: tokenTerminalResult.change24h,
            defiUsers24h: tokenTerminalResult.users,
            defiVolume24h: tokenTerminalResult.volume
          },
          source: 'tokenterminal',
          confidence: 0.85,
          timestamp: new Date()
        }
      }
      
      // Estimation fallback
      const estimated = await this.estimateTVL(chainName)
      return {
        success: true,
        data: {
          tvlUSD: estimated.tvl,
          defiTvlChange24h: estimated.change24h,
          defiUsers24h: estimated.users,
          defiVolume24h: estimated.volume
        },
        source: 'estimation',
        confidence: 0.7,
        timestamp: new Date()
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      }
    }
  }

  /**
   * Safe API call with rate limiting and error handling
   */
  private async safeAPICall<T>(sourceName: string, apiCall: () => Promise<T>): Promise<T | null> {
    const source = this.dataSources.get(sourceName)
    if (!source || source.health === 'down') {
      return null
    }
    
    // Check rate limits
    if (!this.checkRateLimit(sourceName)) {
      console.warn(`⚠️ Rate limit exceeded for ${sourceName}`)
      return null
    }
    
    try {
      const result = await apiCall()
      
      // Update source health
      source.health = 'healthy'
      source.lastCall = Date.now()
      
      return result
    } catch (error) {
      console.error(`❌ API call failed for ${sourceName}:`, error)
      
      // Update source health
      source.health = 'degraded'
      
      return null
    }
  }

  /**
   * Check rate limits for data source
   */
  private checkRateLimit(sourceName: string): boolean {
    const source = this.dataSources.get(sourceName)
    if (!source) return false
    
    const now = Date.now()
    const history = this.requestHistory.get(sourceName) || []
    
    // Clean old requests (older than 1 minute)
    const recentHistory = history.filter(time => now - time < 60 * 1000)
    this.requestHistory.set(sourceName, recentHistory)
    
    // Check if we're within rate limits
    return recentHistory.length < source.rateLimit
  }

  /**
   * Map CoinGecko ID to chain name
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
   * Calculate confidence score from multiple results
   */
  private calculateConfidenceScore(results: CollectionResult[]): number {
    if (results.length === 0) return 0
    
    const avgConfidence = results.reduce((sum, r) => sum + (r.confidence || 0.5), 0) / results.length
    const sourceBonus = Math.min(0.2, results.length * 0.05) // Bonus for multiple sources
    
    return Math.min(1.0, avgConfidence + sourceBonus)
  }

  /**
   * Aggregate usage metrics from multiple sources
   */
  private aggregateUsageMetrics(results: CollectionResult[]): any {
    const metrics: any = {}
    
    results.forEach(result => {
      Object.assign(metrics, result.data)
    })
    
    // Fill missing values with estimations
    if (!metrics.dailyActiveAddresses) {
      metrics.dailyActiveAddresses = this.estimateDailyActiveAddresses('ethereum') // fallback
    }
    
    if (!metrics.tvlUSD) {
      const estimated = this.estimateTVL('ethereum')
      metrics.tvlUSD = estimated.tvl
    }
    
    return metrics
  }

  /**
   * Aggregate cashflow metrics from multiple sources
   */
  private aggregateCashflowMetrics(results: CollectionResult[]): any {
    const metrics: any = {}
    
    results.forEach(result => {
      Object.assign(metrics, result.data)
    })
    
    return metrics
  }

  /**
   * Start health monitoring for all data sources
   */
  private startHealthMonitoring(): void {
    setInterval(async () => {
      for (const [name, source] of this.dataSources) {
        try {
          const health = await this.checkSourceHealth(source)
          source.health = health
        } catch (error) {
          source.health = 'down'
          console.error(`❌ Health check failed for ${name}:`, error)
        }
      }
    }, 60 * 1000) // Check every minute
  }

  /**
   * Check individual source health
   */
  private async checkSourceHealth(source: DataSource): Promise<'healthy' | 'degraded' | 'down'> {
    try {
      const response = await fetch(`${source.baseUrl}/health`, {
        method: 'HEAD',
        timeout: 5000
      })
      
      if (response.ok) return 'healthy'
      if (response.status >= 400 && response.status < 500) return 'degraded'
      return 'down'
    } catch (error) {
      return 'down'
    }
  }

  /**
   * Placeholder methods for specific data source implementations
   * These would be implemented with actual API calls
   */
  private async fetchArtemisActiveAddresses(chainName: string): Promise<number> {
    // TODO: Implement Artemis API integration
    return 0
  }

  private async fetchGlassnodeActiveAddresses(chainName: string): Promise<number> {
    // TODO: Implement Glassnode API integration
    return 0
  }

  private async fetchBlockchainActiveAddresses(chainName: string): Promise<number> {
    // TODO: Implement Blockchain.com API integration
    return 0
  }

  private async fetchTokenTerminalTVL(chainName: string): Promise<any> {
    // TODO: Implement Token Terminal API integration
    return null
  }

  private async estimateDailyActiveAddresses(chainName: string): Promise<number> {
    // TODO: Implement estimation model
    return 100000 // Placeholder
  }

  private async estimateTVL(chainName: string): Promise<any> {
    // TODO: Implement TVL estimation
    return { tvl: 1000000000, change24h: 0, users: 10000, volume: 50000000 }
  }

  // Additional placeholder methods for other metrics...
  
 private async collectNewAddresses(chainName: string): Promise<CollectionResult> {
    // Implementation needed
    return { success: false, timestamp: new Date() }
  }

  private async collectDailyTransactions(chainName: string): Promise<CollectionResult> {
    // Implementation needed
    return { success: false, timestamp: new Date() }
  }

  private async collectTransactionVolume(chainName: string): Promise<CollectionResult> {
    // Implementation needed
    return { success: false, timestamp: new Date() }
  }

  private async collectNetworkRevenue(chainName: string): Promise<CollectionResult> {
    // Implementation needed
    return { success: false, timestamp: new Date() }
  }

  private async collectUserGrowthMetrics(chainName: string): Promise<CollectionResult> {
    // Implementation needed
    return { success: false, timestamp: new Date() }
  }

  private async collectCrossChainInflow(chainName: string): Promise<CollectionResult> {
    // Implementation needed
    return { success: false, timestamp: new Date() }
  }

  private async collectStablecoinSupply(chainName: string): Promise<CollectionResult> {
    // Implementation needed
    return { success: false, timestamp: new Date() }
  }

  private async collectExchangeNetflow(chainName: string): Promise<CollectionResult> {
    // Implementation needed
    return { success: false, timestamp: new Date() }
  }

  private async collectLargeTransactions(chainName: string): Promise<CollectionResult> {
    // Implementation needed
    return { success: false, timestamp: new Date() }
  }

  private async collectRealizedCap(chainName: string): Promise<CollectionResult> {
    // Implementation needed
    return { success: false, timestamp: new Date() }
  }

  private async collectDEXVolume(chainName: string): Promise<CollectionResult> {
    // Implementation needed
    return { success: false, timestamp: new Date() }
  }

  private async collectStakingMetrics(chainName: string): Promise<CollectionResult> {
    // Implementation needed
    return { success: false, timestamp: new Date() }
  }

  private async collectNetworkMetrics(chainName: string): Promise<CollectionResult> {
    // Implementation needed
    return { success: false, timestamp: new Date() }
  }

  private getSourceConfidence(sourceName: string): number {
    const confidenceMap: Record<string, number> = {
      'defillama': 0.95,
      'tokenterminal': 0.90,
      'artemis': 0.85,
      'glassnode': 0.80,
      'blockchain': 0.75,
      'cryptoquant': 0.70,
      'estimation': 0.60
    }
    
    return confidenceMap[sourceName] || 0.5
  }
}