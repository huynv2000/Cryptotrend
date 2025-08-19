// Enhanced TVL Metrics API Endpoint
// Provides TVL Concentration Risk and TVL Sustainability Score metrics

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EnhancedTVLMetricsService } from '@/lib/enhanced-tvl-metrics';

// Helper function to check if data is outdated
function isDataOutdated(timestamp: Date, now: Date): boolean {
  const hoursDiff = (now.getTime() - new Date(timestamp).getTime()) / (1000 * 60 * 60);
  return hoursDiff > 3; // Consider data outdated if older than 3 hours
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coinId') || 'ethereum';
    
    // Initialize service
    const enhancedTVLService = EnhancedTVLMetricsService.getInstance();
    
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
    
    // Get enhanced TVL metrics with validation
    const enhancedTVLData = await db.enhancedTVLMetric.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });
    
    // If no enhanced TVL data or outdated, try to fetch fresh data
    const now = new Date();
    let freshEnhancedTVLData = null;
    
    if (!enhancedTVLData || isDataOutdated(enhancedTVLData.timestamp, now)) {
      try {
        console.log(`Fetching fresh enhanced TVL data for ${coinId}`);
        freshEnhancedTVLData = await enhancedTVLService.storeEnhancedTVLMetrics(coinId);
      } catch (error) {
        console.error('Error fetching fresh enhanced TVL metrics:', error);
        // Continue with existing data if fetch fails
      }
    }
    
    // Use fresh data if available, otherwise use existing data
    const finalEnhancedTVLData = freshEnhancedTVLData || enhancedTVLData;
    
    // Format the response with validation information
    const enhancedTVLMetrics = finalEnhancedTVLData ? {
      // TVL Concentration Risk Metrics
      concentrationRisk: {
        concentrationRisk: finalEnhancedTVLData.concentrationRisk,
        herfindahlIndex: finalEnhancedTVLData.herfindahlIndex,
        topProtocolDominance: finalEnhancedTVLData.topProtocolDominance,
        top3ProtocolDominance: finalEnhancedTVLData.top3ProtocolDominance,
        top5ProtocolDominance: finalEnhancedTVLData.top5ProtocolDominance,
        protocolDiversity: finalEnhancedTVLData.protocolDiversity,
        concentrationLevel: finalEnhancedTVLData.concentrationLevel,
        concentrationTrend: finalEnhancedTVLData.concentrationTrend
      },
      
      // TVL Sustainability Metrics
      sustainability: {
        sustainabilityScore: finalEnhancedTVLData.sustainabilityScore,
        revenueStability: finalEnhancedTVLData.revenueStability,
        userGrowthRate: finalEnhancedTVLData.userGrowthRate,
        protocolHealth: finalEnhancedTVLData.protocolHealth,
        ecosystemMaturity: finalEnhancedTVLData.ecosystemMaturity,
        riskAdjustedReturns: finalEnhancedTVLData.riskAdjustedReturns,
        sustainabilityLevel: finalEnhancedTVLData.sustainabilityLevel,
        sustainabilityTrend: finalEnhancedTVLData.sustainabilityTrend
      },
      
      // Combined Analysis
      overallTVLHealth: finalEnhancedTVLData.overallTVLHealth,
      recommendations: finalEnhancedTVLData.recommendations ? JSON.parse(finalEnhancedTVLData.recommendations) : [],
      riskFactors: finalEnhancedTVLData.riskFactors ? JSON.parse(finalEnhancedTVLData.riskFactors) : [],
      strengthFactors: finalEnhancedTVLData.strengthFactors ? JSON.parse(finalEnhancedTVLData.strengthFactors) : [],
      
      // Metadata
      lastUpdated: finalEnhancedTVLData.timestamp,
      isOutdated: isDataOutdated(finalEnhancedTVLData.timestamp, now),
      confidence: finalEnhancedTVLData.confidence || 0.75,
      source: 'Enhanced TVL Analytics Engine'
    } : {
      concentrationRisk: {
        concentrationRisk: null,
        herfindahlIndex: null,
        topProtocolDominance: null,
        top3ProtocolDominance: null,
        top5ProtocolDominance: null,
        protocolDiversity: null,
        concentrationLevel: null,
        concentrationTrend: null
      },
      sustainability: {
        sustainabilityScore: null,
        revenueStability: null,
        userGrowthRate: null,
        protocolHealth: null,
        ecosystemMaturity: null,
        riskAdjustedReturns: null,
        sustainabilityLevel: null,
        sustainabilityTrend: null
      },
      overallTVLHealth: null,
      recommendations: [],
      riskFactors: [],
      strengthFactors: [],
      error: "N/A - No enhanced TVL data available",
      confidence: 0,
      source: 'N/A'
    };
    
    // Get context data for comparison
    let contextData = null;
    try {
      // Get recent enhanced TVL data for comparison
      const recentMetrics = await db.enhancedTVLMetric.findMany({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' },
        take: 7 // Last 7 data points
      });
      
      if (recentMetrics.length > 1) {
        contextData = {
          historicalTrends: {
            concentrationRiskTrend: calculateTrend(recentMetrics.map(m => m.concentrationRisk).filter(v => v !== null)),
            sustainabilityTrend: calculateTrend(recentMetrics.map(m => m.sustainabilityScore).filter(v => v !== null)),
            healthTrend: calculateTrend(recentMetrics.map(m => m.overallTVLHealth).filter(v => v !== null))
          },
          dataPoints: recentMetrics.length,
          averageConcentrationRisk: recentMetrics.reduce((sum, m) => sum + (m.concentrationRisk || 0), 0) / recentMetrics.length,
          averageSustainability: recentMetrics.reduce((sum, m) => sum + (m.sustainabilityScore || 0), 0) / recentMetrics.length,
          averageHealth: recentMetrics.reduce((sum, m) => sum + (m.overallTVLHealth || 0), 0) / recentMetrics.length
        };
      }
    } catch (error) {
      console.error('Error fetching context data:', error);
    }
    
    // Get benchmark data for market comparison
    let benchmarkData = null;
    try {
      // Get average metrics across all cryptocurrencies for comparison
      const allRecentMetrics = await db.enhancedTVLMetric.findMany({
        orderBy: { timestamp: 'desc' },
        take: 100 // Get recent metrics across all cryptos
      });
      
      if (allRecentMetrics.length > 0) {
        benchmarkData = {
          marketAverageConcentrationRisk: allRecentMetrics.reduce((sum, m) => sum + (m.concentrationRisk || 0), 0) / allRecentMetrics.length,
          marketAverageSustainability: allRecentMetrics.reduce((sum, m) => sum + (m.sustainabilityScore || 0), 0) / allRecentMetrics.length,
          marketAverageHealth: allRecentMetrics.reduce((sum, m) => sum + (m.overallTVLHealth || 0), 0) / allRecentMetrics.length,
          totalDataPoints: allRecentMetrics.length
        };
      }
    } catch (error) {
      console.error('Error fetching benchmark data:', error);
    }
    
    const response = {
      cryptocurrency: {
        id: crypto.id,
        symbol: crypto.symbol,
        name: crypto.name,
        coinGeckoId: crypto.coinGeckoId
      },
      enhancedTVLMetrics,
      context: contextData,
      benchmark: benchmarkData,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching enhanced TVL metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch enhanced TVL metrics' },
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
    
    const enhancedTVLService = EnhancedTVLMetricsService.getInstance();
    
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
        
        // Force refresh enhanced TVL data
        const refreshResult = await enhancedTVLService.storeEnhancedTVLMetrics(coinId);
        return NextResponse.json({
          success: true,
          message: 'Enhanced TVL metrics refreshed successfully',
          data: refreshResult
        });
        
      case 'analyze':
        // Get real-time analysis without storing
        const analysisResult = await enhancedTVLService.getEnhancedTVLMetrics(coinId);
        return NextResponse.json({
          success: true,
          message: 'Enhanced TVL analysis completed',
          data: analysisResult
        });
        
      case 'refresh_all':
        // Refresh enhanced TVL data for all active cryptocurrencies
        const activeCryptos = await db.cryptocurrency.findMany({
          where: { isActive: true }
        });
        
        const results = [];
        for (const crypto of activeCryptos) {
          try {
            const result = await enhancedTVLService.storeEnhancedTVLMetrics(crypto.coinGeckoId);
            results.push({
              coinId: crypto.coinGeckoId,
              success: true,
              data: result
            });
          } catch (error) {
            results.push({
              coinId: crypto.coinGeckoId,
              success: false,
              error: error.message
            });
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Enhanced TVL metrics refreshed for all cryptocurrencies',
          results
        });
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Error in enhanced TVL metrics POST:', error);
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
  const change = ((last - first) / first) * 100;
  
  if (Math.abs(change) < 2) {
    return 'stable';
  }
  
  return change > 0 ? 'increasing' : 'decreasing';
}