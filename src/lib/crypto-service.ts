import axios from 'axios'
import { MARKET_DATA_APIS, hasApiKey } from './config'

// Configuration for various crypto data APIs - now using config
const COINGECKO_BASE_URL = MARKET_DATA_APIS.coingecko.baseUrl
const COINMARKETCAP_BASE_URL = 'https://pro-api.coinmarketcap.com/v1'
const ALTERNATIVE_ME_BASE_URL = 'https://api.alternative.me/fng/'

// CoinGecko API service
export class CoinGeckoService {
  private static instance: CoinGeckoService
  private rateLimitDelay: number = 30000 // 30 seconds between requests for dashboard API calls
  private lastRequestTime: number = 0
  private requestCount: number = 0
  private requestWindowStart: number = Date.now()
  private readonly maxRequestsPerMinute: number = 10 // CoinGecko free tier limit

  static getInstance(): CoinGeckoService {
    if (!CoinGeckoService.instance) {
      CoinGeckoService.instance = new CoinGeckoService()
    }
    return CoinGeckoService.instance
  }

  private async rateLimit() {
    const now = Date.now()
    
    // Reset request count if window has passed
    if (now - this.requestWindowStart > 60000) { // 1 minute window
      this.requestCount = 0
      this.requestWindowStart = now
    }
    
    // Check if we've exceeded the rate limit
    if (this.requestCount >= this.maxRequestsPerMinute) {
      const timeToWait = 60000 - (now - this.requestWindowStart)
      if (timeToWait > 0) {
        console.log(`Rate limit reached. Waiting ${timeToWait/1000} seconds...`)
        await new Promise(resolve => setTimeout(resolve, timeToWait))
        this.requestCount = 0
        this.requestWindowStart = Date.now()
      }
    }
    
    // Apply delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest))
    }
    
