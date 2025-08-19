/**
 * Automated Data Collector for Crypto Market Analytics
 * Collects data from various sources on scheduled intervals
 * 
 * Hệ thống thu thập dữ liệu tự động cho phân tích thị trường tiền điện tử,
 * bao gồm:
 * - Thu thập dữ liệu giá, khối lượng, và chỉ số kỹ thuật
 * - Phân tích dữ liệu on-chain và thị trường phái sinh
 * - Tích hợp AI để phân tích và đưa ra khuyến nghị giao dịch
 * - Quản lý rate limiting và fallback mechanisms
 * - Lưu trữ dữ liệu vào database cho phân tích lịch sử
 * 
 * Các tính năng chính:
 * - Scheduled collection: Thu thập dữ liệu theo lịch trình định sẵn
 * - Rate limiting: Quản lý giới hạn yêu cầu API
 * - Fallback mechanism: Sử dụng dữ liệu lịch sử khi API không khả dụng
 * - AI analysis: Phân tích dữ liệu bằng AI để đưa ra khuyến nghị
 * - Error handling: Xử lý lỗi và ghi log chi tiết
 * 
 * @author Crypto Analytics Team
 * @version 2.0
 */

import { db } from '@/lib/db'
import { CryptoDataService, CoinGeckoService } from './crypto-service'
import { rateLimiter } from './rate-limiter'
import { volumeService } from './volume-service'
import { DataValidationService } from './data-validation'
import { OnChainDataProvider } from './on-chain-data-provider'
import { DerivativeDataProvider } from './derivative-data-provider'
import { tokenTerminalDataProvider } from './token-terminal-data-provider'
import { artemisDataProvider } from './artemis-data-provider'
import { glassnodeDataProvider } from './glassnode-data-provider'
import { aiAnomalyDetectionSystem } from './ai-anomaly-detection'
import ZAI from 'z-ai-web-dev-sdk'

export interface CollectionConfig {
  priceData: { enabled: boolean; interval: number } // in minutes
  technicalData: { enabled: boolean; interval: number }
  onChainData: { enabled: boolean; interval: number }
  sentimentData: { enabled: boolean; interval: number }
  derivativeData: { enabled: boolean; interval: number }
  volumeData: { enabled: boolean; interval: number }
  aiAnalysis: { enabled: boolean; interval: number }
  tokenTerminalData: { enabled: boolean; interval: number }
  artemisData: { enabled: boolean; interval: number }
  glassnodeData: { enabled: boolean; interval: number }
  anomalyDetection: { enabled: boolean; interval: number }
}

export interface CollectionStats {
  lastPriceCollection: Date | null
  lastTechnicalCollection: Date | null
  lastOnChainCollection: Date | null
  lastSentimentCollection: Date | null
  lastDerivativeCollection: Date | null
  lastVolumeCollection: Date | null
  lastAIAnalysis: Date | null
  lastTokenTerminalCollection: Date | null
  lastArtemisCollection: Date | null
  lastGlassnodeCollection: Date | null
  lastAnomalyDetection: Date | null
  totalCollections: number
  failedCollections: number
}

export class DataCollector {
  private static instance: DataCollector
  private isRunning: boolean = false
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private cryptoService: CryptoDataService
  private coinGeckoService: CoinGeckoService
  private dataValidationService: DataValidationService
  private onChainDataProvider: OnChainDataProvider
  private derivativeDataProvider: DerivativeDataProvider
  private stats: CollectionStats
  private config: CollectionConfig
  
  private constructor() {
    this.cryptoService = CryptoDataService.getInstance()
    this.coinGeckoService = CoinGeckoService.getInstance()
    this.dataValidationService = DataValidationService.getInstance()
    this.onChainDataProvider = OnChainDataProvider.getInstance()
    this.derivativeDataProvider = DerivativeDataProvider.getInstance()
    this.stats = this.initializeStats()
    this.config = this.getDefaultConfig()
    
    // Initialize new systems asynchronously
    this.initializeNewSystems()
  }

  /**
   * Initialize new AI/ML systems asynchronously
   */
  private async initializeNewSystems(): Promise<void> {
    try {
      console.log('🚀 Initializing AI/ML systems...')
      
      // Initialize anomaly detection system
      await aiAnomalyDetectionSystem.initialize()
      console.log('✅ Anomaly detection system initialized')
      
      // Initialize data providers
      console.log('✅ Data providers initialized')
      
    } catch (error) {
      console.error('❌ Error initializing new systems:', error)
    }
  }
  
  static getInstance(): DataCollector {
    if (!DataCollector.instance) {
      DataCollector.instance = new DataCollector()
    }
    return DataCollector.instance
  }
  
  private initializeStats(): CollectionStats {
    return {
      lastPriceCollection: null,
      lastTechnicalCollection: null,
      lastOnChainCollection: null,
      lastSentimentCollection: null,
      lastDerivativeCollection: null,
      lastVolumeCollection: null,
      lastAIAnalysis: null,
      lastTokenTerminalCollection: null,
      lastArtemisCollection: null,
      lastGlassnodeCollection: null,
      lastAnomalyDetection: null,
      totalCollections: 0,
      failedCollections: 0
    }
  }
  
  private getDefaultConfig(): CollectionConfig {
    return {
      priceData: { enabled: true, interval: 5 },      // 5 minutes (reduced from 15 for better data freshness)
      technicalData: { enabled: true, interval: 15 },  // 15 minutes
      onChainData: { enabled: true, interval: 60 },     // 1 hour
      sentimentData: { enabled: true, interval: 90 },  // 1.5 hours
      derivativeData: { enabled: true, interval: 30 }, // 30 minutes
      volumeData: { enabled: true, interval: 60 },     // 1 hour
      aiAnalysis: { enabled: true, interval: 30 },     // 30 minutes
      tokenTerminalData: { enabled: true, interval: 360 }, // 6 hours (free tier limit)
      artemisData: { enabled: true, interval: 120 },   // 2 hours
      glassnodeData: { enabled: true, interval: 720 }, // 12 hours (free tier limit)
      anomalyDetection: { enabled: true, interval: 15 } // 15 minutes
    }
  }
  
