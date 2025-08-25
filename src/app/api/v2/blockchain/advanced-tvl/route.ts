import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AdvancedTVLMetricsService } from '@/lib/advanced-tvl-metrics';

// Helper function to check if data is outdated
function isDataOutdated(timestamp: Date, now: Date): boolean {
  const hoursDiff = (now.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  return hoursDiff > 2; // Consider data outdated if older than 2 hours
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coinId') || 'bitcoin';
    
    // Initialize service
    const advancedTVLService = AdvancedTVLMetricsService.getInstance();
    
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
    
    // Get advanced TVL metrics with validation
    const advancedTVLData = await db.advancedTVLMetric.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });
    
    // If no advanced TVL data or outdated, try to fetch fresh data
    const now = new Date();
    let freshAdvancedTVLData: any = null;
    
    if (!advancedTVLData || isDataOutdated(advancedTVLData.timestamp, now)) {
      try {
        console.log(`Fetching fresh advanced TVL data for ${coinId}`);
        freshAdvancedTVLData = await advancedTVLService.storeAdvancedTVLMetrics(coinId);
      } catch (error) {
        console.error('Error fetching fresh advanced TVL metrics:', error);
        // Continue with existing data if fetch fails
      }
    }
    
    // Use fresh data if available, otherwise use existing data
    const finalAdvancedTVLData = freshAdvancedTVLData || advancedTVLData;
    
    // Format the response with validation information
    const advancedTVLMetrics = finalAdvancedTVLData ? {
      // TVL Velocity Metrics
      tvlVelocity: {
        velocity: finalAdvancedTVLData.tvlVelocity,
        volumeToTVLRatio: finalAdvancedTVLData.volumeToTVLRatio,
        turnoverRate: finalAdvancedTVLData.turnoverRate,
        avgHoldingPeriod: finalAdvancedTVLData.avgHoldingPeriod,
        liquidityEfficiency: finalAdvancedTVLData.liquidityEfficiency
      },
      
      // TVL Efficiency Metrics
      tvlEfficiency: {
        feeToTVLRatio: finalAdvancedTVLData.feeToTVLRatio,
        revenueToTVLRatio: finalAdvancedTVLData.revenueToTVLRatio,
        roi: finalAdvancedTVLData.roi,
        capitalEfficiency: finalAdvancedTVLData.capitalEfficiency,
        protocolYield: finalAdvancedTVLData.protocolYield,
        economicOutput: finalAdvancedTVLData.economicOutput
      },
      
      // Combined Metrics
      combinedScore: finalAdvancedTVLData.combinedScore,
      marketHealth: finalAdvancedTVLData.marketHealth,
      recommendations: finalAdvancedTVLData.recommendations ? JSON.parse(finalAdvancedTVLData.recommendations) : [],
      
      // Metadata
      lastUpdated: finalAdvancedTVLData.timestamp,
      is_outdated: isDataOutdated(finalAdvancedTVLData.timestamp, now),
      confidence: finalAdvancedTVLData.confidence || 0.8,
      source: 'Advanced TVL Analytics Engine'
    } : {
      tvlVelocity: {
        velocity: null,
        volumeToTVLRatio: null,
        turnoverRate: null,
        avgHoldingPeriod: null,
        liquidityEfficiency: null
      },
      tvlEfficiency: {
        feeToTVLRatio: null,
        revenueToTVLRatio: null,
        roi: null,
        capitalEfficiency: null,
        protocolYield: null,
        economicOutput: null
      },
      combinedScore: null,
      marketHealth: null,
      recommendations: [],
      error: "N/A - No advanced TVL data available",
      confidence: 0,
      source: 'N/A'
    };
    
    // Get context data for comparison
    let contextData: any = null;
    try {
      // Get recent advanced TVL data for comparison
      const recentMetrics = await db.advancedTVLMetric.findMany({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' },
        take: 7 // Last 7 data points
      });
      
      if (recentMetrics.length > 1) {
        contextData = {
          historicalTrends: {
            velocityTrend: calculateTrend(recentMetrics.map(m => m.tvlVelocity).filter(v => v !== null)),
            efficiencyTrend: calculateTrend(recentMetrics.map(m => m.capitalEfficiency).filter(v => v !== null)),
            scoreTrend: calculateTrend(recentMetrics.map(m => m.combinedScore).filter(v => v !== null))
          },
          dataPoints: recentMetrics.length,
          averageScore: recentMetrics.reduce((sum, m) => sum + (m.combinedScore || 0), 0) / recentMetrics.length
        };
      }
    } catch (error) {
      console.error('Error fetching context data:', error);
    }
    
    const response = {
      cryptocurrency: {
        id: crypto.id,
        symbol: crypto.symbol,
        name: crypto.name,
        coinGeckoId: crypto.coinGeckoId
      },
      advancedTVLMetrics,
      context: contextData,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching advanced TVL metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advanced TVL metrics' },
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
    
    const advancedTVLService = AdvancedTVLMetricsService.getInstance();
    
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
        
        // Force refresh advanced TVL data
        const refreshResult = await advancedTVLService.storeAdvancedTVLMetrics(coinId);
        return NextResponse.json({
          success: true,
          message: 'Advanced TVL metrics refreshed successfully',
          data: refreshResult
        });
        
      case 'analyze':
        // Get real-time analysis without storing
        const analysisResult = await advancedTVLService.getAdvancedTVLMetrics(coinId);
        return NextResponse.json({
          success: true,
          message: 'Advanced TVL analysis completed',
          data: analysisResult
        });
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in advanced TVL metrics POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate trend from array of values
function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
  if (values.length < 2) {
    return 'stable';
  }
  
  const first = values[0];
  const last = values[values.length - 1];
  if (!first || !last) return 'stable';
  const change = ((last - first) / first) * 100;
  
  if (Math.abs(change) < 2) {
    return 'stable';
  }
  
  return change > 0 ? 'increasing' : 'decreasing';
}