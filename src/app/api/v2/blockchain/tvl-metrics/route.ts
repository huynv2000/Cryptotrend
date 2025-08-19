// TVL Metrics API Endpoint
// Provides comprehensive TVL (Total Value Locked) metrics for blockchain analysis

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TVLDataCollectionService } from '@/lib/tvl-data-collection';
import { DeFiLlamaService } from '@/lib/defillama-service';

// Helper function to check if data is outdated
function isDataOutdated(timestamp: Date, now: Date, maxAgeHours: number = 24): boolean {
  const hoursDiff = (now.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  return hoursDiff > maxAgeHours;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockchain = searchParams.get('blockchain') || 'ethereum';
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    
    // Map blockchain names to DeFiLlama chain names
    const chainMapping: { [key: string]: string } = {
      'ethereum': 'Ethereum',
      'bitcoin': 'Bitcoin',
      'solana': 'Solana',
      'binance-smart-chain': 'Binance Smart Chain',
      'polygon': 'Polygon',
      'avalanche': 'Avalanche',
      'cardano': 'Cardano',
      'chainlink': 'Chainlink',
      'polkadot': 'Polkadot'
    };

    const chainName = chainMapping[blockchain] || blockchain;
    
    // Get cryptocurrency info
    const crypto = await db.cryptocurrency.findFirst({
      where: { 
        OR: [
          { coinGeckoId: blockchain },
          { symbol: blockchain.toUpperCase() }
        ]
      }
    });

    if (!crypto) {
      return NextResponse.json(
        { error: 'Blockchain not found' },
        { status: 404 }
      );
    }

    // Initialize services
    const tvlService = TVLDataCollectionService.getInstance();
    const defiLlamaService = DeFiLlamaService.getInstance();
    const now = new Date();

    // Get existing TVL metrics
    let tvlMetrics = await db.tVLMetric.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });
    
    // Check if we need to refresh data
    const needsRefresh = forceRefresh || 
      !tvlMetrics || 
      isDataOutdated(new Date(tvlMetrics.timestamp), now, 6); // 6 hours refresh

    if (needsRefresh) {
      try {
        // Collect fresh TVL metrics
        tvlMetrics = await tvlService.collectTVLMetrics(crypto.id, crypto.coinGeckoId);
      } catch (error) {
        console.error('Error collecting fresh TVL metrics:', error);
        // Continue with existing data if collection fails
      }
    }

    // Get enhanced TVL analytics from DeFiLlama
    let tvlAnalytics = null;
    try {
      tvlAnalytics = await defiLlamaService.getBlockchainTVLMetrics(crypto.coinGeckoId);
    } catch (error) {
      console.error('Error fetching TVL analytics:', error);
    }

    // Get market data for TVL ratios
    const priceData = await db.priceHistory.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    // Calculate additional metrics
    const marketCap = priceData?.marketCap || 0;
    const tvlToMarketCapRatio = marketCap > 0 && tvlMetrics?.chainTVL 
      ? (tvlMetrics.chainTVL / marketCap) * 100 
      : 0;

    // Format the response
    const response = {
      blockchain: {
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol,
        coinGeckoId: crypto.coinGeckoId,
        chainName
      },
      tvlMetrics: tvlMetrics ? {
        // Core TVL Metrics
        chainTVL: tvlMetrics.chainTVL,
        chainTVLChange24h: tvlMetrics.tvlChange24h,
        chainTVLChange7d: tvlMetrics.tvlChange7d,
        chainTVLChange30d: tvlMetrics.tvlChange30d,
        tvlDominance: tvlMetrics.dominance,
        
        // TVL Analytics
        tvlRank: tvlMetrics.tvlRank || 0,
        tvlPeak: tvlMetrics.tvlPeak || tvlMetrics.chainTVL,
        tvlToMarketCapRatio: tvlMetrics.marketCapTVLRatio,
        
        // Protocol Distribution
        topProtocolsByTVL: tvlMetrics.topProtocolsByTVL ? JSON.parse(tvlMetrics.topProtocolsByTVL) : [],
        protocolCategories: tvlMetrics.protocolDistribution ? JSON.parse(tvlMetrics.protocolDistribution) : {},
        
        // Metadata
        lastUpdated: tvlMetrics.timestamp,
        isOutdated: isDataOutdated(new Date(tvlMetrics.timestamp), now, 6),
        confidence: Math.max(0.7, 0.95 - ((now.getTime() - tvlMetrics.timestamp.getTime()) / (1000 * 60 * 60 * 12))),
        source: 'DeFiLlama API'
      } : {
        error: "N/A - No TVL data available",
        confidence: 0,
        source: 'N/A'
      },
      tvlAnalytics: tvlAnalytics ? {
        // Chain Overview
        chain: tvlAnalytics.chain,
        dominance: tvlAnalytics.chain.dominance,
        ranking: tvlAnalytics.chain.rank,
        
        // TVL Metrics
        totalTVL: tvlAnalytics.chain.tvl,
        change_1d: tvlAnalytics.chain.change_1d,
        change_7d: tvlAnalytics.chain.change_7d,
        change_30d: tvlAnalytics.chain.change_30d,
        
        // Protocol Data
        topProtocols: tvlAnalytics.protocols.top,
        totalProtocols: tvlAnalytics.protocols.total,
        categoryDistribution: tvlAnalytics.protocols.categoryDistribution,
        
        // Market Context
        marketTVL: tvlAnalytics.market.totalTVL,
        topChains: tvlAnalytics.market.topChains,
        
        // Metadata
        lastUpdated: tvlAnalytics.lastUpdated,
        confidence: 0.85,
        source: 'DeFiLlama Analytics'
      } : {
        error: "N/A - No TVL analytics available",
        confidence: 0,
        source: 'N/A'
      },
      marketContext: {
        marketCap,
        tvlToMarketCapRatio,
        price: priceData?.price || 0,
        priceChange24h: priceData?.priceChange24h || 0,
        lastUpdated: priceData?.timestamp || null
      },
      summary: {
        totalTVL: tvlMetrics?.chainTVL || tvlAnalytics?.chain?.tvl || 0,
        dominance: tvlMetrics?.dominance || tvlAnalytics?.chain?.dominance || 0,
        ranking: tvlMetrics?.tvlRank || tvlAnalytics?.chain?.rank || 0,
        protocolCount: tvlMetrics?.topProtocolsByTVL?.length || tvlAnalytics?.protocols?.top?.length || 0,
        categoryCount: Object.keys(tvlMetrics?.protocolCategories || tvlAnalytics?.protocols?.categoryDistribution || {}).length,
        trend: 'stable', // Default trend
        change7d: tvlMetrics?.tvlChange7d || tvlAnalytics?.chain?.change_7d || 0,
        change30d: tvlMetrics?.tvlChange30d || tvlAnalytics?.chain?.change_30d || 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching TVL metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TVL metrics', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, blockchain } = body;

    if (action === 'refresh') {
      const crypto = await db.cryptocurrency.findFirst({
        where: { 
          OR: [
            { coinGeckoId: blockchain },
            { symbol: blockchain?.toUpperCase() }
          ]
        }
      });

      if (!crypto) {
        return NextResponse.json(
          { error: 'Blockchain not found' },
          { status: 404 }
        );
      }

      const tvlService = TVLDataCollectionService.getInstance();
      const result = await tvlService.collectTVLMetrics(crypto.id, crypto.coinGeckoId);

      return NextResponse.json({
        success: true,
        message: 'TVL metrics refreshed successfully',
        data: result
      });
    }

    if (action === 'refresh_all') {
      const tvlService = TVLDataCollectionService.getInstance();
      const results = await tvlService.collectAllTVLMetrics();

      return NextResponse.json({
        success: true,
        message: 'TVL metrics refreshed for all blockchains',
        results
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in TVL metrics POST request:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}