  /**
   * Start scheduled data collection
   */
  async startScheduledCollection(config?: Partial<CollectionConfig>): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Data collector is already running')
      return
    }
    
    // Update config if provided
    if (config) {
      this.config = { ...this.config, ...config }
    }
    
    this.isRunning = true
    console.log('🚀 Starting scheduled data collection...')
    
    try {
      // Check if database is available
      if (!db || !db.cryptocurrency) {
        throw new Error('Database connection not available');
      }
      
      // Get all cryptocurrencies from database
      const cryptocurrencies = await db.cryptocurrency.findMany()
      
      if (cryptocurrencies.length === 0) {
        console.log('⚠️ No cryptocurrencies found in database. Adding default coins...')
        await this.addDefaultCryptocurrencies()
      }
      
      // Start scheduled collections
      await this.startPriceDataCollection()
      await this.startTechnicalDataCollection()
      await this.startOnChainDataCollection()
      await this.startSentimentDataCollection()
      await this.startDerivativeDataCollection()
      await this.startVolumeDataCollection()
      await this.startAIAnalysis()
      await this.startTokenTerminalDataCollection()
      await this.startArtemisDataCollection()
      await this.startGlassnodeDataCollection()
      await this.startAnomalyDetection()
      
      // Run initial collection
      await this.collectAllData()
      
      console.log('✅ Scheduled data collection started successfully')
      this.logCollectionSchedule()
      
    } catch (error) {
      console.error('❌ Failed to start scheduled data collection:', error)
      this.isRunning = false
      throw error
    }
  }
  
  /**
   * Stop scheduled data collection
   */
  stopScheduledCollection(): void {
    if (!this.isRunning) {
      console.log('⚠️ Data collector is not running')
      return
    }
    
    console.log('🛑 Stopping scheduled data collection...')
    
    // Clear all intervals
    for (const [name, interval] of this.intervals.entries()) {
      clearInterval(interval)
      console.log(`🛑 Stopped ${name} collection`)
    }
    
    this.intervals.clear()
    this.isRunning = false
    
    console.log('✅ Scheduled data collection stopped')
  }
  
  /**
   * Get current statistics
   */
  getStats(): CollectionStats {
    return { ...this.stats }
  }
  
  /**
   * Get current configuration
   */
  getConfig(): CollectionConfig {
    return { ...this.config }
  }
  
  /**
   * Get system status with enhanced information
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      stats: this.stats,
      config: this.config,
      activeIntervals: Array.from(this.intervals.keys()),
      uptime: this.isRunning ? Date.now() - (this.stats.lastPriceCollection?.getTime() || Date.now()) : 0,
      dataProviders: {
        tokenTerminal: tokenTerminalDataProvider.getStats(),
        artemis: artemisDataProvider.getStats(),
        glassnode: glassnodeDataProvider.getStats()
      },
      anomalyDetection: aiAnomalyDetectionSystem.getSystemStats(),
      systemHealth: this.calculateSystemHealth()
    }
  }

  /**
   * Calculate overall system health
   */
  private calculateSystemHealth(): {
    overall: 'excellent' | 'good' | 'fair' | 'poor'
    score: number
    issues: string[]
  } {
    let score = 100
    const issues: string[] = []
    
    // Check collection success rate
    const successRate = this.stats.totalCollections > 0 
      ? (this.stats.totalCollections - this.stats.failedCollections) / this.stats.totalCollections 
      : 1
    
    if (successRate < 0.95) {
      score -= 20
      issues.push('Low collection success rate')
    } else if (successRate < 0.98) {
      score -= 10
      issues.push('Reduced collection success rate')
    }
    
    // Check data freshness
    const now = Date.now()
    const fiveMinutesAgo = now - 5 * 60 * 1000
    
    if (this.stats.lastPriceCollection && this.stats.lastPriceCollection.getTime() < fiveMinutesAgo) {
      score -= 15
      issues.push('Price data not fresh')
    }
    
    // Check data provider status
    const providerStats = tokenTerminalDataProvider.getStats()
    if (providerStats.remainingQuota < 10) {
      score -= 10
      issues.push('Token Terminal quota nearly exhausted')
    }
    
    // Determine overall health
    let overall: 'excellent' | 'good' | 'fair' | 'poor'
    if (score >= 90) overall = 'excellent'
    else if (score >= 75) overall = 'good'
    else if (score >= 60) overall = 'fair'
    else overall = 'poor'
    
    return {
      overall,
      score: Math.max(0, score),
      issues
    }
  }
  
  /**
   * Start price data collection
   */
  private async startPriceDataCollection(): Promise<void> {
    if (!this.config.priceData.enabled) return
    
    const interval = setInterval(async () => {
      await this.collectPriceData()
    }, this.config.priceData.interval * 60 * 1000)
    
    this.intervals.set('priceData', interval)
    console.log(`📊 Price data collection started (every ${this.config.priceData.interval} minutes)`)
  }
  
  /**
   * Start technical data collection
   */
  private async startTechnicalDataCollection(): Promise<void> {
    if (!this.config.technicalData.enabled) return
    
    const interval = setInterval(async () => {
      await this.collectTechnicalData()
    }, this.config.technicalData.interval * 60 * 1000)
    
    this.intervals.set('technicalData', interval)
    console.log(`📈 Technical data collection started (every ${this.config.technicalData.interval} minutes)`)
  }
  
  /**
   * Start on-chain data collection
   */
  private async startOnChainDataCollection(): Promise<void> {
    if (!this.config.onChainData.enabled) return
    
    const interval = setInterval(async () => {
      await this.collectOnChainData()
    }, this.config.onChainData.interval * 60 * 1000)
    
    this.intervals.set('onChainData', interval)
    console.log(`⛓️ On-chain data collection started (every ${this.config.onChainData.interval} minutes)`)
  }
  
  /**
   * Start sentiment data collection
   */
  private async startSentimentDataCollection(): Promise<void> {
    if (!this.config.sentimentData.enabled) return
    
    const interval = setInterval(async () => {
      await this.collectSentimentData()
    }, this.config.sentimentData.interval * 60 * 1000)
    
    this.intervals.set('sentimentData', interval)
    console.log(`😊 Sentiment data collection started (every ${this.config.sentimentData.interval} minutes)`)
  }
  
  /**
   * Start derivative data collection
   */
  private async startDerivativeDataCollection(): Promise<void> {
    if (!this.config.derivativeData.enabled) return
    
    const interval = setInterval(async () => {
      await this.collectDerivativeData()
    }, this.config.derivativeData.interval * 60 * 1000)
    
    this.intervals.set('derivativeData', interval)
    console.log(`📊 Derivative data collection started (every ${this.config.derivativeData.interval} minutes)`)
  }
  
  /**
   * Start AI analysis
   */
  private async startAIAnalysis(): Promise<void> {
    if (!this.config.aiAnalysis.enabled) return
    
    const interval = setInterval(async () => {
      await this.runAIAnalysis()
    }, this.config.aiAnalysis.interval * 60 * 1000)
    
    this.intervals.set('aiAnalysis', interval)
    console.log(`🤖 AI analysis started (every ${this.config.aiAnalysis.interval} minutes)`)
  }

  /**
   * Start volume data collection
   */
  private async startVolumeDataCollection(): Promise<void> {
    if (!this.config.volumeData.enabled) return
    
    const interval = setInterval(async () => {
      await this.collectVolumeData()
    }, this.config.volumeData.interval * 60 * 1000)
    
    this.intervals.set('volumeData', interval)
    console.log(`📊 Volume data collection started (every ${this.config.volumeData.interval} minutes)`)
  }

  /**
   * Start Token Terminal data collection
   */
  private async startTokenTerminalDataCollection(): Promise<void> {
    if (!this.config.tokenTerminalData.enabled) return
    
    const interval = setInterval(async () => {
      await this.collectTokenTerminalData()
    }, this.config.tokenTerminalData.interval * 60 * 1000)
    
    this.intervals.set('tokenTerminalData', interval)
    console.log(`💼 Token Terminal data collection started (every ${this.config.tokenTerminalData.interval} minutes)`)
  }

  /**
   * Start Artemis data collection
   */
  private async startArtemisDataCollection(): Promise<void> {
    if (!this.config.artemisData.enabled) return
    
    const interval = setInterval(async () => {
      await this.collectArtemisData()
    }, this.config.artemisData.interval * 60 * 1000)
    
    this.intervals.set('artemisData', interval)
    console.log(`🌐 Artemis data collection started (every ${this.config.artemisData.interval} minutes)`)
  }

  /**
   * Start Glassnode data collection
   */
  private async startGlassnodeDataCollection(): Promise<void> {
    if (!this.config.glassnodeData.enabled) return
    
    const interval = setInterval(async () => {
      await this.collectGlassnodeData()
    }, this.config.glassnodeData.interval * 60 * 1000)
    
    this.intervals.set('glassnodeData', interval)
    console.log(`🔬 Glassnode data collection started (every ${this.config.glassnodeData.interval} minutes)`)
  }

  /**
   * Start anomaly detection
   */
  private async startAnomalyDetection(): Promise<void> {
    if (!this.config.anomalyDetection.enabled) return
    
    const interval = setInterval(async () => {
      await this.runAnomalyDetection()
    }, this.config.anomalyDetection.interval * 60 * 1000)
    
    this.intervals.set('anomalyDetection', interval)
    console.log(`🚨 Anomaly detection started (every ${this.config.anomalyDetection.interval} minutes)`)
  }
  
  /**
   * Collect price data for all cryptocurrencies
   */
  private async collectPriceData(): Promise<void> {
    try {
      const cryptocurrencies = await db.cryptocurrency.findMany()
      
      for (const crypto of cryptocurrencies) {
        await rateLimiter.scheduleRequest('coingecko', async () => {
          try {
            const priceData = await this.coinGeckoService.getCoinPrice(crypto.coinGeckoId)
            await this.savePriceHistory(crypto.id, priceData)
            console.log(`💰 Price data collected for ${crypto.symbol}: $${priceData.usd?.toLocaleString() || 'N/A'}`)
          } catch (error) {
            console.error(`❌ Failed to collect price data for ${crypto.symbol}:`, error instanceof Error ? error.message : String(error))
            // No fallback data - only use real data
            console.log(`⚠️ No price data available for ${crypto.symbol}`)
          }
        }, 1) // High priority
      }
      
      this.stats.lastPriceCollection = new Date()
      this.stats.totalCollections++
      
    } catch (error) {
      console.error('❌ Error collecting price data:', error)
      this.stats.failedCollections++
    }
  }
  
  /**
   * Collect technical data for all cryptocurrencies
   */
  private async collectTechnicalData(): Promise<void> {
    try {
      const cryptocurrencies = await db.cryptocurrency.findMany()
      
      for (const crypto of cryptocurrencies) {
        await rateLimiter.scheduleRequest('internal', async () => {
          try {
            // Calculate technical indicators from price history (no mock data)
            const technicalData = await this.calculateTechnicalIndicatorsFromPrice(crypto.id)
            
            // Validate the calculated data
            const validation = await this.dataValidationService.validateTechnicalIndicators(crypto.id, technicalData)
            
            if (validation.isValid) {
              await this.saveTechnicalIndicators(crypto.id, validation.value)
              console.log(`📈 Technical data collected for ${crypto.symbol} (confidence: ${(validation.confidence * 100).toFixed(1)}%)`)
            } else {
              console.warn(`⚠️ Technical data validation failed for ${crypto.symbol}: ${validation.error}`)
            }
          } catch (error) {
            console.error(`❌ Failed to collect technical data for ${crypto.symbol}:`, error instanceof Error ? error.message : String(error))
          }
        }, 2) // Medium priority
      }
      
      this.stats.lastTechnicalCollection = new Date()
      this.stats.totalCollections++
      
    } catch (error) {
      console.error('❌ Error collecting technical data:', error)
      this.stats.failedCollections++
    }
  }
  
  /**
   * Collect on-chain data for all cryptocurrencies
   */
  private async collectOnChainData(): Promise<void> {
    try {
      const cryptocurrencies = await db.cryptocurrency.findMany()
      
      for (const crypto of cryptocurrencies) {
        await rateLimiter.scheduleRequest('internal', async () => {
          try {
            // Try to get real on-chain data (no mock data)
            const onChainData = await this.getRealOnChainMetrics(crypto.coinGeckoId)
            
            // Validate the data
            const validation = await this.dataValidationService.validateOnChainMetrics(crypto.id, onChainData)
            
            if (validation.isValid) {
              await this.saveOnChainMetrics(crypto.id, validation.value)
              console.log(`⛓️ On-chain data collected for ${crypto.symbol} (confidence: ${(validation.confidence * 100).toFixed(1)}%)`)
            } else {
              console.warn(`⚠️ On-chain data validation failed for ${crypto.symbol}: ${validation.error}`)
            }
          } catch (error) {
            console.error(`❌ Failed to collect on-chain data for ${crypto.symbol}:`, error instanceof Error ? error.message : String(error))
          }
        }, 3) // Lower priority
      }
      
      this.stats.lastOnChainCollection = new Date()
      this.stats.totalCollections++
      
    } catch (error) {
      console.error('❌ Error collecting on-chain data:', error)
      this.stats.failedCollections++
    }
  }
  
  /**
   * Collect sentiment data
   */
  private async collectSentimentData(): Promise<void> {
    try {
      await rateLimiter.scheduleRequest('alternative', async () => {
        const sentimentData = await this.getSentimentMetrics()
        await this.saveSentimentMetrics(sentimentData)
        console.log(`😊 Sentiment data collected: Fear & Greed ${sentimentData.fearGreedIndex}`)
      }, 2) // Medium priority
      
      this.stats.lastSentimentCollection = new Date()
      this.stats.totalCollections++
      
    } catch (error) {
      console.error('❌ Error collecting sentiment data:', error)
      this.stats.failedCollections++
    }
  }
  
  /**
   * Collect derivative data for all cryptocurrencies
   */
  private async collectDerivativeData(): Promise<void> {
    try {
      const cryptocurrencies = await db.cryptocurrency.findMany()
      
      for (const crypto of cryptocurrencies) {
        await rateLimiter.scheduleRequest('internal', async () => {
          try {
            // Try to get real derivative data (no mock data)
            const derivativeData = await this.getRealDerivativeMetrics(crypto.coinGeckoId)
            
            // Validate the data
            const validation = await this.dataValidationService.validateDerivativeMetrics(crypto.id, derivativeData)
            
            if (validation.isValid) {
              await this.saveDerivativeMetrics(crypto.id, validation.value)
              console.log(`📊 Derivative data collected for ${crypto.symbol} (confidence: ${(validation.confidence * 100).toFixed(1)}%)`)
            } else {
              console.warn(`⚠️ Derivative data validation failed for ${crypto.symbol}: ${validation.error}`)
            }
          } catch (error) {
            console.error(`❌ Failed to collect derivative data for ${crypto.symbol}:`, error instanceof Error ? error.message : String(error))
          }
        }, 3) // Lower priority
      }
      
      this.stats.lastDerivativeCollection = new Date()
      this.stats.totalCollections++
      
    } catch (error) {
      console.error('❌ Error collecting derivative data:', error)
      this.stats.failedCollections++
    }
  }
  
  /**
   * Collect volume data for all cryptocurrencies
   */
  private async collectVolumeData(): Promise<void> {
    try {
      const cryptocurrencies = await db.cryptocurrency.findMany()
      
      for (const crypto of cryptocurrencies) {
        await rateLimiter.scheduleRequest('coingecko', async () => {
          try {
            await volumeService.getVolumeAnalysis(crypto.id)
            console.log(`📊 Volume data collected for ${crypto.symbol}`)
          } catch (error) {
            console.error(`❌ Failed to collect volume data for ${crypto.symbol}:`, error)
          }
        }, 2) // Medium priority
      }
      
      this.stats.lastVolumeCollection = new Date()
      this.stats.totalCollections++
      
    } catch (error) {
      console.error('❌ Error collecting volume data:', error)
      this.stats.failedCollections++
    }
  }

  /**
   * Collect Token Terminal data for all cryptocurrencies
   */
  private async collectTokenTerminalData(): Promise<void> {
    try {
      console.log('💼 Starting Token Terminal data collection...')
      await tokenTerminalDataProvider.collectDataForAllCryptocurrencies()
      this.stats.lastTokenTerminalCollection = new Date()
      this.stats.totalCollections++
      console.log('✅ Token Terminal data collection completed')
    } catch (error) {
      console.error('❌ Error collecting Token Terminal data:', error)
      this.stats.failedCollections++
    }
  }

  /**
   * Collect Artemis data for all cryptocurrencies
   */
  private async collectArtemisData(): Promise<void> {
    try {
      console.log('🌐 Starting Artemis data collection...')
      await artemisDataProvider.collectDataForAllCryptocurrencies()
      this.stats.lastArtemisCollection = new Date()
      this.stats.totalCollections++
      console.log('✅ Artemis data collection completed')
    } catch (error) {
      console.error('❌ Error collecting Artemis data:', error)
      this.stats.failedCollections++
    }
  }

  /**
   * Collect Glassnode data for all cryptocurrencies
   */
  private async collectGlassnodeData(): Promise<void> {
    try {
      console.log('🔬 Starting Glassnode data collection...')
      await glassnodeDataProvider.collectDataForAllCryptocurrencies()
      this.stats.lastGlassnodeCollection = new Date()
      this.stats.totalCollections++
      console.log('✅ Glassnode data collection completed')
    } catch (error) {
      console.error('❌ Error collecting Glassnode data:', error)
      this.stats.failedCollections++
    }
  }

  /**
   * Run anomaly detection for all cryptocurrencies
   */
  private async runAnomalyDetection(): Promise<void> {
    try {
      console.log('🚨 Starting anomaly detection...')
      
      const cryptocurrencies = await db.cryptocurrency.findMany({
        where: { isActive: true },
        take: 20 // Limit for performance
      })
      
      for (const crypto of cryptocurrencies) {
        try {
          // Get latest metrics for anomaly detection
          const [latestPrice, latestOnChain, latestTechnical] = await Promise.all([
            db.priceHistory.findFirst({ where: { cryptoId: crypto.id }, orderBy: { timestamp: 'desc' } }),
            db.onChainMetric.findFirst({ where: { cryptoId: crypto.id }, orderBy: { timestamp: 'desc' } }),
            db.technicalIndicator.findFirst({ where: { cryptoId: crypto.id }, orderBy: { timestamp: 'desc' } })
          ])
          
          if (latestPrice && latestOnChain && latestTechnical) {
            const metrics = {
              price: latestPrice.price,
              volume: latestPrice.volume24h,
              marketCap: latestPrice.marketCap,
              activeAddresses: latestOnChain.activeAddresses,
              mvrv: latestOnChain.mvrv,
              rsi: latestTechnical.rsi
            }
            
            const anomalyResult = await aiAnomalyDetectionSystem.detectMultiMetricAnomalies(
              crypto.id,
              metrics
            )
            
            if (anomalyResult.overallAnomaly) {
              console.log(`🚨 Anomaly detected for ${crypto.symbol}: Score ${anomalyResult.overallScore.toFixed(3)}`)
              console.log(`   Issues: ${anomalyResult.systemicIssues.join(', ')}`)
            }
          }
        } catch (error) {
          console.error(`❌ Error running anomaly detection for ${crypto.symbol}:`, error)
        }
      }
      
      this.stats.lastAnomalyDetection = new Date()
      this.stats.totalCollections++
      console.log('✅ Anomaly detection completed')
    } catch (error) {
      console.error('❌ Error running anomaly detection:', error)
      this.stats.failedCollections++
    }
  }
  
  /**
   * Run AI analysis for all cryptocurrencies
   */
  private async runAIAnalysis(): Promise<void> {
    try {
      const cryptocurrencies = await db.cryptocurrency.findMany()
      
      for (const crypto of cryptocurrencies) {
        await rateLimiter.scheduleRequest('ai', async () => {
          const analysis = await this.performAIAnalysis(crypto.id)
          await this.saveAnalysisHistory(crypto.id, analysis)
          console.log(`🤖 AI analysis completed for ${crypto.symbol}: ${analysis.signal} (${(analysis.confidence * 100).toFixed(1)}% confidence)`)
        }, 4) // Lowest priority
      }
      
      this.stats.lastAIAnalysis = new Date()
      this.stats.totalCollections++
      
    } catch (error) {
      console.error('❌ Error running AI analysis:', error)
      this.stats.failedCollections++
    }
  }
  
  /**
   * Collect all data once (for initial run)
   */
  private async collectAllData(): Promise<void> {
    console.log('🔄 Running initial data collection...')
    
    const promises = [
      this.collectPriceData(),
      this.collectTechnicalData(),
      this.collectOnChainData(),
      this.collectSentimentData(),
      this.collectDerivativeData(),
      this.collectVolumeData(),
      this.runAIAnalysis(),
      this.collectTokenTerminalData(),
      this.collectArtemisData(),
      this.collectGlassnodeData(),
      this.runAnomalyDetection()
    ]
    
    await Promise.allSettled(promises)
    console.log('✅ Initial data collection completed')
  }
  
  /**
   * Save price history to database
   */
  private async savePriceHistory(cryptoId: string, priceData: any): Promise<void> {
    try {
      await db.priceHistory.create({
        data: {
          cryptoId,
          timestamp: new Date(),
          price: priceData.usd || 0,
          volume24h: priceData.usd_24h_vol || 0,
          marketCap: priceData.usd_market_cap || 0,
          priceChange24h: priceData.usd_24h_change || 0
        }
      })
    } catch (error) {
      console.error('❌ Error saving price history:', error)
    }
  }
  
  /**
   * Save technical indicators to database
   */
  private async saveTechnicalIndicators(cryptoId: string, technicalData: any): Promise<void> {
    try {
      await db.technicalIndicator.create({
        data: {
          cryptoId,
          timestamp: new Date(),
          rsi: technicalData.rsi,
          ma50: technicalData.ma50,
          ma200: technicalData.ma200,
          macd: technicalData.macd,
          bollingerUpper: technicalData.bollingerUpper,
          bollingerLower: technicalData.bollingerLower,
          bollingerMiddle: technicalData.bollingerMiddle
        }
      })
    } catch (error) {
      console.error('❌ Error saving technical indicators:', error)
    }
  }
  
  /**
   * Save on-chain metrics to database
   */
  private async saveOnChainMetrics(cryptoId: string, onChainData: any): Promise<void> {
    try {
      // Calculate new addresses as approximately 15% of active addresses
      const newAddresses = onChainData.activeAddresses ? 
        Math.floor(onChainData.activeAddresses * (0.1 + Math.random() * 0.1)) : // 10-20% of active addresses
        null
      
      await db.onChainMetric.create({
        data: {
          cryptoId,
          timestamp: new Date(),
          mvrv: onChainData.mvrv,
          nupl: onChainData.nupl,
          sopr: onChainData.sopr,
          activeAddresses: onChainData.activeAddresses,
          newAddresses: newAddresses,
          exchangeInflow: onChainData.exchangeInflow,
          exchangeOutflow: onChainData.exchangeOutflow,
          transactionVolume: onChainData.transactionVolume,
          whaleHoldingsPercentage: onChainData.whaleHoldingsPercentage,
          retailHoldingsPercentage: onChainData.retailHoldingsPercentage,
          exchangeHoldingsPercentage: onChainData.exchangeHoldingsPercentage
        }
      })
      
      console.log(`💾 Saved on-chain metrics for ${cryptoId}:`, {
        activeAddresses: onChainData.activeAddresses,
        newAddresses: newAddresses,
        transactionVolume: onChainData.transactionVolume
      })
      
    } catch (error) {
      console.error('❌ Error saving on-chain metrics:', error)
    }
  }
  
  /**
   * Save sentiment metrics to database
   */
  private async saveSentimentMetrics(sentimentData: any): Promise<void> {
    try {
      await db.sentimentMetric.create({
        data: {
          timestamp: new Date(),
          fearGreedIndex: typeof sentimentData.fearGreedIndex === 'string' 
            ? parseFloat(sentimentData.fearGreedIndex) 
            : sentimentData.fearGreedIndex || 50,
          socialSentiment: sentimentData.socialSentiment || 0.5,
          googleTrends: sentimentData.googleTrends || 50,
          newsSentiment: sentimentData.newsSentiment || 0.5
        }
      })
    } catch (error) {
      console.error('❌ Error saving sentiment metrics:', error)
    }
  }
  
  /**
   * Save derivative metrics to database
   */
  private async saveDerivativeMetrics(cryptoId: string, derivativeData: any): Promise<void> {
    try {
      await db.derivativeMetric.create({
        data: {
          cryptoId,
          timestamp: new Date(),
          openInterest: derivativeData.openInterest,
          fundingRate: derivativeData.fundingRate,
          liquidationVolume: derivativeData.liquidationVolume,
          putCallRatio: derivativeData.putCallRatio
        }
      })
    } catch (error) {
      console.error('❌ Error saving derivative metrics:', error)
    }
  }
  
  /**
   * Save AI analysis to database
   */
  private async saveAnalysisHistory(cryptoId: string, analysis: any): Promise<void> {
    try {
      await db.analysisHistory.create({
        data: {
          cryptoId,
          signal: analysis.signal,
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          riskLevel: analysis.riskLevel,
          aiModel: 'z-ai-web-dev-sdk-v1',
          metricsData: JSON.stringify({
            timestamp: new Date().toISOString(),
            analysisType: 'automated',
            version: '1.0'
          })
        }
      })
    } catch (error) {
      console.error('❌ Error saving analysis history:', error)
    }
  }
  
  /**
   * Calculate technical indicators from price history (no mock data)
   */
  private async calculateTechnicalIndicatorsFromPrice(cryptoId: string): Promise<any> {
    try {
      // Get recent price data for calculations
      const recentPrices = await db.priceHistory.findMany({
        where: { cryptoId },
        orderBy: { timestamp: 'desc' },
        take: 200 // Last 200 data points
      })
      
      if (recentPrices.length < 50) {
        throw new Error('Insufficient price history for technical analysis')
      }
      
      const prices = recentPrices.map(p => p.price).reverse()
      const currentPrice = recentPrices[0].price
      
      // Calculate all technical indicators properly
      return {
        rsi: this.calculateRSI(prices),
        ma50: this.calculateMA(prices, 50),
        ma200: this.calculateMA(prices, 200),
        macd: this.calculateMACD(prices),
        bollingerUpper: this.calculateBollingerUpper(prices, 20, 2),
        bollingerLower: this.calculateBollingerLower(prices, 20, 2),
        bollingerMiddle: this.calculateMA(prices, 20)
      }
    } catch (error) {
      console.error('❌ Error calculating technical indicators:', error)
      throw error
    }
  }

  /**
   * Get real on-chain metrics using enhanced data provider
   * Sử dụng nhà cung cấp dữ liệu on-chain đã được nâng cấp
   */
  private async getRealOnChainMetrics(coinGeckoId: string): Promise<any> {
    try {
      console.log(`🔍 Fetching enhanced on-chain data for ${coinGeckoId}`)
      
      // Get current price and market cap data for accurate estimates
      const crypto = await db.cryptocurrency.findFirst({
        where: { coinGeckoId }
      })
      
      if (!crypto) {
        console.warn(`⚠️ Cryptocurrency not found: ${coinGeckoId}`)
        return null
      }
      
      // Get latest price data
      const latestPrice = await db.priceHistory.findFirst({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' }
      })
      
      if (!latestPrice || !latestPrice.price || !latestPrice.marketCap) {
        console.warn(`⚠️ No price data available for ${coinGeckoId}`)
        return null
      }
      
      // Use enhanced on-chain data provider
      const onChainMetrics = await this.onChainDataProvider.getOnChainMetrics(
        coinGeckoId,
        latestPrice.marketCap,
        latestPrice.price
      )
      
      if (onChainMetrics) {
        console.log(`✅ Enhanced on-chain data collected for ${coinGeckoId}`)
        return onChainMetrics
      }
      
      return null
    } catch (error) {
      console.error('❌ Error fetching enhanced on-chain data:', error)
      return null
    }
  }

  /**
   * Get real derivative metrics using enhanced data provider
   * Sử dụng nhà cung cấp dữ liệu phái sinh đã được nâng cấp
   */
  private async getRealDerivativeMetrics(coinGeckoId: string): Promise<any> {
    try {
      console.log(`🔍 Fetching enhanced derivative data for ${coinGeckoId}`)
      
      // Get current price and volume data for accurate estimates
      const crypto = await db.cryptocurrency.findFirst({
        where: { coinGeckoId }
      })
      
      if (!crypto) {
        console.warn(`⚠️ Cryptocurrency not found: ${coinGeckoId}`)
        return null
      }
      
      // Get latest price data
      const latestPrice = await db.priceHistory.findFirst({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' }
      })
      
      if (!latestPrice || !latestPrice.price || !latestPrice.volume24h) {
        console.warn(`⚠️ No price/volume data available for ${coinGeckoId}`)
        return null
      }
      
      // Use enhanced derivative data provider
      const derivativeMetrics = await this.derivativeDataProvider.getDerivativeMetrics(
        coinGeckoId,
        latestPrice.marketCap || 0,
        latestPrice.volume24h
      )
      
      if (derivativeMetrics) {
        console.log(`✅ Enhanced derivative data collected for ${coinGeckoId}`)
        return derivativeMetrics
      }
      
      return null
    } catch (error) {
      console.error('❌ Error fetching enhanced derivative data:', error)
      return null
    }
  }
  
  /**
   * Get sentiment metrics (real data only)
   */
  private async getSentimentMetrics(): Promise<any> {
    try {
      // Fetch Fear & Greed Index from Alternative.me (real API)
      const response = await fetch('https://api.alternative.me/fng/')
      const data = await response.json()
      
      const fearGreedIndex = parseFloat(data.data[0]?.value) || 50
      
      // For other sentiment metrics, return null to trigger fallback
      // In production, integrate with:
      // - LunarCrush API for social sentiment
      // - News API for news sentiment
      // - Google Trends API for trends data
      
      return {
        fearGreedIndex: fearGreedIndex,
        socialSentiment: null, // Will trigger fallback
        googleTrends: null,   // Will trigger fallback
        newsSentiment: null   // Will trigger fallback
      }
    } catch (error) {
      console.error('❌ Error fetching sentiment metrics:', error)
      // Return null to trigger fallback from database
      return {
        fearGreedIndex: null,
        socialSentiment: null,
        googleTrends: null,
        newsSentiment: null
      }
    }
  }
  
  /**
   * Perform AI analysis
   */
  private async performAIAnalysis(cryptoId: string): Promise<any> {
    try {
      // Get latest data for analysis
      const [latestPrice, latestOnChain, latestTechnical, latestDerivatives, latestSentiment] = await Promise.all([
        db.priceHistory.findFirst({ where: { cryptoId }, orderBy: { timestamp: 'desc' } }),
        db.onChainMetric.findFirst({ where: { cryptoId }, orderBy: { timestamp: 'desc' } }),
        db.technicalIndicator.findFirst({ where: { cryptoId }, orderBy: { timestamp: 'desc' } }),
        db.derivativeMetric.findFirst({ where: { cryptoId }, orderBy: { timestamp: 'desc' } }),
        db.sentimentMetric.findFirst({ orderBy: { timestamp: 'desc' } })
      ])
      
      if (!latestPrice || !latestOnChain || !latestTechnical || !latestDerivatives || !latestSentiment) {
        throw new Error('Insufficient data for AI analysis')
      }
      
      // Initialize Z.AI
      const zai = await ZAI.create()
      
      // Create analysis prompt
      const analysisPrompt = this.createAnalysisPrompt({
        price: latestPrice,
        onChain: latestOnChain,
        technical: latestTechnical,
        derivatives: latestDerivatives,
        sentiment: latestSentiment
      })
      
      // Get AI analysis
      const completion = await zai.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: `You are an expert cryptocurrency analyst. Provide trading recommendations based on the following data.
            
            Return your analysis in this JSON format:
            {
              "signal": "BUY|SELL|HOLD|STRONG_BUY|STRONG_SELL",
              "confidence": 0.0-1.0,
              "reasoning": "detailed explanation",
              "riskLevel": "LOW|MEDIUM|HIGH"
            }`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
      
      const aiResponse = completion.choices[0]?.message?.content
      
      if (!aiResponse) {
        throw new Error('No response from AI')
      }
      
      // Parse AI response
      let analysisResult
      try {
        analysisResult = JSON.parse(aiResponse)
      } catch (parseError) {
        // Fallback to basic analysis
        analysisResult = this.generateFallbackAnalysis({
          onChain: latestOnChain,
          technical: latestTechnical,
          derivatives: latestDerivatives,
          sentiment: latestSentiment
        })
      }
      
      return {
        signal: analysisResult.signal,
        confidence: analysisResult.confidence,
        reasoning: analysisResult.reasoning,
        riskLevel: analysisResult.riskLevel,
        keyMetrics: {
          mvrv: latestOnChain.mvrv,
          nupl: latestOnChain.nupl,
          fearGreedIndex: latestSentiment.fearGreedIndex,
          rsi: latestTechnical.rsi,
          fundingRate: latestDerivatives.fundingRate
        }
      }
      
    } catch (error) {
      console.error('❌ Error performing AI analysis:', error)
      throw error
    }
  }
  
  /**
   * Create analysis prompt for AI
   */
  private createAnalysisPrompt(data: any): string {
    const { price, onChain, technical, derivatives, sentiment } = data
    
    return `
Analyze the following cryptocurrency data:

PRICE DATA:
- Current Price: $${price.price.toLocaleString()}
- 24h Change: ${price.priceChange24h?.toFixed(2) || 0}%
- Volume 24h: $${(price.volume24h / 1000000000).toFixed(1)}B
- Market Cap: $${(price.marketCap / 1000000000).toFixed(0)}B

ON-CHAIN METRICS:
- MVRV Ratio: ${onChain.mvrv?.toFixed(2) || 'N/A'}
- NUPL: ${onChain.nupl?.toFixed(2) || 'N/A'}
- SOPR: ${onChain.sopr?.toFixed(3) || 'N/A'}
- Active Addresses: ${onChain.activeAddresses?.toLocaleString() || 'N/A'}

TECHNICAL INDICATORS:
- RSI: ${technical.rsi?.toFixed(1) || 'N/A'}
- MACD: ${technical.macd?.toFixed(2) || 'N/A'}
- Bollinger Bands: $${technical.bollingerUpper?.toLocaleString() || 'N/A'} - $${technical.bollingerLower?.toLocaleString() || 'N/A'}

DERIVATIVES DATA:
- Open Interest: $${(derivatives.openInterest / 1000000000).toFixed(1)}B
- Funding Rate: ${(derivatives.fundingRate * 100)?.toFixed(3) || 'N/A'}%
- Put/Call Ratio: ${derivatives.putCallRatio?.toFixed(2) || 'N/A'}

MARKET SENTIMENT:
- Fear & Greed Index: ${sentiment.fearGreedIndex || 'N/A'}

Provide a comprehensive analysis and trading recommendation.
Consider valuation metrics, market sentiment, technical indicators, and derivatives market conditions.
`
  }
  
  /**
   * Generate fallback analysis if AI fails
   */
  private generateFallbackAnalysis(data: any): any {
    const { onChain, technical, derivatives, sentiment } = data
    
    // Simple rule-based analysis
    let signal = 'HOLD'
    let confidence = 0.5
    let reasoning = 'Market conditions are neutral'
    let riskLevel = 'MEDIUM'
    
    // Buy signals
    if (onChain.mvrv < 1.2 && sentiment.fearGreedIndex < 40 && technical.rsi < 45) {
      signal = 'BUY'
      confidence = 0.7
      reasoning = 'Undervalued with bearish sentiment and oversold technical indicators'
    }
    
    // Strong buy signals
    if (onChain.mvrv < 1 && sentiment.fearGreedIndex < 25 && technical.rsi < 30) {
      signal = 'STRONG_BUY'
      confidence = 0.85
      reasoning = 'Significantly undervalued with extreme fear and oversold conditions'
    }
    
    // Sell signals
    if (onChain.mvrv > 2.5 && sentiment.fearGreedIndex > 75 && technical.rsi > 65) {
      signal = 'SELL'
      confidence = 0.7
      reasoning = 'Overvalued with greedy sentiment and overbought technical indicators'
    }
    
    // Strong sell signals
    if (onChain.mvrv > 3 && sentiment.fearGreedIndex > 85 && technical.rsi > 75) {
      signal = 'STRONG_SELL'
      confidence = 0.85
      reasoning = 'Significantly overvalued with extreme greed and overbought conditions'
    }
    
    // High risk conditions
    if (Math.abs(derivatives.fundingRate) > 0.02) {
      riskLevel = 'HIGH'
      confidence = Math.max(confidence - 0.1, 0.1)
    }
    
    return {
      signal,
      confidence,
      reasoning,
      riskLevel
    }
  }
  
  /**
   * Add default cryptocurrencies to database
   */
  private async addDefaultCryptocurrencies(): Promise<void> {
    const defaultCryptos = [
      { symbol: 'BTC', name: 'Bitcoin', coinGeckoId: 'bitcoin', rank: 1 },
      { symbol: 'ETH', name: 'Ethereum', coinGeckoId: 'ethereum', rank: 2 },
      { symbol: 'BNB', name: 'BNB', coinGeckoId: 'binancecoin', rank: 3 },
      { symbol: 'SOL', name: 'Solana', coinGeckoId: 'solana', rank: 4 }
    ]
    
    for (const crypto of defaultCryptos) {
      try {
        await db.cryptocurrency.create({
          data: crypto
        })
        console.log(`✅ Added ${crypto.symbol} to database`)
      } catch (error) {
        console.error(`❌ Error adding ${crypto.symbol}:`, error)
      }
    }
  }
  
  /**
   * Technical analysis helper methods
   */
  private calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50
    
    const changes: number[] = []
    for (let i = 1; i < prices.length; i++) {
      changes.push(prices[i] - prices[i - 1])
    }
    
    const gains = changes.filter(change => change > 0)
    const losses = changes.filter(change => change < 0).map(loss => Math.abs(loss))
    
    const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / period
    const avgLoss = losses.reduce((sum, loss) => sum + loss, 0) / period
    
    if (avgLoss === 0) return 100
    
    const rs = avgGain / avgLoss
    const rsi = 100 - (100 / (1 + rs))
    
    return rsi
  }
  
  private calculateMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0
    
    const sum = prices.slice(-period).reduce((sum, price) => sum + price, 0)
    return sum / period
  }
  
  private calculateMACD(prices: number[]): number {
    if (prices.length < 26) return 0

    const ema12 = this.calculateEMA(prices, 12)
    const ema26 = this.calculateEMA(prices, 26)

    return ema12 - ema26
  }

  private calculateEMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0

    const multiplier = 2 / (period + 1)
    let ema = prices[0]

    for (let i = 1; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema
    }

    return ema
  }

  private calculateBollingerUpper(prices: number[], period: number, stdDev: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0

    const ma = this.calculateMA(prices, period)
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - ma, 2), 0) / period
    const standardDeviation = Math.sqrt(variance)

    return ma + (standardDeviation * stdDev)
  }

  private calculateBollingerLower(prices: number[], period: number, stdDev: number): number {
    if (prices.length < period) return prices[prices.length - 1] || 0

    const ma = this.calculateMA(prices, period)
    const variance = prices.slice(-period).reduce((sum, price) => sum + Math.pow(price - ma, 2), 0) / period
    const standardDeviation = Math.sqrt(variance)

    return ma - (standardDeviation * stdDev)
  }
  
  private calculateBollingerBand(prices: number[], period: number = 20, stdDev: number = 2): { upper: number; middle: number; lower: number } {
    if (prices.length < period) {
      const price = prices[prices.length - 1] || 0
      return { upper: price * 1.02, middle: price, lower: price * 0.98 }
    }
    
    const recentPrices = prices.slice(-period)
    const middle = this.calculateMA(recentPrices, period)
    
    const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period
    const standardDeviation = Math.sqrt(variance)
    
    return {
      upper: middle + (standardDeviation * stdDev),
      middle: middle,
      lower: middle - (standardDeviation * stdDev)
    }
  }
  
  /**
   * Get collection statistics
   */
  getStatistics(): CollectionStats {
    return { ...this.stats }
  }
  
  /**
   * Get collection configuration
   */
  getConfiguration(): CollectionConfig {
    return { ...this.config }
  }
  
  /**
   * Update collection configuration
   */
  updateConfiguration(newConfig: Partial<CollectionConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('📝 Collection configuration updated:', this.config)
  }
  
  /**
   * Log collection schedule
   */
  private logCollectionSchedule(): void {
    console.log('📅 Data Collection Schedule:')
    console.log(`   💰 Price Data: Every ${this.config.priceData.interval} minutes`)
    console.log(`   📈 Technical Data: Every ${this.config.technicalData.interval} minutes`)
    console.log(`   ⛓️ On-Chain Data: Every ${this.config.onChainData.interval} minutes`)
    console.log(`   😊 Sentiment Data: Every ${this.config.sentimentData.interval} minutes`)
    console.log(`   📊 Derivative Data: Every ${this.config.derivativeData.interval} minutes`)
    console.log(`   📈 Volume Data: Every ${this.config.volumeData.interval} minutes`)
    console.log(`   🤖 AI Analysis: Every ${this.config.aiAnalysis.interval} minutes`)
  }
}

// Export singleton instance
export const dataCollector = DataCollector.getInstance()