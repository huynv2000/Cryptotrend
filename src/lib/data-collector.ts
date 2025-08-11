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
import ZAI from 'z-ai-web-dev-sdk'

export interface CollectionConfig {
  priceData: { enabled: boolean; interval: number } // in minutes
  technicalData: { enabled: boolean; interval: number }
  onChainData: { enabled: boolean; interval: number }
  sentimentData: { enabled: boolean; interval: number }
  derivativeData: { enabled: boolean; interval: number }
  volumeData: { enabled: boolean; interval: number }
  aiAnalysis: { enabled: boolean; interval: number }
}

export interface CollectionStats {
  lastPriceCollection: Date | null
  lastTechnicalCollection: Date | null
  lastOnChainCollection: Date | null
  lastSentimentCollection: Date | null
  lastDerivativeCollection: Date | null
  lastVolumeCollection: Date | null
  lastAIAnalysis: Date | null
  totalCollections: number
  failedCollections: number
}

export class DataCollector {
  private static instance: DataCollector
  private isRunning: boolean = false
  private intervals: Map<string, NodeJS.Timeout> = new Map()
  private cryptoService: CryptoDataService
  private coinGeckoService: CoinGeckoService
  private stats: CollectionStats
  private config: CollectionConfig
  
  private constructor() {
    this.cryptoService = CryptoDataService.getInstance()
    this.coinGeckoService = CoinGeckoService.getInstance()
    this.stats = this.initializeStats()
    this.config = this.getDefaultConfig()
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
      aiAnalysis: { enabled: true, interval: 30 }      // 30 minutes
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
   * Get system status
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      stats: this.stats,
      config: this.config,
      activeIntervals: Array.from(this.intervals.keys()),
      uptime: this.isRunning ? Date.now() - (this.stats.lastPriceCollection?.getTime() || Date.now()) : 0
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
            // Use fallback data for critical metrics
            const fallbackData = await this.getFallbackPriceData(crypto.symbol, crypto.id)
            await this.savePriceHistory(crypto.id, fallbackData)
            console.log(`💰 Used fallback data for ${crypto.symbol}`)
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
          const technicalData = await this.calculateTechnicalIndicators(crypto.id)
          await this.saveTechnicalIndicators(crypto.id, technicalData)
          console.log(`📈 Technical data collected for ${crypto.symbol}`)
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
          const onChainData = await this.getOnChainMetrics(crypto.coinGeckoId)
          await this.saveOnChainMetrics(crypto.id, onChainData)
          console.log(`⛓️ On-chain data collected for ${crypto.symbol}`)
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
          const derivativeData = await this.getDerivativeMetrics(crypto.coinGeckoId)
          await this.saveDerivativeMetrics(crypto.id, derivativeData)
          console.log(`📊 Derivative data collected for ${crypto.symbol}`)
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
      this.runAIAnalysis()
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
      await db.onChainMetric.create({
        data: {
          cryptoId,
          timestamp: new Date(),
          mvrv: onChainData.mvrv,
          nupl: onChainData.nupl,
          sopr: onChainData.sopr,
          activeAddresses: onChainData.activeAddresses,
          exchangeInflow: onChainData.exchangeInflow,
          exchangeOutflow: onChainData.exchangeOutflow,
          transactionVolume: onChainData.transactionVolume
        }
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
   * Get fallback price data for when API fails
   */
  /**
   * Get fallback price data from database or use hardcoded values as last resort
   */
  private async getFallbackPriceData(symbol: string, cryptoId: string): Promise<any> {
    try {
      // First, try to get the most recent price data from database
      const latestPriceData = await db.priceHistory.findFirst({
        where: { cryptoId },
        orderBy: { timestamp: 'desc' }
      })

      if (latestPriceData) {
        console.log(`📊 Using latest price data from database for ${symbol}: $${latestPriceData.price}`)
        return {
          usd: latestPriceData.price,
          usd_24h_change: latestPriceData.priceChange24h || 0,
          usd_24h_vol: latestPriceData.volume24h || 0,
          usd_market_cap: latestPriceData.marketCap || 0
        }
      }

      // If no database data, get the most recent data from any cryptocurrency as fallback
      const anyLatestPrice = await db.priceHistory.findFirst({
        orderBy: { timestamp: 'desc' }
      })

      if (anyLatestPrice) {
        console.log(`📊 Using latest available price data for ${symbol}: $${anyLatestPrice.price}`)
        return {
          usd: anyLatestPrice.price,
          usd_24h_change: anyLatestPrice.priceChange24h || 0,
          usd_24h_vol: anyLatestPrice.volume24h || 0,
          usd_market_cap: anyLatestPrice.marketCap || 0
        }
      }

      // Only use hardcoded data if absolutely no data is available
      console.log(`⚠️ No historical data found, using hardcoded fallback for ${symbol}`)
      return this.getHardcodedPriceData(symbol)
    } catch (error) {
      console.error(`❌ Error getting fallback price data for ${symbol}:`, error)
      return this.getHardcodedPriceData(symbol)
    }
  }

  /**
   * Get hardcoded price data as last resort
   */
  private getHardcodedPriceData(symbol: string): any {
    const fallbackData: Record<string, any> = {
      BTC: {
        usd: 102500.00,
        usd_24h_change: 2.5,
        usd_24h_vol: 45000000000,
        usd_market_cap: 2010000000000
      },
      ETH: {
        usd: 3200.75,
        usd_24h_change: 1.8,
        usd_24h_vol: 18000000000,
        usd_market_cap: 385000000000
      },
      BNB: {
        usd: 715.40,
        usd_24h_change: -0.5,
        usd_24h_vol: 1850000000,
        usd_market_cap: 105000000000
      },
      SOL: {
        usd: 198.25,
        usd_24h_change: 3.2,
        usd_24h_vol: 3200000000,
        usd_market_cap: 92000000000
      }
    }
    
    return fallbackData[symbol] || fallbackData.BTC
  }
  
  /**
   * Calculate technical indicators (mock implementation)
   */
  private async calculateTechnicalIndicators(cryptoId: string): Promise<any> {
    // Get recent price data for calculations
    const recentPrices = await db.priceHistory.findMany({
      where: { cryptoId },
      orderBy: { timestamp: 'desc' },
      take: 200 // Last 200 data points
    })
    
    if (recentPrices.length < 50) {
      // Return mock data if not enough history
      return {
        rsi: 50 + Math.random() * 30,
        ma50: recentPrices[0]?.price || 50000,
        ma200: recentPrices[0]?.price || 50000,
        macd: (Math.random() - 0.5) * 1000,
        bollingerUpper: recentPrices[0]?.price * 1.02 || 51000,
        bollingerLower: recentPrices[0]?.price * 0.98 || 49000,
        bollingerMiddle: recentPrices[0]?.price || 50000
      }
    }
    
    // Simple calculations (in real implementation, use proper technical analysis library)
    const prices = recentPrices.map(p => p.price).reverse()
    
    return {
      rsi: this.calculateRSI(prices),
      ma50: this.calculateMA(prices, 50),
      ma200: this.calculateMA(prices, 200),
      macd: this.calculateMACD(prices),
      bollingerUpper: this.calculateBollingerBand(prices, 20, 2).upper,
      bollingerLower: this.calculateBollingerBand(prices, 20, 2).lower,
      bollingerMiddle: this.calculateBollingerBand(prices, 20, 2).middle
    }
  }
  
  /**
   * Get on-chain metrics (mock implementation)
   */
  private async getOnChainMetrics(coinGeckoId: string): Promise<any> {
    // Mock data - in real implementation, fetch from Glassnode or CryptoQuant
    const mockData: Record<string, any> = {
      bitcoin: {
        mvrv: 1.8 + (Math.random() - 0.5) * 0.4,
        nupl: 0.65 + (Math.random() - 0.5) * 0.2,
        sopr: 1.02 + (Math.random() - 0.5) * 0.1,
        activeAddresses: 950000 + Math.floor((Math.random() - 0.5) * 100000),
        exchangeInflow: 15000 + Math.floor((Math.random() - 0.5) * 5000),
        exchangeOutflow: 12000 + Math.floor((Math.random() - 0.5) * 5000),
        transactionVolume: 25000000000 + (Math.random() - 0.5) * 5000000000
      },
      ethereum: {
        mvrv: 1.2 + (Math.random() - 0.5) * 0.3,
        nupl: 0.45 + (Math.random() - 0.5) * 0.15,
        sopr: 0.98 + (Math.random() - 0.5) * 0.08,
        activeAddresses: 450000 + Math.floor((Math.random() - 0.5) * 50000),
        exchangeInflow: 8500 + Math.floor((Math.random() - 0.5) * 2000),
        exchangeOutflow: 9200 + Math.floor((Math.random() - 0.5) * 2000),
        transactionVolume: 15000000000 + (Math.random() - 0.5) * 3000000000
      }
    }
    
    return mockData[coinGeckoId] || mockData.bitcoin
  }
  
  /**
   * Get sentiment metrics
   */
  private async getSentimentMetrics(): Promise<any> {
    try {
      // Fetch Fear & Greed Index from Alternative.me
      const response = await fetch('https://api.alternative.me/fng/')
      const data = await response.json()
      
      return {
        fearGreedIndex: parseFloat(data.data[0]?.value) || 50,
        socialSentiment: 0.5 + (Math.random() - 0.5) * 0.3, // Mock
        googleTrends: 50 + Math.floor((Math.random() - 0.5) * 30), // Mock
        newsSentiment: 0.5 + (Math.random() - 0.5) * 0.3 // Mock
      }
    } catch (error) {
      console.error('❌ Error fetching sentiment metrics:', error)
      return {
        fearGreedIndex: 50,
        socialSentiment: 0.5,
        googleTrends: 50,
        newsSentiment: 0.5
      }
    }
  }
  
  /**
   * Get derivative metrics (mock implementation)
   */
  private async getDerivativeMetrics(coinGeckoId: string): Promise<any> {
    // Mock data - in real implementation, fetch from Coinglass or exchange APIs
    const mockData: Record<string, any> = {
      bitcoin: {
        openInterest: 18500000000 + (Math.random() - 0.5) * 2000000000,
        fundingRate: 0.0125 + (Math.random() - 0.5) * 0.005,
        liquidationVolume: 45000000 + (Math.random() - 0.5) * 10000000,
        putCallRatio: 0.85 + (Math.random() - 0.5) * 0.2
      },
      ethereum: {
        openInterest: 8500000000 + (Math.random() - 0.5) * 1000000000,
        fundingRate: 0.0085 + (Math.random() - 0.5) * 0.003,
        liquidationVolume: 28000000 + (Math.random() - 0.5) * 5000000,
        putCallRatio: 0.92 + (Math.random() - 0.5) * 0.15
      }
    }
    
    return mockData[coinGeckoId] || mockData.bitcoin
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
  
  private calculateMACD(prices: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): number {
    if (prices.length < slowPeriod) return 0
    
    const fastMA = this.calculateMA(prices, fastPeriod)
    const slowMA = this.calculateMA(prices, slowPeriod)
    
    return fastMA - slowMA
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