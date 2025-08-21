import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { TVLAnalysisService } from '@/lib/tvl-analysis-service';
import { cacheService } from '@/lib/cache-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coinId = searchParams.get('coinId');
    const days = parseInt(searchParams.get('days') || '30');
    const includeMovingAverage = searchParams.get('includeMovingAverage') === 'true';
    const forceRefresh = searchParams.get('refresh') === 'true';

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

    // Create cache key
    const cacheKey = `combined-tvl-${coinId}-${days}-${includeMovingAverage}`;
    
    // Check cache first
    const cachedData = cacheService.get(cacheKey);
    if (cachedData && !forceRefresh) {
      console.log(`Cache hit for combined TVL data: ${cacheKey}`);
      return NextResponse.json({
        success: true,
        data: cachedData,
        metadata: {
          coinId,
          days,
          includeMovingAverage,
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
        date: item.date,
        tvl: Number(item.tvl) || 0,
        dominance: Number(item.dominance) || 0
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate daily changes
    const dataWithChanges = filteredData.map((item, index) => {
      let changePercent = 0;
      if (index > 0) {
        const prevTVL = filteredData[index - 1].tvl;
        if (prevTVL > 0) {
          changePercent = ((item.tvl - prevTVL) / prevTVL) * 100;
        }
      }
      
      return {
        ...item,
        changePercent
      };
    });

    // Calculate statistics
    const tvls = dataWithChanges.map(d => d.tvl);
    const currentTVL = tvls[tvls.length - 1];
    const previousTVL = tvls.length > 1 ? tvls[tvls.length - 2] : currentTVL;
    const change24h = previousTVL > 0 ? ((currentTVL - previousTVL) / previousTVL) * 100 : 0;
    
    const avgTVL = tvls.reduce((sum, tvl) => sum + tvl, 0) / tvls.length;
    const peakTVL = Math.max(...tvls);
    const troughTVL = Math.min(...tvls);
    
    // Calculate volatility (standard deviation)
    const variance = tvls.reduce((sum, tvl) => sum + Math.pow(tvl - avgTVL, 2), 0) / tvls.length;
    const volatility = Math.sqrt(variance) / avgTVL * 100;

    const stats = {
      currentTVL,
      change24h,
      avgTVL,
      peakTVL,
      troughTVL,
      volatility
    };

    // Prepare response data
    const responseData: any = {
      history: dataWithChanges,
      stats
    };

    // Add moving average data if requested
    let movingAverageData = null;
    let metrics = null;

    if (includeMovingAverage && dataWithChanges.length > 0) {
      try {
        const analysisService = TVLAnalysisService.getInstance();
        const maResult = await analysisService.calculateMovingAverage(coinId, 30, forceRefresh);
        
        movingAverageData = maResult.data;
        metrics = maResult.metrics;
        
        responseData.movingAverage = movingAverageData;
        responseData.metrics = metrics;
      } catch (error) {
        console.warn('Failed to calculate moving average:', error);
      }
    }

    // Cache the result
    cacheService.set(cacheKey, responseData, 5 * 60 * 1000); // 5 minutes

    console.log(`Combined TVL data fetched for ${coinId}: ${dataWithChanges.length} history points${includeMovingAverage ? ', with MA' : ''}`);

    // Add performance headers
    const response = NextResponse.json({
      success: true,
      data: responseData,
      metadata: {
        coinId,
        days,
        includeMovingAverage,
        totalItems: dataWithChanges.length,
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
    console.error('Error fetching combined TVL data:', error);
    
    // Determine appropriate status code
    let statusCode = 500;
    let errorMessage = 'Failed to fetch combined TVL data';
    
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