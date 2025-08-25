import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SpikeDetectionEngine, MetricSpikeDetectors } from '@/lib/spike-detection';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockchain = searchParams.get('blockchain') || 'bitcoin';
    const timeframe = searchParams.get('timeframe') || '24h';

    // Get cryptocurrency data
    const crypto = await db.cryptocurrency.findFirst({
      where: { coinGeckoId: blockchain }
    });

    if (!crypto) {
      return NextResponse.json(
        { error: 'Cryptocurrency not found' },
        { status: 404 }
      );
    }

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default: // 24h
        startDate.setDate(now.getDate() - 1);
        break;
    }

    // Get current TVL data
    const currentTVL = await db.tVLMetric.findFirst({
      where: { 
        cryptoId: crypto.id,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Get extended historical data for spike detection (90 days minimum)
    const spikeDetectionStartDate = new Date();
    spikeDetectionStartDate.setDate(now.getDate() - 90);
    
    const extendedTVLData = await db.tVLMetric.findMany({
      where: { 
        cryptoId: crypto.id,
        timestamp: {
          gte: spikeDetectionStartDate
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Get price data for additional metrics
    const currentPrice = await db.priceHistory.findFirst({
      where: { 
        cryptoId: crypto.id,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Calculate current values
    const currentTVLValue = currentTVL?.chainTVL || 0;
    const marketCap = currentPrice?.marketCap || 0;
    const tvlToMarketCapRatio = marketCap > 0 ? (currentTVLValue / marketCap) * 100 : 0;

    // Prepare historical data for spike detection
    const historicalTVLData = {
      chainTVL: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: d.chainTVL || 0 })),
      chainTVLChange24h: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: d.tvlChange24h || 0 })),
      chainTVLChange7d: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: d.tvlChange7d || 0 })),
      chainTVLChange30d: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: d.tvlChange30d || 0 })),
      tvlDominance: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: d.dominance || 0 })),
      tvlRank: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: 0 })), // Rank not available in schema
      tvlPeak: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: d.chainTVL || 0 })), // Using chainTVL as peak
      tvlToMarketCapRatio: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: d.marketCapTVLRatio || 0 })),
      defiTVL: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: d.chainTVL || 0 })),
      stakingTVL: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: 0 })),
      bridgeTVL: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: 0 })),
      lendingTVL: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: 0 })),
      dexTVL: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: 0 })),
      yieldTVL: extendedTVLData.map(d => ({ timestamp: d.timestamp, value: 0 })),
    };

    // Current values for spike detection
    const currentTVLValues = {
      chainTVL: currentTVLValue,
      chainTVLChange24h: currentTVL?.tvlChange24h || 0,
      chainTVLChange7d: currentTVL?.tvlChange7d || 0,
      chainTVLChange30d: currentTVL?.tvlChange30d || 0,
      tvlDominance: currentTVL?.dominance || 0,
      tvlRank: 0, // Not available in schema
      tvlPeak: currentTVLValue, // Using current TVL as peak
      tvlToMarketCapRatio: currentTVL?.marketCapTVLRatio || tvlToMarketCapRatio,
      defiTVL: currentTVLValue,
      stakingTVL: 0,
      bridgeTVL: 0,
      lendingTVL: 0,
      dexTVL: 0,
      yieldTVL: 0,
    };

    // Generate spike detection results
    const spikeDetectionResults = MetricSpikeDetectors.detectTVLSpikes(
      historicalTVLData, 
      currentTVLValues,
      blockchain,
      timeframe
    );

    // Format TVL metrics data
    const tvlMetrics = {
      id: `tvl-enhanced-${blockchain}-${timeframe}-${now.getTime()}`,
      blockchain: blockchain as any,
      timeframe: timeframe as any,
      createdAt: now,
      updatedAt: now,
      
      // Main metrics with calculated changes and trends
      chainTVL: {
        value: currentTVLValue,
        change: currentTVL?.tvlChange24h ? (currentTVLValue * currentTVL.tvlChange24h / 100) : 0,
        changePercent: currentTVL?.tvlChange24h || 0,
        trend: (currentTVL?.tvlChange24h || 0) > 0 ? 'up' : (currentTVL?.tvlChange24h || 0) < 0 ? 'down' : 'stable',
        timestamp: now,
      },
      
      chainTVLChange24h: {
        value: currentTVL?.tvlChange24h || 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        timestamp: now,
      },
      
      chainTVLChange7d: {
        value: currentTVL?.tvlChange7d || 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        timestamp: now,
      },
      
      chainTVLChange30d: {
        value: currentTVL?.tvlChange30d || 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        timestamp: now,
      },
      
      tvlDominance: {
        value: currentTVL?.dominance || 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        timestamp: now,
      },
      
      tvlRank: {
        value: 0, // Not available in schema
        change: 0,
        changePercent: 0,
        trend: 'stable',
        timestamp: now,
      },
      
      tvlPeak: {
        value: currentTVLValue,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        timestamp: now,
      },
      
      tvlToMarketCapRatio: {
        value: currentTVL?.marketCapTVLRatio || tvlToMarketCapRatio,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        timestamp: now,
      },
      
      // Additional TVL metrics
      defiTVL: {
        value: currentTVLValue,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        timestamp: now,
      },
      
      stakingTVL: {
        value: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        timestamp: now,
      },
      
      bridgeTVL: {
        value: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        timestamp: now,
      },
      
      lendingTVL: {
        value: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        timestamp: now,
      },
      
      dexTVL: {
        value: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        timestamp: now,
      },
      
      yieldTVL: {
        value: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        timestamp: now,
      },
      
      // Protocol distribution (empty for now)
      topProtocols: [],
      protocolCategories: {},
      
      // Historical data
      historicalData: [],
      tvlHistory: [],
      
      // Market comparison
      marketComparison: {
        totalMarketTVL: 0,
        chainRank: 0,
        topChains: [],
        marketShare: currentTVL?.dominance || 0,
      },
      
      // TVL analysis
      tvlAnalysis: {
        trends: {
          trend: 'stable',
          change7d: currentTVL?.tvlChange7d || 0,
          change30d: currentTVL?.tvlChange30d || 0,
          volatility: 0,
          supportLevel: 0,
          resistanceLevel: 0,
          momentum: 'neutral',
        },
        concentration: {
          hhiIndex: 0,
          top3ProtocolShare: 0,
          top5ProtocolShare: 0,
          top10ProtocolShare: 0,
          giniCoefficient: 0,
        },
        correlations: {
          tvlMarketCap: 0,
          tvlPrice: 0,
          tvlVolume: 0,
          dominanceRanking: 0,
          tvlVelocity: 0,
        },
        historicalData: [],
      },
      
      // Spike detection results
      spikeDetection: spikeDetectionResults,
    };

    return NextResponse.json(tvlMetrics);
  } catch (error) {
    console.error('Error fetching enhanced TVL metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enhanced TVL metrics' },
      { status: 500 }
    );
  }
}