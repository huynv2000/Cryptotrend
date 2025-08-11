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
          console.log(`📊 Using latest price data from database for ${cryptocurrency.symbol}: $${latestPriceData.price}`)
          return {
            usd: latestPriceData.price,
            usd_24h_change: latestPriceData.priceChange24h || 0,
            usd_24h_vol: latestPriceData.volume24h || 0,
            usd_market_cap: latestPriceData.marketCap || 0
          }
        }
      }

      // If no specific data, get the most recent data from any cryptocurrency as fallback
      const anyLatestPrice = await db.priceHistory.findFirst({
        orderBy: { timestamp: 'desc' }
      })

      if (anyLatestPrice) {
        console.log(`📊 Using latest available price data for ${coinId}: $${anyLatestPrice.price}`)
        return {
          usd: anyLatestPrice.price,
          usd_24h_change: anyLatestPrice.priceChange24h || 0,
          usd_24h_vol: anyLatestPrice.volume24h || 0,
          usd_market_cap: anyLatestPrice.marketCap || 0
        }
      }

      // Only use hardcoded data if absolutely no data is available
      console.log(`⚠️ No historical data found, using hardcoded fallback for ${coinId}`)
      return this.getHardcodedFallbackData(coinId)
    } catch (error) {
      console.error(`❌ Error getting fallback data for ${coinId}:`, error)
      return this.getHardcodedFallbackData(coinId)
    }
  }

  /**
   * Get hardcoded fallback data as last resort
   */
  private getHardcodedFallbackData(coinId: string) {
    const fallbackData: Record<string, any> = {
      bitcoin: {
        usd: 116627.00,
        usd_24h_change: 1.46,
        usd_24h_vol: 43043699449,
        usd_market_cap: 2321404684888
      },
      ethereum: {
        usd: 3895.84,
        usd_24h_change: 4.74,
        usd_24h_vol: 38056175305,
        usd_market_cap: 470352765059
      },
      binancecoin: {
        usd: 786.25,
        usd_24h_change: 2.69,
        usd_24h_vol: 1305142628,
        usd_market_cap: 109525986934
      },
      solana: {
        usd: 175.62,
        usd_24h_change: 3.76,
        usd_24h_vol: 6577578953,
        usd_market_cap: 94687148086
      },
      ethena: {
        usd: 0.85,
        usd_24h_change: 2.1,
        usd_24h_vol: 15000000,
        usd_market_cap: 320000000
      }
    }

    // If coin exists in fallback data, return it
    if (fallbackData[coinId]) {
      return fallbackData[coinId]
    }

    // Generate realistic fallback data for unknown coins
    const basePrice = 100 + Math.random() * 1000 // Random between $100 and $1100
    const changePercent = (Math.random() - 0.5) * 10 // Random between -5% and +5%
    
    return {
      usd: basePrice,
      usd_24h_change: changePercent,
      usd_24h_vol: basePrice * (1000000 + Math.random() * 10000000), // Volume based on price
      usd_market_cap: basePrice * (100000000 + Math.random() * 1000000000) // Market cap based on price
    }
  }

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
    const knownFallbacks: Record<string, { price: number; volume: number }> = {
      bitcoin: { price: 116627, volume: 43043699449 },
      ethereum: { price: 3895.84, volume: 38056175305 },
      binancecoin: { price: 786.25, volume: 1305142628 },
      solana: { price: 175.62, volume: 6577578953 }
    }
    
    const fallback = knownFallbacks[coinId] || { 
      price: 100 + Math.random() * 1000, 
      volume: 1000000 + Math.random() * 10000000 
    }
    
    const prices: [number, number][] = []
    const volumes: [number, number][] = []
    const now = Date.now()
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000)
      const priceVariation = (Math.random() - 0.5) * 0.02
      const volumeVariation = (Math.random() - 0.5) * 0.3
      
      prices.push([timestamp, fallback.price * (1 + priceVariation)] as [number, number])
      volumes.push([timestamp, fallback.volume * (1 + volumeVariation)] as [number, number])
    }
    
    return { prices, total_volumes: volumes }
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

