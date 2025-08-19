import { NextRequest, NextResponse } from 'next/server';
import { DeFiLlamaService } from '@/lib/defillama-service';

// Helper function to check if data is outdated
function isDataOutdated(timestamp: Date, now: Date): boolean {
  const hoursDiff = (now.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  return hoursDiff > 1; // Consider data outdated if older than 1 hour
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'metrics';
    const forceRefresh = searchParams.get('forceRefresh') === 'true';
    const coinId = searchParams.get('coinId');
    
    const defiLlamaService = DeFiLlamaService.getInstance();
    const now = new Date();
    
    switch (action) {
      case 'metrics':
        // Get latest metrics from database
        let latestMetrics;
        
        if (coinId) {
          latestMetrics = await defiLlamaService.getLatestTokenDeFiMetrics(coinId);
        } else {
          latestMetrics = await defiLlamaService.getLatestDeFiMetrics();
        }
        
        // If no data or force refresh or data is outdated, fetch fresh data
        if (!latestMetrics || forceRefresh || (latestMetrics && isDataOutdated(latestMetrics.timestamp, now))) {
          try {
            if (coinId) {
              latestMetrics = await defiLlamaService.storeDeFiMetrics(coinId);
            } else {
              latestMetrics = await defiLlamaService.storeDeFiMetrics();
            }
          } catch (error) {
            console.error('Error fetching fresh DeFi metrics:', error);
            // Return cached data if available, even if outdated
            if (!latestMetrics) {
              return NextResponse.json(
                { error: 'Failed to fetch DeFi metrics' },
                { status: 500 }
              );
            }
          }
        }
        
        return NextResponse.json({
          defi: latestMetrics,
          coinId: coinId,
          last_updated: latestMetrics.timestamp,
          is_outdated: isDataOutdated(latestMetrics.timestamp, now),
          confidence: Math.max(0.7, 0.95 - ((now.getTime() - latestMetrics.timestamp.getTime()) / (1000 * 60 * 60 * 2))),
          source: 'DeFiLlama API'
        });
        
      case 'chains':
        const chains = await defiLlamaService.getTVLByChain();
        return NextResponse.json({
          chains,
          total_chains: chains.length,
          last_updated: now.toISOString(),
          source: 'DeFiLlama API'
        });
        
      case 'protocols':
        const limit = parseInt(searchParams.get('limit') || '50');
        const protocols = await defiLlamaService.getTVLByProtocol(limit);
        return NextResponse.json({
          protocols,
          total_protocols: protocols.length,
          limit,
          last_updated: now.toISOString(),
          source: 'DeFiLlama API'
        });
        
      case 'stablecoins':
        const stablecoins = await defiLlamaService.getStablecoins();
        return NextResponse.json({
          stablecoins,
          total_stablecoins: stablecoins.length,
          last_updated: now.toISOString(),
          source: 'DeFiLlama API'
        });
        
      case 'dex-volume':
        const dexVolume = await defiLlamaService.getDEXVolume();
        return NextResponse.json({
          dex_volume: dexVolume,
          total_dexes: dexVolume.length,
          last_updated: now.toISOString(),
          source: 'DeFiLlama API'
        });
        
      case 'fees':
        const fees = await defiLlamaService.getProtocolFees();
        return NextResponse.json({
          protocol_fees: fees,
          total_protocols: fees.length,
          last_updated: now.toISOString(),
          source: 'DeFiLlama API'
        });
        
      case 'yields':
        const yieldLimit = parseInt(searchParams.get('limit') || '100');
        const yields = await defiLlamaService.getYieldRates(yieldLimit);
        return NextResponse.json({
          yields,
          total_pools: yields.length,
          limit: yieldLimit,
          last_updated: now.toISOString(),
          source: 'DeFiLlama API'
        });
        
      case 'bridges':
        const bridges = await defiLlamaService.getBridgeVolume();
        return NextResponse.json({
          bridges,
          total_bridges: bridges.length,
          last_updated: now.toISOString(),
          source: 'DeFiLlama API'
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in DeFiLlama API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch DeFiLlama data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    const defiLlamaService = DeFiLlamaService.getInstance();
    
    switch (action) {
      case 'refresh':
        // Force refresh and store new data
        const freshMetrics = await defiLlamaService.storeDeFiMetrics();
        return NextResponse.json({
          message: 'DeFi metrics refreshed successfully',
          defi: freshMetrics,
          last_updated: freshMetrics.timestamp
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in DeFiLlama POST API:', error);
    return NextResponse.json(
      { error: 'Failed to process DeFiLlama request' },
      { status: 500 }
    );
  }
}