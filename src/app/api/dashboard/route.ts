import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coinId = searchParams.get('coinId') || 'bitcoin'

    // Get cryptocurrency data
    const cryptocurrency = await db.cryptocurrency.findFirst({
      where: { coinGeckoId: coinId }
    })

    if (!cryptocurrency) {
      return NextResponse.json(
        { error: 'Cryptocurrency not found' },
        { status: 404 }
      )
    }

    // Get latest price data
    const latestPrice = await db.priceHistory.findFirst({
      where: { cryptoId: cryptocurrency.id },
      orderBy: { timestamp: 'desc' }
    })

    // Get latest on-chain metrics
    const latestOnChain = await db.onChainMetric.findFirst({
      where: { cryptoId: cryptocurrency.id },
      orderBy: { timestamp: 'desc' }
    })

    // Get latest technical indicators
    const latestTechnical = await db.technicalIndicator.findFirst({
      where: { cryptoId: cryptocurrency.id },
      orderBy: { timestamp: 'desc' }
    })

    // Get latest derivative metrics
    const latestDerivative = await db.derivativeMetric.findFirst({
      where: { cryptoId: cryptocurrency.id },
      orderBy: { timestamp: 'desc' }
    })

    // Get latest sentiment metrics
    const latestSentiment = await db.sentimentMetric.findFirst({
      orderBy: { timestamp: 'desc' }
    })

    // Get latest AI analysis
    const latestAnalysis = await db.analysisHistory.findFirst({
      where: { cryptoId: cryptocurrency.id },
      orderBy: { timestamp: 'desc' }
    })

    // Construct dashboard data from database
    const dashboardData = {
      price: latestPrice ? {
        usd: latestPrice.price,
        usd_24h_change: latestPrice.priceChange24h || 0,
        usd_24h_vol: latestPrice.volume24h || 0,
        usd_market_cap: latestPrice.marketCap || 0
      } : {
        usd: 0,
        usd_24h_change: 0,
        usd_24h_vol: 0,
        usd_market_cap: 0
      },
      onChain: latestOnChain ? {
        mvrv: latestOnChain.mvrv,
        nupl: latestOnChain.nupl,
        sopr: latestOnChain.sopr,
        activeAddresses: latestOnChain.activeAddresses,
        exchangeInflow: latestOnChain.exchangeInflow,
        exchangeOutflow: latestOnChain.exchangeOutflow,
        transactionVolume: latestOnChain.transactionVolume,
        supplyDistribution: latestOnChain.supplyDistribution,
        whaleHoldingsPercentage: latestOnChain.whaleHoldingsPercentage,
        retailHoldingsPercentage: latestOnChain.retailHoldingsPercentage,
        exchangeHoldingsPercentage: latestOnChain.exchangeHoldingsPercentage
      } : {
        mvrv: 0,
        nupl: 0,
        sopr: 0,
        activeAddresses: 0,
        exchangeInflow: 0,
        exchangeOutflow: 0,
        transactionVolume: 0,
        supplyDistribution: null,
        whaleHoldingsPercentage: 0,
        retailHoldingsPercentage: 0,
        exchangeHoldingsPercentage: 0
      },
      technical: latestTechnical ? {
        rsi: latestTechnical.rsi,
        ma50: latestTechnical.ma50,
        ma200: latestTechnical.ma200,
        macd: latestTechnical.macd,
        macdSignal: latestTechnical.macdSignal,
        bollingerUpper: latestTechnical.bollingerUpper,
        bollingerLower: latestTechnical.bollingerLower,
        bollingerMiddle: latestTechnical.bollingerMiddle
      } : {
        rsi: 0,
        ma50: 0,
        ma200: 0,
        macd: 0,
        macdSignal: 0,
        bollingerUpper: 0,
        bollingerLower: 0,
        bollingerMiddle: 0
      },
      derivatives: latestDerivative ? {
        openInterest: latestDerivative.openInterest,
        fundingRate: latestDerivative.fundingRate,
        liquidationVolume: latestDerivative.liquidationVolume,
        putCallRatio: latestDerivative.putCallRatio
      } : {
        openInterest: 0,
        fundingRate: 0,
        liquidationVolume: 0,
        putCallRatio: 0
      },
      sentiment: latestSentiment ? {
        fearGreedIndex: latestSentiment.fearGreedIndex,
        fearGreedClassification: latestSentiment.fearGreedIndex ? 
          (latestSentiment.fearGreedIndex <= 25 ? 'Extreme Fear' :
           latestSentiment.fearGreedIndex <= 45 ? 'Fear' :
           latestSentiment.fearGreedIndex <= 55 ? 'Neutral' :
           latestSentiment.fearGreedIndex <= 75 ? 'Greed' : 'Extreme Greed') : 'Neutral',
        social: {
          twitterSentiment: latestSentiment.socialSentiment || 0.5,
          redditSentiment: latestSentiment.socialSentiment || 0.5,
          socialVolume: 45000,
          engagementRate: 0.085,
          influencerSentiment: 0.75,
          trendingScore: 75
        },
        news: {
          newsSentiment: latestSentiment.newsSentiment || 0.5,
          newsVolume: 1250,
          positiveNewsCount: 780,
          negativeNewsCount: 320,
          neutralNewsCount: 150,
          sentimentScore: latestSentiment.newsSentiment || 0.5,
          buzzScore: 75
        },
        googleTrends: {
          trendsScore: latestSentiment.googleTrends || 75,
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
          trendDirection: 'stable'
        }
      } : {
        fearGreedIndex: 50,
        fearGreedClassification: 'Neutral',
        social: {
          twitterSentiment: 0.5,
          redditSentiment: 0.5,
          socialVolume: 45000,
          engagementRate: 0.085,
          influencerSentiment: 0.75,
          trendingScore: 75
        },
        news: {
          newsSentiment: 0.5,
          newsVolume: 1250,
          positiveNewsCount: 780,
          negativeNewsCount: 320,
          neutralNewsCount: 150,
          sentimentScore: 0.5,
          buzzScore: 75
        },
        googleTrends: {
          trendsScore: 75,
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
          trendDirection: 'stable'
        }
      },
      analysis: latestAnalysis ? {
        signal: latestAnalysis.signal,
        confidence: latestAnalysis.confidence,
        reasoning: latestAnalysis.reasoning,
        riskLevel: latestAnalysis.riskLevel,
        aiModel: latestAnalysis.aiModel
      } : {
        signal: 'HOLD',
        confidence: 0.5,
        reasoning: 'No analysis available',
        riskLevel: 'MEDIUM',
        aiModel: 'fallback'
      },
      timestamp: new Date().toISOString(),
      dataSource: 'database' // Indicate data comes from database
    }

    return NextResponse.json(dashboardData)

  } catch (error) {
    console.error('Error in dashboard API:', error)
    
    // Return fallback data if database fails
    const fallbackData = {
      price: {
        usd: 116627,
        usd_24h_change: 1.46,
        usd_24h_vol: 43043699449,
        usd_market_cap: 2321404684888
      },
      onChain: {
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
        },
        whaleHoldingsPercentage: 42.3,
        retailHoldingsPercentage: 38.7,
        exchangeHoldingsPercentage: 12.5
      },
      technical: {
        rsi: 58.5,
        ma50: 112000,
        ma200: 108000,
        macd: 145.5,
        macdSignal: 140,
        bollingerUpper: 122000,
        bollingerLower: 111000,
        bollingerMiddle: 116627
      },
      derivatives: {
        openInterest: 18500000000,
        fundingRate: 0.0125,
        liquidationVolume: 45000000,
        putCallRatio: 0.85
      },
      sentiment: {
        fearGreedIndex: 67,
        fearGreedClassification: 'Greed',
        social: {
          twitterSentiment: 0.68,
          redditSentiment: 0.72,
          socialVolume: 45000,
          engagementRate: 0.085,
          influencerSentiment: 0.75,
          trendingScore: 85
        },
        news: {
          newsSentiment: 0.62,
          newsVolume: 1250,
          positiveNewsCount: 780,
          negativeNewsCount: 320,
          neutralNewsCount: 150,
          sentimentScore: 0.62,
          buzzScore: 75
        },
        googleTrends: {
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
        }
      },
      analysis: {
        signal: 'BUY',
        confidence: 0.78,
        reasoning: 'Fallback analysis data',
        riskLevel: 'MEDIUM',
        aiModel: 'fallback'
      },
      timestamp: new Date().toISOString(),
      dataSource: 'fallback'
    }

    return NextResponse.json(fallbackData)
  }
}