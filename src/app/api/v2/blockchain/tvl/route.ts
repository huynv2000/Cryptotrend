import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DeFiLlamaService } from '@/lib/defillama-service';
import { TVLDataCollectionService } from '@/lib/tvl-data-collection';

// Helper function to check if data is outdated
function isDataOutdated(timestamp: Date, now: Date): boolean {
  const hoursDiff = (now.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  return hoursDiff > 1; // Consider data outdated if older than 1 hour
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coinId') || 'bitcoin';
    
    // Initialize services
    const tvlService = TVLDataCollectionService.getInstance();
    const defiLlamaService = DeFiLlamaService.getInstance();
    
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
    
    // Get TVL metrics with validation
    const tvlData = await db.tVLMetric.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });
    
    // If no TVL data or outdated, try to fetch fresh data
    const now = new Date();
    let freshTVLData: any = null;
    
    if (!tvlData || isDataOutdated(tvlData.timestamp, now)) {
      try {
        console.log(`Fetching fresh TVL data for ${coinId}`);
        freshTVLData = await defiLlamaService.storeTVLMetrics(coinId, crypto.id);
      } catch (error) {
        console.error('Error fetching fresh TVL metrics:', error);
        // Continue with existing data if fetch fails
      }
    }
    
    // Use fresh data if available, otherwise use existing data
    const finalTVLData = freshTVLData || tvlData;
    
    // Format the response with validation information
    const tvlMetrics = finalTVLData ? {
      chainTVL: finalTVLData.chainTVL,
      chainTVLChange24h: finalTVLData.chainTVLChange24h,
      chainTVLChange7d: finalTVLData.chainTVLChange7d,
      chainTVLChange30d: finalTVLData.chainTVLChange30d,
      tvlDominance: finalTVLData.tvlDominance,
      tvlRank: finalTVLData.tvlRank,
      tvlPeak: finalTVLData.tvlPeak,
      tvlToMarketCapRatio: finalTVLData.tvlToMarketCapRatio,
      lastUpdated: finalTVLData.timestamp,
      is_outdated: isDataOutdated(finalTVLData.timestamp, now),
      confidence: finalTVLData.confidence || 0.8,
      source: 'DeFiLlama API',
      topProtocols: finalTVLData.topProtocolsByTVL ? JSON.parse(finalTVLData.topProtocolsByTVL) : [],
      protocolCategories: finalTVLData.protocolCategories ? JSON.parse(finalTVLData.protocolCategories) : {},
      tvlHistory: finalTVLData.tvlHistory ? JSON.parse(finalTVLData.tvlHistory) : []
    } : {
      chainTVL: null,
      chainTVLChange24h: null,
      chainTVLChange7d: null,
      chainTVLChange30d: null,
      tvlDominance: null,
      tvlRank: null,
      tvlPeak: null,
      tvlToMarketCapRatio: null,
      error: "N/A - No TVL data available",
      confidence: 0,
      source: 'N/A',
      topProtocols: [],
      protocolCategories: {},
      tvlHistory: []
    };
    
    // Get additional DeFi context
    let defiContext: any = null;
    try {
      defiContext = await defiLlamaService.getLatestDeFiMetrics();
    } catch (error) {
      console.error('Error fetching DeFi context:', error);
    }
    
    const response = {
      cryptocurrency: {
        id: crypto.id,
        symbol: crypto.symbol,
        name: crypto.name,
        coinGeckoId: crypto.coinGeckoId
      },
      tvlMetrics,
      defiContext: defiContext ? {
        totalTVL: defiContext.totalTVL,
        totalStablecoinMarketCap: defiContext.totalStablecoinMarketCap,
        totalDEXVolume24h: defiContext.totalDEXVolume24h,
        totalProtocolFees24h: defiContext.totalProtocolFees24h,
        avgYieldRate: defiContext.avgYieldRate,
        topChains: defiContext.topChains || [],
        topProtocols: defiContext.topProtocols || []
      } : null,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching TVL metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TVL metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coinId, action } = body;
    
    if (!coinId) {
      return NextResponse.json(
        { error: 'coinId is required' },
        { status: 400 }
      );
    }
    
    const tvlService = TVLDataCollectionService.getInstance();
    
    switch (action) {
      case 'refresh':
        // Get cryptocurrency info
        const crypto = await db.cryptocurrency.findFirst({
          where: { coinGeckoId: coinId }
        });
        
        if (!crypto) {
          return NextResponse.json(
            { error: 'Cryptocurrency not found' },
            { status: 404 }
          );
        }
        
        // Force refresh TVL data
        const refreshResult = await tvlService.collectTVLData(crypto.id, coinId);
        return NextResponse.json(refreshResult);
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in TVL metrics POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
