import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Helper function to check if data is outdated
function isDataOutdated(timestamp: Date, now: Date): boolean {
  const hoursDiff = (now.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  return hoursDiff > 1; // Consider data outdated if older than 1 hour
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coinId') || 'bitcoin';
    
    // Get cryptocurrency basic info
    const crypto = await db.cryptocurrency.findFirst({
      where: { coinGeckoId: coinId }
    });
    
    if (!crypto) {
      return NextResponse.json(
        { error: 'Cryptocurrency not found' },
        { status: 404 }
      );
    }
    
    // Get price data
    const priceData = await db.priceHistory.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });
    
    // Get on-chain metrics
    const onChainData = await db.onChainMetric.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });
    
    // Get technical indicators
    const technicalData = await db.technicalIndicator.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });
    
    // Get sentiment data
    const sentimentData = await db.sentimentMetric.findFirst({
      orderBy: { timestamp: 'desc' }
    });
    
    // Get derivatives data
    const derivativesData = await db.derivativeMetric.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });
    
    // Format the response with outdated information
    const now = new Date();
    const dashboardData = {
      cryptocurrency: crypto,
      price: priceData ? {
        usd: priceData.price,
        usd_24h_change: priceData.priceChange24h,
        usd_24h_vol: priceData.volume24h,
        usd_market_cap: priceData.marketCap,
        last_updated: priceData.timestamp,
        is_outdated: isDataOutdated(priceData.timestamp, now)
      } : {
        usd: null,
        usd_24h_change: null,
        usd_24h_vol: null,
        usd_market_cap: null,
        error: "N/A - No price data available"
      },
      onChain: onChainData ? {
        mvrv: onChainData.mvrv,
        nupl: onChainData.nupl,
        sopr: onChainData.sopr,
        activeAddresses: onChainData.activeAddresses,
        exchangeInflow: onChainData.exchangeInflow,
        exchangeOutflow: onChainData.exchangeOutflow,
        transactionVolume: onChainData.transactionVolume,
        whaleHoldingsPercentage: onChainData.whaleHoldingsPercentage,
        retailHoldingsPercentage: onChainData.retailHoldingsPercentage,
        exchangeHoldingsPercentage: onChainData.exchangeHoldingsPercentage,
        last_updated: onChainData.timestamp,
        is_outdated: isDataOutdated(onChainData.timestamp, now)
      } : {
        mvrv: null,
        nupl: null,
        sopr: null,
        activeAddresses: null,
        exchangeInflow: null,
        exchangeOutflow: null,
        transactionVolume: null,
        whaleHoldingsPercentage: null,
        retailHoldingsPercentage: null,
        exchangeHoldingsPercentage: null,
        error: "N/A - No on-chain data available"
      },
      technical: technicalData ? {
        rsi: technicalData.rsi,
        ma50: technicalData.ma50,
        ma200: technicalData.ma200,
        macd: technicalData.macd,
        bollingerUpper: technicalData.bollingerUpper,
        bollingerLower: technicalData.bollingerLower,
        bollingerMiddle: technicalData.bollingerMiddle,
        last_updated: technicalData.timestamp,
        is_outdated: isDataOutdated(technicalData.timestamp, now)
      } : {
        rsi: null,
        ma50: null,
        ma200: null,
        macd: null,
        bollingerUpper: null,
        bollingerLower: null,
        bollingerMiddle: null,
        error: "N/A - No technical indicators available"
      },
      sentiment: sentimentData ? {
        fearGreedIndex: sentimentData.fearGreedIndex,
        fearGreedClassification: sentimentData.fearGreedClassification,
        social: {
          twitterSentiment: sentimentData.socialSentiment,
          redditSentiment: sentimentData.redditSentiment,
          socialVolume: sentimentData.socialVolume,
          engagementRate: sentimentData.engagementRate,
          influencerSentiment: sentimentData.influencerSentiment,
          trendingScore: sentimentData.trendingScore
        },
        news: {
          newsSentiment: sentimentData.newsSentiment,
          newsVolume: sentimentData.newsVolume,
          positiveNewsCount: sentimentData.positiveNewsCount,
          negativeNewsCount: sentimentData.negativeNewsCount,
          neutralNewsCount: sentimentData.neutralNewsCount,
          sentimentScore: sentimentData.sentimentScore,
          buzzScore: sentimentData.buzzScore
        },
        googleTrends: {
          trendsScore: sentimentData.trendsScore,
          searchVolume: sentimentData.searchVolume,
          trendingKeywords: sentimentData.trendingKeywords ? sentimentData.trendingKeywords.split(',') : [],
          trendDirection: sentimentData.trendDirection
        },
        last_updated: sentimentData.timestamp,
        is_outdated: isDataOutdated(sentimentData.timestamp, now)
      } : {
        fearGreedIndex: null,
        fearGreedClassification: null,
        social: {
          twitterSentiment: null,
          redditSentiment: null,
          socialVolume: null,
          engagementRate: null,
          influencerSentiment: null,
          trendingScore: null
        },
        news: {
          newsSentiment: null,
          newsVolume: null,
          positiveNewsCount: null,
          negativeNewsCount: null,
          neutralNewsCount: null,
          sentimentScore: null,
          buzzScore: null
        },
        googleTrends: {
          trendsScore: null,
          searchVolume: null,
          trendingKeywords: [],
          trendDirection: null
        },
        error: "N/A - No sentiment data available"
      },
      derivatives: derivativesData ? {
        openInterest: derivativesData.openInterest,
        fundingRate: derivativesData.fundingRate,
        liquidationVolume: derivativesData.liquidationVolume,
        putCallRatio: derivativesData.putCallRatio,
        last_updated: derivativesData.timestamp,
        is_outdated: isDataOutdated(derivativesData.timestamp, now)
      } : {
        openInterest: null,
        fundingRate: null,
        liquidationVolume: null,
        putCallRatio: null,
        error: "N/A - No derivatives data available"
      }
    };
    
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}