// Mock data for on-chain metrics (in real implementation, you'd use Glassnode/CryptoQuant APIs)
export class OnChainMetricsService {
  static async getOnChainMetrics(coinId: string) {
    // Base mock data structure that can be applied to any coin
    const baseMockData = {
      mvrv: 1.5 + (Math.random() - 0.5) * 1.0, // Random between 1.0 and 2.0
      nupl: 0.5 + (Math.random() - 0.5) * 0.6, // Random between 0.2 and 0.8
      sopr: 1.0 + (Math.random() - 0.5) * 0.2, // Random between 0.9 and 1.1
      activeAddresses: Math.floor(100000 + Math.random() * 900000), // Random between 100k and 1M
      exchangeInflow: Math.floor(5000 + Math.random() * 15000), // Random between 5k and 20k
      exchangeOutflow: Math.floor(5000 + Math.random() * 15000), // Random between 5k and 20k
      transactionVolume: Math.floor(10000000000 + Math.random() * 20000000000), // Random between 10B and 30B
      supplyDistribution: {
        whaleHoldings: { percentage: 35 + Math.random() * 20, addressCount: Math.floor(500 + Math.random() * 1000) },
        retailHoldings: { percentage: 35 + Math.random() * 20, addressCount: Math.floor(10000000 + Math.random() * 50000000) },
        exchangeHoldings: { percentage: 8 + Math.random() * 8, addressCount: Math.floor(100 + Math.random() * 200) },
        otherHoldings: { percentage: 5 + Math.random() * 10, addressCount: Math.floor(50000 + Math.random() * 200000) }
      },
      whaleHoldingsPercentage: 0,
      retailHoldingsPercentage: 0,
      exchangeHoldingsPercentage: 0
    }

    // Calculate percentages from supply distribution
    baseMockData.whaleHoldingsPercentage = baseMockData.supplyDistribution.whaleHoldings.percentage
    baseMockData.retailHoldingsPercentage = baseMockData.supplyDistribution.retailHoldings.percentage
    baseMockData.exchangeHoldingsPercentage = baseMockData.supplyDistribution.exchangeHoldings.percentage

    // Specific adjustments for known coins
    const knownCoinAdjustments: Record<string, Partial<any>> = {
      bitcoin: {
        mvrv: 1.8,
        nupl: 0.65,
        sopr: 1.02,
        activeAddresses: 950000,
        exchangeInflow: 15000,
        exchangeOutflow: 12000,
        transactionVolume: 25000000000,
        supplyDistribution: {
          whaleHoldings: { percentage: 42.3, addressCount: 850 },
          retailHoldings: { percentage: 38.7, addressCount: 42000000 },
          exchangeHoldings: { percentage: 12.5, addressCount: 150 },
          otherHoldings: { percentage: 6.5, addressCount: 120000 }
        }
      },
      ethereum: {
        mvrv: 1.2,
        nupl: 0.45,
        sopr: 0.98,
        activeAddresses: 450000,
        exchangeInflow: 8500,
        exchangeOutflow: 9200,
        transactionVolume: 15000000000,
        supplyDistribution: {
          whaleHoldings: { percentage: 38.5, addressCount: 1200 },
          retailHoldings: { percentage: 45.2, addressCount: 85000000 },
          exchangeHoldings: { percentage: 11.8, addressCount: 200 },
          otherHoldings: { percentage: 4.5, addressCount: 350000 }
        }
      },
      binancecoin: {
        mvrv: 1.4,
        nupl: 0.55,
        sopr: 1.01,
        activeAddresses: 280000,
        exchangeInflow: 6500,
        exchangeOutflow: 7200,
        transactionVolume: 8500000000,
        supplyDistribution: {
          whaleHoldings: { percentage: 45.2, addressCount: 420 },
          retailHoldings: { percentage: 35.8, addressCount: 25000000 },
          exchangeHoldings: { percentage: 15.5, addressCount: 85 },
          otherHoldings: { percentage: 3.5, addressCount: 180000 }
        }
      },
      solana: {
        mvrv: 1.6,
        nupl: 0.58,
        sopr: 1.05,
        activeAddresses: 320000,
        exchangeInflow: 4800,
        exchangeOutflow: 5200,
        transactionVolume: 6200000000,
        supplyDistribution: {
          whaleHoldings: { percentage: 41.8, addressCount: 680 },
          retailHoldings: { percentage: 42.1, addressCount: 18000000 },
          exchangeHoldings: { percentage: 10.2, addressCount: 120 },
          otherHoldings: { percentage: 5.9, addressCount: 95000 }
        }
      }
    }

    // Apply known coin adjustments if available, otherwise use base mock data
    const mockData = {
      ...baseMockData,
      ...knownCoinAdjustments[coinId],
      supplyDistribution: {
        ...baseMockData.supplyDistribution,
        ...knownCoinAdjustments[coinId]?.supplyDistribution
      }
    }

    // Recalculate percentages
    mockData.whaleHoldingsPercentage = mockData.supplyDistribution.whaleHoldings.percentage
    mockData.retailHoldingsPercentage = mockData.supplyDistribution.retailHoldings.percentage
    mockData.exchangeHoldingsPercentage = mockData.supplyDistribution.exchangeHoldings.percentage

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return mockData
  }
}

