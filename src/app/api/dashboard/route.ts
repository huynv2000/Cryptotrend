import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DataValidationService } from '@/lib/data-validation';
import { DeFiLlamaService } from '@/lib/defillama-service';

// Helper function to check if data is outdated
function isDataOutdated(timestamp: Date, now: Date): boolean {
  const hoursDiff = (now.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  return hoursDiff > 1; // Consider data outdated if older than 1 hour
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coinId') || 'bitcoin';
    
    // Initialize data validation service
    const dataValidationService = DataValidationService.getInstance();
    
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
    
    // Get price data with validation
    const priceData = await db.priceHistory.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });
    
    // Get on-chain metrics with validation
    const onChainData = await db.onChainMetric.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });
    
    // Get technical indicators with validation
    const technicalData = await db.technicalIndicator.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });
    
    // Get sentiment data with validation
    const sentimentData = await db.sentimentMetric.findFirst({
      orderBy: { timestamp: 'desc' }
    });
    
    // Get derivatives data with validation
    const derivativesData = await db.derivativeMetric.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    // Get DeFi metrics with validation
    const defiLlamaService = DeFiLlamaService.getInstance();
    let defiData = await defiLlamaService.getLatestTokenDeFiMetrics(coinId);
    
    // If no DeFi data or outdated, try to fetch fresh data
    const now = new Date();
    if (!defiData || isDataOutdated(defiData.timestamp, now)) {
      try {
        defiData = await defiLlamaService.storeDeFiMetrics(coinId);
      } catch (error) {
        console.error('Error fetching fresh DeFi metrics:', error);
        // Continue with null defiData if fetch fails
      }
    }

    // Calculate data quality score
    const dataQuality = await dataValidationService.calculateDataQualityScore(crypto.id);
    
    // Format the response with validation information
    const dashboardData = {
      cryptocurrency: crypto,
      dataQuality: dataQuality,
      price: priceData ? {
        usd: priceData.price,
        usd_24h_change: priceData.priceChange24h,
        usd_24h_vol: priceData.volume24h,
        usd_market_cap: priceData.marketCap,
        last_updated: priceData.timestamp,
        is_outdated: isDataOutdated(priceData.timestamp, now),
        confidence: 0.95, // Price data from CoinGecko is highly reliable
        source: 'CoinGecko API'
      } : {
        usd: null,
        usd_24h_change: null,
        usd_24h_vol: null,
        usd_market_cap: null,
        error: "N/A - No price data available",
        confidence: 0,
        source: 'N/A'
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
        is_outdated: isDataOutdated(onChainData.timestamp, now),
        confidence: Math.max(0.2, 0.8 - ((now.getTime() - onChainData.timestamp.getTime()) / (1000 * 60 * 60 * 48))),
        source: 'Historical Fallback'
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
        error: "N/A - No on-chain data available",
        confidence: 0,
        source: 'N/A'
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
        is_outdated: isDataOutdated(technicalData.timestamp, now),
        confidence: Math.max(0.3, 0.9 - ((now.getTime() - technicalData.timestamp.getTime()) / (1000 * 60 * 60 * 24))),
        source: 'Calculated from Price Data'
      } : {
        rsi: null,
        ma50: null,
        ma200: null,
        macd: null,
        bollingerUpper: null,
        bollingerLower: null,
        bollingerMiddle: null,
        error: "N/A - No technical indicators available",
        confidence: 0,
        source: 'N/A'
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
        is_outdated: isDataOutdated(sentimentData.timestamp, now),
        confidence: sentimentData.fearGreedIndex ? Math.max(0.4, 0.85 - ((now.getTime() - sentimentData.timestamp.getTime()) / (1000 * 60 * 60 * 36))) : 0,
        source: sentimentData.fearGreedIndex ? 'Alternative.me API' : 'Historical Fallback'
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
        error: "N/A - No sentiment data available",
        confidence: 0,
        source: 'N/A'
      },
      derivatives: derivativesData ? {
        openInterest: derivativesData.openInterest,
        fundingRate: derivativesData.fundingRate,
        liquidationVolume: derivativesData.liquidationVolume,
        putCallRatio: derivativesData.putCallRatio,
        last_updated: derivativesData.timestamp,
        is_outdated: isDataOutdated(derivativesData.timestamp, now),
        confidence: Math.max(0.2, 0.7 - ((now.getTime() - derivativesData.timestamp.getTime()) / (1000 * 60 * 60 * 36))),
        source: 'Historical Fallback'
      } : {
        openInterest: null,
        fundingRate: null,
        liquidationVolume: null,
        putCallRatio: null,
        error: "N/A - No derivatives data available",
        confidence: 0,
        source: 'N/A'
      },
      defi: defiData ? {
        totalTVL: defiData.totalTVL,
        totalStablecoinMarketCap: defiData.totalStablecoinMarketCap,
        totalDEXVolume24h: defiData.totalDEXVolume24h,
        totalProtocolFees24h: defiData.totalProtocolFees24h,
        avgYieldRate: defiData.avgYieldRate,
        totalBridgeVolume24h: defiData.totalBridgeVolume24h,
        topChains: defiData.topChains,
        topProtocols: defiData.topProtocols,
        topStablecoins: defiData.topStablecoins,
        last_updated: defiData.timestamp,
        is_outdated: isDataOutdated(defiData.timestamp, now),
        confidence: Math.max(0.7, 0.95 - ((now.getTime() - defiData.timestamp.getTime()) / (1000 * 60 * 60 * 2))),
        source: 'DeFiLlama API'
      } : {
        totalTVL: null,
        totalStablecoinMarketCap: null,
        totalDEXVolume24h: null,
        totalProtocolFees24h: null,
        avgYieldRate: null,
        totalBridgeVolume24h: null,
        topChains: [],
        topProtocols: [],
        topStablecoins: [],
        error: "N/A - No DeFi data available",
        confidence: 0,
        source: 'N/A'
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