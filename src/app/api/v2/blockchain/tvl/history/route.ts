import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TVLAnalysisService } from '@/lib/tvl-analysis-service';
import { cacheService } from '@/lib/cache-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coinId');
    const days = parseInt(searchParams.get('days') || '30');
    const page = parseInt(searchParams.get('page') || '0');
    const pageSize = parseInt(searchParams.get('pageSize') || '30');

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

    // Validate parameters
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid days parameter',
          details: 'Days must be between 1 and 365'
        },
        { status: 400 }
      );
    }

    if (isNaN(page) || page < 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid page parameter',
          details: 'Page must be a non-negative integer'
        },
        { status: 400 }
      );
    }

    if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid pageSize parameter',
          details: 'PageSize must be between 1 and 100'
        },
        { status: 400 }
      );
    }

    // Create cache key
    const cacheKey = `tvl-history-${coinId}-${days}-${page}-${pageSize}`;
    
    // Check cache first
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      console.log(`Cache hit for TVL history: ${cacheKey}`);
      return NextResponse.json({
        success: true,
        data: cachedData,
        metadata: {
          coinId,
          days,
          page,
          pageSize,
          cached: true,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Get cryptocurrency info
    const crypto = await db.cryptocurrency.findFirst({
      where: { coinGeckoId: coinId }
    });

    if (!crypto) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Cryptocurrency not found',
          details: `No cryptocurrency found with CoinGecko ID: ${coinId}`
        },
        { status: 404 }
      );
    }

    // Get TVL metrics with historical data
    const tvlMetrics = await db.tVLMetric.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    if (!tvlMetrics || !tvlMetrics.tvlHistory) {
      return NextResponse.json(
        { 
          success: false,
          error: 'No TVL history data found',
          details: `No historical TVL data available for ${coinId}`
        },
        { status: 404 }
      );
    }

    // Parse historical data
    let historicalData: Array<{
      date: string;
      tvl: number;
      dominance?: number;
      changePercent?: number;
    }> = [];

    try {
      historicalData = JSON.parse(tvlMetrics.tvlHistory);
      
      if (!Array.isArray(historicalData)) {
        throw new Error('Invalid historical data format');
      }
    } catch (error) {
      console.error('Error parsing TVL history:', error);
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid historical data format',
          details: 'Failed to parse historical TVL data'
        },
        { status: 500 }
      );
    }

    // Filter data by date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const filteredData = historicalData
      .filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= cutoffDate;
      })
      .map(item => ({
        ...item,
        date: item.date, // Ensure date is in string format
        tvl: Number(item.tvl) || 0,
        dominance: Number(item.dominance) || 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate daily changes
    const dataWithChanges = filteredData.map((item, index) => {
      let changePercent = 0;
      if (index > 0) {
        const prevTVL = (filteredData[index - 1] as any)?.tvl || 0;
        if (prevTVL > 0) {
          changePercent = (((item as any)?.tvl || 0) - prevTVL) / prevTVL * 100;
        }
      }
      
      return {
        ...item,
        changePercent
      };
    });

    // Paginate results
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = dataWithChanges.slice(startIndex, endIndex);

    // Cache the result
    cacheService.set(cacheKey, paginatedData, 5 * 60 * 1000); // 5 minutes

    console.log(`TVL history fetched for ${coinId}: ${paginatedData.length} items (page ${page})`);

    // Add performance headers
    const response = NextResponse.json({
      success: true,
      data: paginatedData,
      metadata: {
        coinId,
        days,
        page,
        pageSize,
        totalItems: dataWithChanges.length,
        totalPages: Math.ceil(dataWithChanges.length / pageSize),
        hasNextPage: endIndex < dataWithChanges.length,
        hasPreviousPage: page > 0,
        cached: false,
        timestamp: new Date().toISOString()
      }
    });

    // Add caching headers
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    response.headers.set('X-Coin-ID', coinId);
    response.headers.set('X-Days', days.toString());

    return response;

  } catch (error) {
    console.error('Error fetching TVL history:', error);
    
    // Determine appropriate status code
    let statusCode = 500;
    let errorMessage = 'Failed to fetch TVL history';
    
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
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
    const { action, coinId } = body;

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

    switch (action) {
      case 'clear-cache':
        const deletedCount = cacheService.deleteByPattern(new RegExp(`^tvl-history-${coinId}-`));
        return NextResponse.json({
          success: true,
          message: `Cleared ${deletedCount} cache entries for ${coinId}`,
          timestamp: new Date().toISOString()
        });

      case 'prefetch':
        // Prefetch common timeframes
        const timeframes = [7, 30, 90];
        const prefetchResults = await Promise.allSettled(
          timeframes.map(days => 
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v2/blockchain/tvl/history?coinId=${coinId}&days=${days}`)
          )
        );

        const successful = prefetchResults.filter(result => result.status === 'fulfilled').length;
        
        return NextResponse.json({
          success: true,
          message: `Prefetched ${successful}/${timeframes.length} timeframes for ${coinId}`,
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
    console.error('Error in TVL history POST API:', error);
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