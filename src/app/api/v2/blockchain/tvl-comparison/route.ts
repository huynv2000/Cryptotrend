// TVL Comparison API Endpoint
// Provides TVL comparison data across multiple blockchains

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TVLDataCollectionService } from '@/lib/tvl-data-collection';
import { DeFiLlamaService } from '@/lib/defillama-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockchains = searchParams.get('blockchains')?.split(',') || ['ethereum', 'bitcoin', 'solana', 'binance-smart-chain', 'polygon'];
    const timeframe = searchParams.get('timeframe') || '24h';
    
    // Initialize services
    const tvlService = TVLDataCollectionService.getInstance();
    const defiLlamaService = DeFiLlamaService.getInstance();

    // Get TVL ranking for all chains
    let tvlRanking = [];
    try {
      tvlRanking = await defiLlamaService.getChainTVLRanking();
    } catch (error) {
      console.error('Error fetching TVL ranking:', error);
    }

    // Get data for requested blockchains
    const comparisonData = [];
    
    for (const blockchain of blockchains) {
      try {
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
          continue;
        }

        // Get TVL metrics
        const tvlMetrics = await tvlService.getLatestTVLMetrics(crypto.id);
        
        // Get market data
        const priceData = await db.priceHistory.findFirst({
          where: { cryptoId: crypto.id },
          orderBy: { timestamp: 'desc' }
        });

        // Find ranking data
        const rankingData = tvlRanking.find(r => 
          r.name.toLowerCase() === blockchain.toLowerCase() ||
          r.symbol?.toLowerCase() === blockchain.toLowerCase()
        );

        // Calculate metrics
        const marketCap = priceData?.marketCap || 0;
        const tvl = tvlMetrics?.chainTVL || 0;
        const tvlToMarketCapRatio = marketCap > 0 ? (tvl / marketCap) * 100 : 0;

        comparisonData.push({
          blockchain: {
            id: crypto.id,
            name: crypto.name,
            symbol: crypto.symbol,
            coinGeckoId: crypto.coinGeckoId
          },
          tvlMetrics: {
            chainTVL: tvl,
            chainTVLChange24h: tvlMetrics?.chainTVLChange24h || 0,
            chainTVLChange7d: tvlMetrics?.chainTVLChange7d || 0,
            tvlDominance: tvlMetrics?.tvlDominance || 0,
            tvlRank: tvlMetrics?.tvlRank || rankingData?.rank || 0,
            tvlPeak: tvlMetrics?.tvlPeak || 0,
            tvlToMarketCapRatio: tvlMetrics?.tvlToMarketCapRatio || tvlToMarketCapRatio
          },
          marketData: {
            marketCap,
            price: priceData?.price || 0,
            priceChange24h: priceData?.priceChange24h || 0,
            volume24h: priceData?.volume24h || 0
          },
          ranking: rankingData || {
            rank: 0,
            change_1d: 0,
            change_7d: 0,
            change_30d: 0
          },
          composition: tvlMetrics ? {
            defiTVL: tvlMetrics.defiTVL || 0,
            stakingTVL: tvlMetrics.stakingTVL || 0,
            bridgeTVL: tvlMetrics.bridgeTVL || 0,
            lendingTVL: tvlMetrics.lendingTVL || 0,
            dexTVL: tvlMetrics.dexTVL || 0,
            yieldTVL: tvlMetrics.yieldTVL || 0
          } : {
            defiTVL: 0,
            stakingTVL: 0,
            bridgeTVL: 0,
            lendingTVL: 0,
            dexTVL: 0,
            yieldTVL: 0
          }
        });
      } catch (error) {
        console.error(`Error processing blockchain ${blockchain}:`, error);
      }
    }

    // Calculate summary statistics
    const totalTVL = comparisonData.reduce((sum, data) => sum + (data.tvlMetrics.chainTVL || 0), 0);
    const averageTVL = comparisonData.length > 0 ? totalTVL / comparisonData.length : 0;
    const totalMarketCap = comparisonData.reduce((sum, data) => sum + (data.marketData.marketCap || 0), 0);
    
    // Find top performers
    const topTVL = comparisonData.reduce((max, data) => 
      (data.tvlMetrics.chainTVL || 0) > (max.tvlMetrics.chainTVL || 0) ? data : max, 
      comparisonData[0] || {}
    );
    
    const topGrowth24h = comparisonData.reduce((max, data) => 
      (data.tvlMetrics.chainTVLChange24h || 0) > (max.tvlMetrics.chainTVLChange24h || 0) ? data : max, 
      comparisonData[0] || {}
    );

    // Sort by TVL for ranking
    const sortedByTVL = [...comparisonData].sort((a, b) => 
      (b.tvlMetrics.chainTVL || 0) - (a.tvlMetrics.chainTVL || 0)
    );

    // Calculate correlations
    const correlations = calculateCorrelations(comparisonData);

    const response = {
      summary: {
        totalBlockchains: comparisonData.length,
        totalTVL,
        averageTVL,
        totalMarketCap,
        topTVL: topTVL.blockchain?.name || 'N/A',
        topTVLValue: topTVL.tvlMetrics?.chainTVL || 0,
        topGrowth24h: topGrowth24h.blockchain?.name || 'N/A',
        topGrowth24hValue: topGrowth24h.tvlMetrics?.chainTVLChange24h || 0,
        averageTvlToMarketCapRatio: comparisonData.length > 0 
          ? comparisonData.reduce((sum, data) => sum + (data.tvlMetrics.tvlToMarketCapRatio || 0), 0) / comparisonData.length 
          : 0
      },
      rankings: sortedByTVL.map((data, index) => ({
        rank: index + 1,
        name: data.blockchain.name,
        symbol: data.blockchain.symbol,
        tvl: data.tvlMetrics.chainTVL,
        dominance: data.tvlMetrics.tvlDominance,
        change24h: data.tvlMetrics.chainTVLChange24h,
        change7d: data.tvlMetrics.chainTVLChange7d
      })),
      comparison: comparisonData,
      correlations,
      timeframe,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching TVL comparison data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch TVL comparison data', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to calculate correlations between metrics
function calculateCorrelations(data: any[]) {
  if (data.length < 2) return {};

  const correlations = {
    tvlMarketCap: calculatePearsonCorrelation(
      data.map(d => d.tvlMetrics.chainTVL || 0),
      data.map(d => d.marketData.marketCap || 0)
    ),
    tvlPrice: calculatePearsonCorrelation(
      data.map(d => d.tvlMetrics.chainTVL || 0),
      data.map(d => d.marketData.price || 0)
    ),
    tvlVolume: calculatePearsonCorrelation(
      data.map(d => d.tvlMetrics.chainTVL || 0),
      data.map(d => d.marketData.volume24h || 0)
    ),
    dominanceRanking: calculatePearsonCorrelation(
      data.map(d => d.tvlMetrics.tvlDominance || 0),
      data.map(d => d.tvlMetrics.tvlRank || 0)
    )
  };

  return correlations;
}

// Helper function to calculate Pearson correlation coefficient
function calculatePearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;

  const n = x.length;
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = y.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + (val * y[i]), 0);
  const sumX2 = x.reduce((sum, val) => sum + (val * val), 0);
  const sumY2 = y.reduce((sum, val) => sum + (val * val), 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}