    this.lastRequestTime = Date.now()
    this.requestCount++
  }

  async getCoinPrice(coinId: string, vsCurrency: string = 'usd') {
    await this.rateLimit()
    try {
      const params: any = {
        ids: coinId,
        vs_currencies: vsCurrency,
        include_24hr_change: true,
        include_24hr_vol: true,
        include_market_cap: true
      }

      // Add API key if available (for Pro API)
      const headers: any = {}
      if (hasApiKey('coingecko') && MARKET_DATA_APIS.coingecko.proApiKey) {
        headers['x-cg-pro-api-key'] = MARKET_DATA_APIS.coingecko.proApiKey
      }

      const response = await axios.get(`${COINGECKO_BASE_URL}/simple/price`, {
        params,
        headers,
        timeout: 10000 // 10 second timeout
      })
      return response.data[coinId]
    } catch (error: any) {
      console.error('Error fetching coin price:', error.message)
      
      // Return fallback data if API fails
      if (error.response?.status === 429 || error.code === 'ECONNABORTED') {
        console.log('Using fallback data for', coinId)
        return await this.getFallbackData(coinId)
      }
      
      throw error
    }
  }

  private async getFallbackData(coinId: string) {
    try {
      // Import database here to avoid circular dependency
      const { db } = await import('@/lib/db')
      
      // First, try to find the cryptocurrency by coinGeckoId
      const cryptocurrency = await db.cryptocurrency.findFirst({
        where: { coinGeckoId: coinId }
      })

      if (cryptocurrency) {
        // Get the most recent price data from database
        const latestPriceData = await db.priceHistory.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        })

        if (latestPriceData) {
          const lastUpdateTime = new Date(latestPriceData.timestamp)
          const now = new Date()
          const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
          
          console.log(`📊 Using latest price data from database for ${cryptocurrency.symbol}: $${latestPriceData.price} (${hoursAgo}h ago)`)
          return {
            usd: latestPriceData.price,
            usd_24h_change: latestPriceData.priceChange24h || 0,
            usd_24h_vol: latestPriceData.volume24h || 0,
            usd_market_cap: latestPriceData.marketCap || 0,
            last_updated: latestPriceData.timestamp,
            is_outdated: true,
            hours_ago: hoursAgo
          }
        }
      }

      // If no specific data, get the most recent data from any cryptocurrency as fallback
      const anyLatestPrice = await db.priceHistory.findFirst({
        orderBy: { timestamp: 'desc' }
      })

      if (anyLatestPrice) {
        const lastUpdateTime = new Date(anyLatestPrice.timestamp)
        const now = new Date()
        const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
        
        console.log(`📊 Using latest available price data for ${coinId}: $${anyLatestPrice.price} (${hoursAgo}h ago)`)
        return {
          usd: anyLatestPrice.price,
          usd_24h_change: anyLatestPrice.priceChange24h || 0,
          usd_24h_vol: anyLatestPrice.volume24h || 0,
          usd_market_cap: anyLatestPrice.marketCap || 0,
          last_updated: anyLatestPrice.timestamp,
          is_outdated: true,
          hours_ago: hoursAgo
        }
      }

      // Return N/A instead of hardcoded data
      console.log(`⚠️ No historical data found for ${coinId}, returning N/A`)
      return {
        usd: null,
        usd_24h_change: null,
        usd_24h_vol: null,
        usd_market_cap: null,
        error: "N/A - No data available"
      }
    } catch (error) {
      console.error(`❌ Error getting fallback data for ${coinId}:`, error)
      // Return N/A instead of hardcoded data
      return {
        usd: null,
        usd_24h_change: null,
        usd_24h_vol: null,
        usd_market_cap: null,
        error: "N/A - Database error"
      }
    }
  }

  /**
   * Note: Hardcoded fallback data removed as per requirements
   * System now returns N/A when no data is available
   */

  async getCoinMarkets(vsCurrency: string = 'usd', order: string = 'market_cap_desc', perPage: number = 100, page: number = 1) {
    await this.rateLimit()
    try {
      const params: any = {
        vs_currency: vsCurrency,
        order,
        per_page: perPage,
        page,
        sparkline: false,
        price_change_percentage: '24h'
      }

      // Add API key if available (for Pro API)
      const headers: any = {}
      if (hasApiKey('coingecko') && MARKET_DATA_APIS.coingecko.proApiKey) {
        headers['x-cg-pro-api-key'] = MARKET_DATA_APIS.coingecko.proApiKey
      }

      const response = await axios.get(`${COINGECKO_BASE_URL}/coins/markets`, {
        params,
        headers
      })
      return response.data
    } catch (error) {
      console.error('Error fetching coin markets:', error)
      throw error
    }
  }

  async getCoinDetails(coinId: string) {
    await this.rateLimit()
    try {
      const params: any = {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false
      }

      // Add API key if available (for Pro API)
      const headers: any = {}
      if (hasApiKey('coingecko') && MARKET_DATA_APIS.coingecko.proApiKey) {
        headers['x-cg-pro-api-key'] = MARKET_DATA_APIS.coingecko.proApiKey
      }

      const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${coinId}`, {
        params,
        headers
      })
      return response.data
    } catch (error) {
      console.error('Error fetching coin details:', error)
      throw error
    }
  }

  async getMarketChart(coinId: string, vsCurrency: string = 'usd', days: number = 90) {
    await this.rateLimit()
    try {
      const params: any = {
        vs_currency: vsCurrency,
        days: days,
        interval: 'daily'
      }

      // Add API key if available (for Pro API)
      const headers: any = {}
      if (hasApiKey('coingecko') && MARKET_DATA_APIS.coingecko.proApiKey) {
        headers['x-cg-pro-api-key'] = MARKET_DATA_APIS.coingecko.proApiKey
      }

      const response = await axios.get(`${COINGECKO_BASE_URL}/coins/${coinId}/market_chart`, {
        params,
        headers
      })
      return response.data
    } catch (error) {
      console.error('Error fetching market chart:', error)
      
      // Return fallback data if API fails
      if (error && typeof error === 'object' && 'response' in error && (error as any).response?.status === 429 || 
          error && typeof error === 'object' && 'code' in error && (error as any).code === 'ECONNABORTED') {
        console.log('Using fallback market chart data for', coinId)
        return this.getFallbackMarketChart(coinId, days)
      }
      
      throw error
    }
  }

  private getFallbackMarketChart(coinId: string, days: number): any {
    console.log(`⚠️ No market chart data available for ${coinId}, returning empty data`)
    return {
      prices: [],
      total_volumes: [],
      error: "N/A - No chart data available"
    }
  }
}

// Fear & Greed Index service
export class FearGreedService {
  static async getFearGreedIndex() {
    try {
      const headers: any = {}
      
      // Add API key if available
      if (hasApiKey('alternative') && MARKET_DATA_APIS.alternativeMe.apiKey) {
        headers['X-API-Key'] = MARKET_DATA_APIS.alternativeMe.apiKey
      }

      const response = await axios.get(`${ALTERNATIVE_ME_BASE_URL}`, {
        headers
      })
      return response.data
    } catch (error) {
      console.error('Error fetching Fear & Greed index:', error)
      throw error
    }
  }
}

// On-chain metrics service
export class OnChainMetricsService {
  static async getOnChainMetrics(coinId: string) {
    try {
      // Import database here to avoid circular dependency
      const { db } = await import('@/lib/db')
      
      // Try to find the cryptocurrency by coinGeckoId
      const cryptocurrency = await db.cryptocurrency.findFirst({
        where: { coinGeckoId: coinId }
      })

      if (cryptocurrency) {
        // Get the most recent on-chain metrics from database
        const latestMetrics = await db.onChainMetric.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        })

        if (latestMetrics) {
          const lastUpdateTime = new Date(latestMetrics.timestamp)
          const now = new Date()
          const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
          
          console.log(`📊 Using latest on-chain metrics from database for ${cryptocurrency.symbol} (${hoursAgo}h ago)`)
          return {
            ...latestMetrics,
            last_updated: latestMetrics.timestamp,
            is_outdated: true,
            hours_ago: hoursAgo
          }
        }
      }

      // If no specific data, get the most recent on-chain metrics from any cryptocurrency
      const anyLatestMetrics = await db.onChainMetric.findFirst({
        orderBy: { timestamp: 'desc' }
      })

      if (anyLatestMetrics) {
        const lastUpdateTime = new Date(anyLatestMetrics.timestamp)
        const now = new Date()
        const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
        
        console.log(`📊 Using latest available on-chain metrics for ${coinId} (${hoursAgo}h ago)`)
        return {
          ...anyLatestMetrics,
          last_updated: anyLatestMetrics.timestamp,
          is_outdated: true,
          hours_ago: hoursAgo
        }
      }

      // Return N/A instead of mock data
      console.log(`⚠️ No on-chain metrics found for ${coinId}, returning N/A`)
      return {
        mvrv: null,
        nupl: null,
        sopr: null,
        activeAddresses: null,
        exchangeInflow: null,
        exchangeOutflow: null,
        transactionVolume: null,
        supplyDistribution: null,
        whaleHoldingsPercentage: null,
        retailHoldingsPercentage: null,
        exchangeHoldingsPercentage: null,
        error: "N/A - No on-chain data available"
      }
    } catch (error) {
      console.error(`❌ Error getting on-chain metrics for ${coinId}:`, error)
      // Return N/A instead of mock data
      return {
        mvrv: null,
        nupl: null,
        sopr: null,
        activeAddresses: null,
        exchangeInflow: null,
        exchangeOutflow: null,
        transactionVolume: null,
        supplyDistribution: null,
        whaleHoldingsPercentage: null,
        retailHoldingsPercentage: null,
        exchangeHoldingsPercentage: null,
        error: "N/A - Database error"
      }
    }
  }
}

// Technical indicators service
export class TechnicalIndicatorsService {
  static async getTechnicalIndicators(coinId: string) {
    try {
      // Import database here to avoid circular dependency
      const { db } = await import('@/lib/db')
      
      // Try to find the cryptocurrency by coinGeckoId
      const cryptocurrency = await db.cryptocurrency.findFirst({
        where: { coinGeckoId: coinId }
      })

      if (cryptocurrency) {
        // Get the most recent technical indicators from database
        const latestIndicators = await db.technicalIndicator.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        })

        if (latestIndicators) {
          const lastUpdateTime = new Date(latestIndicators.timestamp)
          const now = new Date()
          const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
          
          console.log(`📊 Using latest technical indicators from database for ${cryptocurrency.symbol} (${hoursAgo}h ago)`)
          return {
            ...latestIndicators,
            last_updated: latestIndicators.timestamp,
            is_outdated: true,
            hours_ago: hoursAgo
          }
        }
      }

      // If no specific data, get the most recent technical indicators from any cryptocurrency
      const anyLatestIndicators = await db.technicalIndicator.findFirst({
        orderBy: { timestamp: 'desc' }
      })

      if (anyLatestIndicators) {
        const lastUpdateTime = new Date(anyLatestIndicators.timestamp)
        const now = new Date()
        const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
        
        console.log(`📊 Using latest available technical indicators for ${coinId} (${hoursAgo}h ago)`)
        return {
          ...anyLatestIndicators,
          last_updated: anyLatestIndicators.timestamp,
          is_outdated: true,
          hours_ago: hoursAgo
        }
      }

      // Return N/A instead of mock data
      console.log(`⚠️ No technical indicators found for ${coinId}, returning N/A`)
      return {
        rsi: null,
        ma50: null,
        ma200: null,
        macd: null,
        bollingerUpper: null,
        bollingerLower: null,
        bollingerMiddle: null,
        error: "N/A - No technical indicators available"
      }
    } catch (error) {
      console.error(`❌ Error getting technical indicators for ${coinId}:`, error)
      // Return N/A instead of mock data
      return {
        rsi: null,
        ma50: null,
        ma200: null,
        macd: null,
        bollingerUpper: null,
        bollingerLower: null,
        bollingerMiddle: null,
        error: "N/A - Database error"
      }
    }
  }
}

// Derivatives data service
export class DerivativesService {
  static async getDerivativesData(coinId: string) {
    try {
      // Import database here to avoid circular dependency
      const { db } = await import('@/lib/db')
      
      // Try to find the cryptocurrency by coinGeckoId
      const cryptocurrency = await db.cryptocurrency.findFirst({
        where: { coinGeckoId: coinId }
      })

      if (cryptocurrency) {
        // Get the most recent derivatives data from database
        const latestDerivatives = await db.derivative.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        })

        if (latestDerivatives) {
          const lastUpdateTime = new Date(latestDerivatives.timestamp)
          const now = new Date()
          const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
          
          console.log(`📊 Using latest derivatives data from database for ${cryptocurrency.symbol} (${hoursAgo}h ago)`)
          return {
            ...latestDerivatives,
            last_updated: latestDerivatives.timestamp,
            is_outdated: true,
            hours_ago: hoursAgo
          }
        }
      }

      // If no specific data, get the most recent derivatives data from any cryptocurrency
      const anyLatestDerivatives = await db.derivative.findFirst({
        orderBy: { timestamp: 'desc' }
      })

      if (anyLatestDerivatives) {
        const lastUpdateTime = new Date(anyLatestDerivatives.timestamp)
        const now = new Date()
        const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
        
        console.log(`📊 Using latest available derivatives data for ${coinId} (${hoursAgo}h ago)`)
        return {
          ...anyLatestDerivatives,
          last_updated: anyLatestDerivatives.timestamp,
          is_outdated: true,
          hours_ago: hoursAgo
        }
      }

      // Return N/A instead of mock data
      console.log(`⚠️ No derivatives data found for ${coinId}, returning N/A`)
      return {
        openInterest: null,
        fundingRate: null,
        liquidationVolume: null,
        putCallRatio: null,
        error: "N/A - No derivatives data available"
      }
    } catch (error) {
      console.error(`❌ Error getting derivatives data for ${coinId}:`, error)
      // Return N/A instead of mock data
      return {
        openInterest: null,
        fundingRate: null,
        liquidationVolume: null,
        putCallRatio: null,
        error: "N/A - Database error"
      }
    }
  }
}

// Social sentiment service (Twitter, Reddit)
export class SocialSentimentService {
  static async getSocialSentiment(coinId: string) {
    try {
      // Import database here to avoid circular dependency
      const { db } = await import('@/lib/db')
      
      // Try to find the cryptocurrency by coinGeckoId
      const cryptocurrency = await db.cryptocurrency.findFirst({
        where: { coinGeckoId: coinId }
      })

      if (cryptocurrency) {
        // Get the most recent social sentiment from database
        const latestSentiment = await db.socialSentiment.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        })

        if (latestSentiment) {
          const lastUpdateTime = new Date(latestSentiment.timestamp)
          const now = new Date()
          const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
          
          console.log(`📊 Using latest social sentiment from database for ${cryptocurrency.symbol} (${hoursAgo}h ago)`)
          return {
            ...latestSentiment,
            last_updated: latestSentiment.timestamp,
            is_outdated: true,
            hours_ago: hoursAgo
          }
        }
      }

      // If no specific data, get the most recent social sentiment from any cryptocurrency
      const anyLatestSentiment = await db.socialSentiment.findFirst({
        orderBy: { timestamp: 'desc' }
      })

      if (anyLatestSentiment) {
        const lastUpdateTime = new Date(anyLatestSentiment.timestamp)
        const now = new Date()
        const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
        
        console.log(`📊 Using latest available social sentiment for ${coinId} (${hoursAgo}h ago)`)
        return {
          ...anyLatestSentiment,
          last_updated: anyLatestSentiment.timestamp,
          is_outdated: true,
          hours_ago: hoursAgo
        }
      }

      // Return N/A instead of mock data
      console.log(`⚠️ No social sentiment found for ${coinId}, returning N/A`)
      return {
        twitterSentiment: null,
        redditSentiment: null,
        socialVolume: null,
        engagementRate: null,
        influencerSentiment: null,
        trendingScore: null,
        error: "N/A - No social sentiment available"
      }
    } catch (error) {
      console.error(`❌ Error getting social sentiment for ${coinId}:`, error)
      // Return N/A instead of mock data
      return {
        twitterSentiment: null,
        redditSentiment: null,
        socialVolume: null,
        engagementRate: null,
        influencerSentiment: null,
        trendingScore: null,
        error: "N/A - Database error"
      }
    }
  }
}

// News sentiment service
export class NewsSentimentService {
  static async getNewsSentiment(coinId: string) {
    try {
      // Import database here to avoid circular dependency
      const { db } = await import('@/lib/db')
      
      // Try to find the cryptocurrency by coinGeckoId
      const cryptocurrency = await db.cryptocurrency.findFirst({
        where: { coinGeckoId: coinId }
      })

      if (cryptocurrency) {
        // Get the most recent news sentiment from database
        const latestSentiment = await db.newsSentiment.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        })

        if (latestSentiment) {
          const lastUpdateTime = new Date(latestSentiment.timestamp)
          const now = new Date()
          const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
          
          console.log(`📊 Using latest news sentiment from database for ${cryptocurrency.symbol} (${hoursAgo}h ago)`)
          return {
            ...latestSentiment,
            last_updated: latestSentiment.timestamp,
            is_outdated: true,
            hours_ago: hoursAgo
          }
        }
      }

      // If no specific data, get the most recent news sentiment from any cryptocurrency
      const anyLatestSentiment = await db.newsSentiment.findFirst({
        orderBy: { timestamp: 'desc' }
      })

      if (anyLatestSentiment) {
        const lastUpdateTime = new Date(anyLatestSentiment.timestamp)
        const now = new Date()
        const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
        
        console.log(`📊 Using latest available news sentiment for ${coinId} (${hoursAgo}h ago)`)
        return {
          ...anyLatestSentiment,
          last_updated: anyLatestSentiment.timestamp,
          is_outdated: true,
          hours_ago: hoursAgo
        }
      }

      // Return N/A instead of mock data
      console.log(`⚠️ No news sentiment found for ${coinId}, returning N/A`)
      return {
        newsSentiment: null,
        newsVolume: null,
        positiveNewsCount: null,
        negativeNewsCount: null,
        neutralNewsCount: null,
        sentimentScore: null,
        buzzScore: null,
        error: "N/A - No news sentiment available"
      }
    } catch (error) {
      console.error(`❌ Error getting news sentiment for ${coinId}:`, error)
      // Return N/A instead of mock data
      return {
        newsSentiment: null,
        newsVolume: null,
        positiveNewsCount: null,
        negativeNewsCount: null,
        neutralNewsCount: null,
        sentimentScore: null,
        buzzScore: null,
        error: "N/A - Database error"
      }
    }
  }
}

// Google Trends service
export class GoogleTrendsService {
  static async getGoogleTrends(coinId: string) {
    try {
      // Import database here to avoid circular dependency
      const { db } = await import('@/lib/db')
      
      // Try to find the cryptocurrency by coinGeckoId
      const cryptocurrency = await db.cryptocurrency.findFirst({
        where: { coinGeckoId: coinId }
      })

      if (cryptocurrency) {
        // Get the most recent Google Trends data from database
        const latestTrends = await db.googleTrend.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        })

        if (latestTrends) {
          const lastUpdateTime = new Date(latestTrends.timestamp)
          const now = new Date()
          const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
          
          console.log(`📊 Using latest Google Trends from database for ${cryptocurrency.symbol} (${hoursAgo}h ago)`)
          return {
            ...latestTrends,
            last_updated: latestTrends.timestamp,
            is_outdated: true,
            hours_ago: hoursAgo
          }
        }
      }

      // If no specific data, get the most recent Google Trends data from any cryptocurrency
      const anyLatestTrends = await db.googleTrend.findFirst({
        orderBy: { timestamp: 'desc' }
      })

      if (anyLatestTrends) {
        const lastUpdateTime = new Date(anyLatestTrends.timestamp)
        const now = new Date()
        const hoursAgo = Math.floor((now.getTime() - lastUpdateTime.getTime()) / (1000 * 60 * 60))
        
        console.log(`📊 Using latest available Google Trends for ${coinId} (${hoursAgo}h ago)`)
        return {
          ...anyLatestTrends,
          last_updated: anyLatestTrends.timestamp,
          is_outdated: true,
          hours_ago: hoursAgo
        }
      }

      // Return N/A instead of mock data
      console.log(`⚠️ No Google Trends found for ${coinId}, returning N/A`)
      return {
        trendsScore: null,
        searchVolume: null,
        trendingKeywords: null,
        regionalInterest: null,
        relatedQueries: null,
        trendDirection: null,
        error: "N/A - No Google Trends available"
      }
    } catch (error) {
      console.error(`❌ Error getting Google Trends for ${coinId}:`, error)
      // Return N/A instead of mock data
      return {
        trendsScore: null,
        searchVolume: null,
        trendingKeywords: null,
        regionalInterest: null,
        relatedQueries: null,
        trendDirection: null,
        error: "N/A - Database error"
      }
    }
  }
}

// Main crypto service that coordinates all data sources
export class CryptoDataService {
  private static instance: CryptoDataService
  private coinGeckoService: CoinGeckoService

  constructor() {
    this.coinGeckoService = CoinGeckoService.getInstance()
  }

  static getInstance(): CryptoDataService {
    if (!CryptoDataService.instance) {
      CryptoDataService.instance = new CryptoDataService()
    }
    return CryptoDataService.instance
  }

  async getCompleteCryptoData(coinId: string) {
    try {
      // First, try to get the cryptocurrency ID from the database
      const { db } = await import('@/lib/db')
      const cryptocurrency = await db.cryptocurrency.findFirst({
        where: { coinGeckoId: coinId }
      })

      if (!cryptocurrency) {
        throw new Error(`Cryptocurrency with coinGeckoId ${coinId} not found in database`)
      }

      // Try to get data from database first
      const [
        latestPriceData,
        latestOnChainData,
        latestTechnicalData,
        latestDerivativeData,
        latestSentimentData
      ] = await Promise.all([
        db.priceHistory.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        }),
        db.onChainMetric.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        }),
        db.technicalIndicator.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        }),
        db.derivativeMetric.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        }),
        db.sentimentMetric.findFirst({
          orderBy: { timestamp: 'desc' }
        })
      ])

      // Get price data (always fetch fresh or use fallback)
      let priceData
      try {
        priceData = await this.coinGeckoService.getCoinPrice(coinId)
      } catch (error) {
        console.log(`Using fallback price data for ${coinId}`)
        priceData = {
          usd: latestPriceData?.price || 50000,
          usd_24h_change: latestPriceData?.priceChange24h || 0,
          usd_24h_vol: latestPriceData?.volume24h || 0,
          usd_market_cap: latestPriceData?.marketCap || 0
        }
      }

      // Use database data if available, otherwise fetch from services
      const onChainData = latestOnChainData ? {
        mvrv: latestOnChainData.mvrv || 0,
        nupl: latestOnChainData.nupl || 0,
        sopr: latestOnChainData.sopr || 0,
        activeAddresses: latestOnChainData.activeAddresses || 0,
        exchangeInflow: latestOnChainData.exchangeInflow || 0,
        exchangeOutflow: latestOnChainData.exchangeOutflow || 0,
        transactionVolume: latestOnChainData.transactionVolume || 0,
        supplyDistribution: latestOnChainData.supplyDistribution || {},
        whaleHoldingsPercentage: latestOnChainData.whaleHoldingsPercentage || 0,
        retailHoldingsPercentage: latestOnChainData.retailHoldingsPercentage || 0,
        exchangeHoldingsPercentage: latestOnChainData.exchangeHoldingsPercentage || 0
      } : await OnChainMetricsService.getOnChainMetrics(coinId)

      const technicalData = latestTechnicalData ? {
        rsi: latestTechnicalData.rsi || 50,
        ma50: latestTechnicalData.ma50 || 0,
        ma200: latestTechnicalData.ma200 || 0,
        macd: latestTechnicalData.macd || 0,
        macdSignal: latestTechnicalData.macdSignal || 0,
        bollingerUpper: latestTechnicalData.bollingerUpper || 0,
        bollingerLower: latestTechnicalData.bollingerLower || 0,
        bollingerMiddle: latestTechnicalData.bollingerMiddle || 0
      } : await TechnicalIndicatorsService.getTechnicalIndicators(coinId)

      const derivativesData = latestDerivativeData ? {
        openInterest: latestDerivativeData.openInterest || 0,
        fundingRate: latestDerivativeData.fundingRate || 0,
        liquidationVolume: latestDerivativeData.liquidationVolume || 0,
        putCallRatio: latestDerivativeData.putCallRatio || 1
      } : await DerivativesService.getDerivativesData(coinId)

      // Get sentiment data
      let fearGreedData
      try {
        fearGreedData = await FearGreedService.getFearGreedIndex()
      } catch (error) {
        fearGreedData = { data: [{ value: latestSentimentData?.fearGreedIndex || 50, value_classification: 'Neutral' }] }
      }

      const socialSentimentData = await SocialSentimentService.getSocialSentiment(coinId)
      const newsSentimentData = await NewsSentimentService.getNewsSentiment(coinId)
      const googleTrendsData = await GoogleTrendsService.getGoogleTrends(coinId)

      return {
        price: priceData,
        onChain: onChainData,
        technical: technicalData,
        derivatives: derivativesData,
        sentiment: {
          fearGreedIndex: fearGreedData.data[0]?.value || 50,
          fearGreedClassification: fearGreedData.data[0]?.value_classification || 'Neutral',
          social: socialSentimentData,
          news: newsSentimentData,
          googleTrends: googleTrendsData
        },
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error fetching complete crypto data:', error)
      throw error
    }
  }

  async getTopCryptocurrencies(limit: number = 50) {
    try {
      const markets = await this.coinGeckoService.getCoinMarkets('usd', 'market_cap_desc', limit)
      return markets.map((coin: any) => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h,
        volume24h: coin.total_volume,
        marketCap: coin.market_cap,
        image: coin.image
      }))
    } catch (error) {
      console.error('Error fetching top cryptocurrencies:', error)
      throw error
    }
  }

  async getCoinMarkets(vsCurrency: string = 'usd', order: string = 'market_cap_desc', perPage: number = 100, page: number = 1) {
    try {
      return await this.coinGeckoService.getCoinMarkets(vsCurrency, order, perPage, page)
    } catch (error) {
      console.error('Error fetching coin markets:', error)
      throw error
    }
  }

  async getCoinDetails(coinId: string) {
    try {
      return await this.coinGeckoService.getCoinDetails(coinId)
    } catch (error) {
      console.error('Error fetching coin details:', error)
      throw error
    }
  }
}