// Mock technical indicators service
export class TechnicalIndicatorsService {
  static async getTechnicalIndicators(coinId: string) {
    // Get base price from fallback data to calculate realistic technical indicators
    const fallbackData = new CoinGeckoService().getFallbackData(coinId)
    const basePrice = fallbackData?.usd || 50000
    
    // Generate realistic technical indicators based on base price
    const mockData = {
      rsi: 45 + Math.random() * 30, // Random between 45 and 75
      ma50: basePrice * (0.95 + Math.random() * 0.1), // ±5% from base price
      ma200: basePrice * (0.9 + Math.random() * 0.2), // ±10% from base price
      macd: (Math.random() - 0.5) * basePrice * 0.02, // ±1% of base price
      bollingerUpper: basePrice * (1.05 + Math.random() * 0.05), // +5% to +10%
      bollingerLower: basePrice * (0.95 - Math.random() * 0.05), // -5% to -10%
      bollingerMiddle: basePrice
    }

    // Specific adjustments for known coins
    const knownCoinAdjustments: Record<string, Partial<any>> = {
      bitcoin: {
        rsi: 58.5,
        ma50: 112000,
        ma200: 108000,
        macd: 145.5,
        bollingerUpper: 122000,
        bollingerLower: 111000,
        bollingerMiddle: 116627
      },
      ethereum: {
        rsi: 62.3,
        ma50: 3750,
        ma200: 3550,
        macd: 85.2,
        bollingerUpper: 4150,
        bollingerLower: 3640,
        bollingerMiddle: 3895.84
      },
      binancecoin: {
        rsi: 55.8,
        ma50: 765,
        ma200: 742,
        macd: 12.3,
        bollingerUpper: 845,
        bollingerLower: 728,
        bollingerMiddle: 786.25
      },
      solana: {
        rsi: 61.2,
        ma50: 168,
        ma200: 162,
        macd: 8.7,
        bollingerUpper: 192,
        bollingerLower: 159,
        bollingerMiddle: 175.62
      }
    }

    // Apply known coin adjustments if available, otherwise use generated mock data
    const finalData = {
      ...mockData,
      ...knownCoinAdjustments[coinId]
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))
    
    return finalData
  }
}

// Mock derivatives data service
export class DerivativesService {
  static async getDerivativesData(coinId: string) {
    // Get base price from fallback data to calculate realistic derivatives metrics
    const fallbackData = new CoinGeckoService().getFallbackData(coinId)
    const basePrice = fallbackData?.usd || 50000
    const marketCap = fallbackData?.usd_market_cap || 1000000000000
    
    // Generate realistic derivatives data based on market cap
    const mockData = {
      openInterest: marketCap * (0.01 + Math.random() * 0.02), // 1-3% of market cap
      fundingRate: (Math.random() - 0.5) * 0.04, // Random between -0.02 and +0.02
      liquidationVolume: Math.floor(10000000 + Math.random() * 40000000), // $10M to $50M
      putCallRatio: 0.7 + Math.random() * 0.6 // Random between 0.7 and 1.3
    }

    // Specific adjustments for known coins
    const knownCoinAdjustments: Record<string, Partial<any>> = {
      bitcoin: {
        openInterest: 18500000000,
        fundingRate: 0.0125,
        liquidationVolume: 45000000,
        putCallRatio: 0.85
      },
      ethereum: {
        openInterest: 8500000000,
        fundingRate: 0.0085,
        liquidationVolume: 28000000,
        putCallRatio: 0.92
      },
      binancecoin: {
        openInterest: 2200000000,
        fundingRate: 0.0065,
        liquidationVolume: 15000000,
        putCallRatio: 0.78
      },
      solana: {
        openInterest: 1800000000,
        fundingRate: 0.0095,
        liquidationVolume: 12000000,
        putCallRatio: 0.88
      }
    }

    // Apply known coin adjustments if available, otherwise use generated mock data
    const finalData = {
      ...mockData,
      ...knownCoinAdjustments[coinId]
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400))
    
