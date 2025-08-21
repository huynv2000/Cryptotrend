import { NextRequest, NextResponse } from 'next/server';
import { TVLAnalysisService } from '@/lib/tvl-analysis-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coinId');
    const period = parseInt(searchParams.get('period') || '30');
    const forceRefresh = searchParams.get('refresh') === 'true';
    const type = searchParams.get('type') || 'moving-average'; // 'moving-average' or 'trend-analysis'

    // Validate required parameters
    if (!coinId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'coinId is required',
          details: 'Please provide a valid coin identifier (e.g., bitcoin, ethereum)'
        },
        { status: 400 }
      );
    }

    // Validate period
    if (isNaN(period) || period < 1 || period > 365) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid period',
          details: 'Period must be between 1 and 365 days'
        },
        { status: 400 }
      );
    }

    const analysisService = TVLAnalysisService.getInstance();

    let result;
    
    switch (type) {
      case 'moving-average':
        result = await analysisService.calculateMovingAverage(coinId, period, forceRefresh);
        break;
        
      case 'trend-analysis':
        result = await analysisService.getTVLTrendAnalysis(coinId, period);
        break;
        
      default:
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid analysis type',
            details: 'Supported types: moving-average, trend-analysis'
          },
          { status: 400 }
        );
    }

    // Add performance headers
    const response = NextResponse.json({
      success: true,
      data: result,
      metadata: {
        coinId,
        period,
        type,
        timestamp: new Date().toISOString(),
        cacheInfo: analysisService.getCacheStats()
      }
    });

    // Add caching headers for client-side caching
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    response.headers.set('X-Analysis-Type', type);
    response.headers.set('X-Period', period.toString());

    return response;

  } catch (error) {
    console.error('Error in TVL analysis API:', error);
    
    // Determine appropriate status code
    let statusCode = 500;
    let errorMessage = 'Failed to calculate TVL analysis';
    
    if (error instanceof Error) {
      // Handle specific error types
      if (error.message.includes('not found')) {
        statusCode = 404;
        errorMessage = error.message;
      } else if (error.message.includes('No historical')) {
        statusCode = 404;
        errorMessage = error.message;
      } else if (error.message.includes('Invalid')) {
        statusCode = 400;
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { 
        success: false,
        error: errorMessage,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, coinId, period } = body;

    if (!action || !coinId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Missing required parameters',
          details: 'action and coinId are required'
        },
        { status: 400 }
      );
    }

    const analysisService = TVLAnalysisService.getInstance();

    switch (action) {
      case 'clear-cache':
        analysisService.clearCache(coinId);
        return NextResponse.json({
          success: true,
          message: `Cache cleared for ${coinId}`,
          timestamp: new Date().toISOString()
        });

      case 'clear-all-cache':
        analysisService.clearCache();
        return NextResponse.json({
          success: true,
          message: 'All cache cleared',
          timestamp: new Date().toISOString()
        });

      case 'get-cache-stats':
        const stats = analysisService.getCacheStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString()
        });

      case 'force-refresh':
        const refreshPeriod = period || 30;
        const result = await analysisService.calculateMovingAverage(coinId, refreshPeriod, true);
        return NextResponse.json({
          success: true,
          message: `Force refresh completed for ${coinId}`,
          data: result,
          timestamp: new Date().toISOString()
        });

      default:
        return NextResponse.json(
          { 
            success: false,
            error: 'Unknown action',
            details: `Action '${action}' is not supported`
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in TVL analysis POST API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process request',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}