    return finalData
  }
}

// Mock social sentiment service (Twitter, Reddit)
export class SocialSentimentService {
  static async getSocialSentiment(coinId: string) {
    // Generate realistic social sentiment data for any coin
    const mockData = {
      twitterSentiment: 0.5 + Math.random() * 0.3, // Random between 0.5 and 0.8
      redditSentiment: 0.5 + Math.random() * 0.3, // Random between 0.5 and 0.8
      socialVolume: Math.floor(20000 + Math.random() * 40000), // Random between 20k and 60k
      engagementRate: 0.05 + Math.random() * 0.1, // Random between 0.05 and 0.15
      influencerSentiment: 0.6 + Math.random() * 0.25, // Random between 0.6 and 0.85
      trendingScore: Math.floor(60 + Math.random() * 30) // Random between 60 and 90
    }

    // Specific adjustments for known coins
    const knownCoinAdjustments: Record<string, Partial<any>> = {
      bitcoin: {
        twitterSentiment: 0.68,
        redditSentiment: 0.72,
        socialVolume: 45000,
        engagementRate: 0.085,
        influencerSentiment: 0.75,
        trendingScore: 85
      },
      ethereum: {
        twitterSentiment: 0.65,
        redditSentiment: 0.70,
        socialVolume: 38000,
        engagementRate: 0.078,
        influencerSentiment: 0.72,
        trendingScore: 78
      },
      binancecoin: {
        twitterSentiment: 0.62,
        redditSentiment: 0.68,
        socialVolume: 28000,
        engagementRate: 0.065,
        influencerSentiment: 0.70,
        trendingScore: 72
      },
      solana: {
        twitterSentiment: 0.71,
        redditSentiment: 0.74,
        socialVolume: 32000,
        engagementRate: 0.082,
        influencerSentiment: 0.78,
        trendingScore: 81
      }
    }

    // Apply known coin adjustments if available, otherwise use generated mock data
    const finalData = {
      ...mockData,
      ...knownCoinAdjustments[coinId]
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600))
    
    return finalData
  }
}

// Mock news sentiment service
export class NewsSentimentService {
  static async getNewsSentiment(coinId: string) {
    // Generate realistic news sentiment data for any coin
    const totalNews = Math.floor(500 + Math.random() * 1000) // Random between 500 and 1500
    const positiveRatio = 0.5 + Math.random() * 0.2 // Random between 0.5 and 0.7
    const negativeRatio = 0.2 + Math.random() * 0.2 // Random between 0.2 and 0.4
    
    const mockData = {
      newsSentiment: 0.5 + Math.random() * 0.2, // Random between 0.5 and 0.7
      newsVolume: totalNews,
      positiveNewsCount: Math.floor(totalNews * positiveRatio),
      negativeNewsCount: Math.floor(totalNews * negativeRatio),
      neutralNewsCount: totalNews - Math.floor(totalNews * positiveRatio) - Math.floor(totalNews * negativeRatio),
      sentimentScore: 0.5 + Math.random() * 0.2, // Random between 0.5 and 0.7
      buzzScore: Math.floor(60 + Math.random() * 25) // Random between 60 and 85
    }

    // Specific adjustments for known coins
    const knownCoinAdjustments: Record<string, Partial<any>> = {
      bitcoin: {
        newsSentiment: 0.62,
        newsVolume: 1250,
        positiveNewsCount: 780,
        negativeNewsCount: 320,
        neutralNewsCount: 150,
        sentimentScore: 0.62,
        buzzScore: 75
      },
      ethereum: {
        newsSentiment: 0.58,
        newsVolume: 980,
        positiveNewsCount: 590,
        negativeNewsCount: 280,
        neutralNewsCount: 110,
        sentimentScore: 0.58,
        buzzScore: 68
      },
      binancecoin: {
        newsSentiment: 0.55,
        newsVolume: 720,
        positiveNewsCount: 420,
        negativeNewsCount: 210,
        neutralNewsCount: 90,
        sentimentScore: 0.55,
        buzzScore: 62
      },
      solana: {
        newsSentiment: 0.64,
        newsVolume: 850,
        positiveNewsCount: 520,
        negativeNewsCount: 180,
        neutralNewsCount: 150,
        sentimentScore: 0.64,
        buzzScore: 71
      }
    }

    // Apply known coin adjustments if available, otherwise use generated mock data
    const finalData = {
      ...mockData,
      ...knownCoinAdjustments[coinId]
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return finalData
  }
}

// Mock Google Trends service
export class GoogleTrendsService {
  static async getGoogleTrends(coinId: string) {
    // Generate realistic Google Trends data for any coin
    const mockData = {
      trendsScore: Math.floor(50 + Math.random() * 40), // Random between 50 and 90
      searchVolume: Math.floor(200000 + Math.random() * 800000), // Random between 200k and 1M
      trendingKeywords: [
        `${coinId} price`,
        `${coinId} news`,
        `${coinId} prediction`
      ],
      regionalInterest: {
        US: Math.floor(60 + Math.random() * 30),
        CN: Math.floor(40 + Math.random() * 40),
        EU: Math.floor(50 + Math.random() * 30),
        JP: Math.floor(30 + Math.random() * 30),
        KR: Math.floor(35 + Math.random() * 30)
      },
      relatedQueries: [
        { query: `${coinId} price today`, score: Math.floor(80 + Math.random() * 20), rising: Math.random() > 0.5 },
        { query: `${coinId} prediction`, score: Math.floor(60 + Math.random() * 30), rising: Math.random() > 0.5 },
        { query: `${coinId} analysis`, score: Math.floor(40 + Math.random() * 40), rising: Math.random() > 0.5 }
      ],
      trendDirection: ['rising', 'stable', 'falling'][Math.floor(Math.random() * 3)] as 'rising' | 'stable' | 'falling'
    }

    // Specific adjustments for known coins
    const knownCoinAdjustments: Record<string, Partial<any>> = {
      bitcoin: {
        trendsScore: 78,
        searchVolume: 850000,
        trendingKeywords: ['bitcoin price', 'btc news', 'bitcoin mining'],
        regionalInterest: {
          US: 85,
          CN: 72,
          EU: 68,
          JP: 45,
          KR: 52
        },
        relatedQueries: [
          { query: 'bitcoin price today', score: 95, rising: true },
          { query: 'bitcoin prediction', score: 78, rising: true },
          { query: 'bitcoin mining', score: 65, rising: false }
        ],
        trendDirection: 'rising'
      },
      ethereum: {
        trendsScore: 65,
        searchVolume: 620000,
        trendingKeywords: ['ethereum price', 'eth news', 'ethereum 2.0'],
        regionalInterest: {
          US: 72,
          CN: 58,
          EU: 65,
          JP: 38,
          KR: 45
        },
        relatedQueries: [
          { query: 'ethereum price today', score: 88, rising: true },
          { query: 'ethereum merge', score: 72, rising: false },
          { query: 'ethereum gas fees', score: 58, rising: true }
        ],
        trendDirection: 'stable'
      },
      binancecoin: {
        trendsScore: 58,
        searchVolume: 420000,
        trendingKeywords: ['bnb price', 'binance news', 'bnb staking'],
        regionalInterest: {
          US: 65,
          CN: 78,
          EU: 52,
          JP: 42,
          KR: 68
        },
        relatedQueries: [
          { query: 'bnb price today', score: 82, rising: true },
          { query: 'binance staking', score: 68, rising: false },
          { query: 'bnb news', score: 55, rising: true }
        ],
        trendDirection: 'stable'
      },
      solana: {
        trendsScore: 71,
        searchVolume: 580000,
        trendingKeywords: ['solana price', 'sol news', 'solana nft'],
        regionalInterest: {
          US: 78,
          CN: 45,
          EU: 62,
          JP: 38,
          KR: 55
        },
        relatedQueries: [
          { query: 'solana price today', score: 85, rising: true },
          { query: 'solana nft', score: 72, rising: true },
          { query: 'solana vs ethereum', score: 48, rising: false }
        ],
        trendDirection: 'rising'
      }
    }

    // Apply known coin adjustments if available, otherwise use generated mock data
    const finalData = {
      ...mockData,
      ...knownCoinAdjustments[coinId]
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 700))
    
    return finalData
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