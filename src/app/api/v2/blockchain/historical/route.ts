import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockchain = searchParams.get('blockchain') || 'bitcoin';
    const metric = searchParams.get('metric') || 'price';
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

    // Calculate time range based on timeframe
    const now = new Date();
    let timeRange: number;
    let interval: string;

    switch (timeframe) {
      case '1h':
        timeRange = 60 * 60 * 1000; // 1 hour
        interval = '5m';
        break;
      case '24h':
        timeRange = 24 * 60 * 60 * 1000; // 24 hours
        interval = '1h';
        break;
      case '7d':
        timeRange = 7 * 24 * 60 * 60 * 1000; // 7 days
        interval = '1d';
        break;
      case '30d':
        timeRange = 30 * 24 * 60 * 60 * 1000; // 30 days
        interval = '1d';
        break;
      case '90d':
        timeRange = 90 * 24 * 60 * 60 * 1000; // 90 days
        interval = '1d';
        break;
      default:
        timeRange = 24 * 60 * 60 * 1000; // Default 24 hours
        interval = '1h';
    }

    const startTime = new Date(now.getTime() - timeRange);

    // Fetch historical data based on metric type
    let historicalData: any[] = [];

    switch (metric) {
      case 'price':
        historicalData = await db.priceHistory.findMany({
          where: {
            cryptoId: crypto.id,
            timestamp: {
              gte: startTime,
              lte: now
            }
          },
          orderBy: { timestamp: 'asc' }
        });
        break;

      case 'volume':
        historicalData = await db.volumeHistory.findMany({
          where: {
            cryptoId: crypto.id,
            timestamp: {
              gte: startTime,
              lte: now
            }
          },
          orderBy: { timestamp: 'asc' }
        });
        break;

      case 'onchain':
        historicalData = await db.onChainMetric.findMany({
          where: {
            cryptoId: crypto.id,
            timestamp: {
              gte: startTime,
              lte: now
            }
          },
          orderBy: { timestamp: 'asc' }
        });
        break;

      case 'technical':
        historicalData = await db.technicalIndicator.findMany({
          where: {
            cryptoId: crypto.id,
            timestamp: {
              gte: startTime,
              lte: now
            }
          },
          orderBy: { timestamp: 'asc' }
        });
        break;

      case 'derivatives':
        historicalData = await db.derivativeMetric.findMany({
          where: {
            cryptoId: crypto.id,
            timestamp: {
              gte: startTime,
              lte: now
            }
          },
          orderBy: { timestamp: 'asc' }
        });
        break;

      case 'sentiment':
        historicalData = await db.sentimentMetric.findMany({
          where: {
            timestamp: {
              gte: startTime,
              lte: now
            }
          },
          orderBy: { timestamp: 'asc' }
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid metric type' },
          { status: 400 }
        );
    }

    // Format the historical data
    const formattedData = historicalData.map(item => {
      switch (metric) {
        case 'price':
          return {
            timestamp: item.timestamp,
            price: item.price,
            volume24h: item.volume24h,
            marketCap: item.marketCap,
            priceChange24h: item.priceChange24h
          };

        case 'volume':
          return {
            timestamp: item.timestamp,
            dailyVolume: item.dailyVolume,
            price: item.price,
            exchangeVolume: item.exchangeVolume,
            volumeChange24h: item.volumeChange24h,
            volumeAvg30d: item.volumeAvg30d,
            volumeVsAvg: item.volumeVsAvg
          };

        case 'onchain':
          return {
            timestamp: item.timestamp,
            mvrv: item.mvrv,
            nupl: item.nupl,
            sopr: item.sopr,
            activeAddresses: item.activeAddresses,
            exchangeInflow: item.exchangeInflow,
            exchangeOutflow: item.exchangeOutflow,
            transactionVolume: item.transactionVolume,
            whaleHoldingsPercentage: item.whaleHoldingsPercentage,
            retailHoldingsPercentage: item.retailHoldingsPercentage,
            exchangeHoldingsPercentage: item.exchangeHoldingsPercentage
          };

        case 'technical':
          return {
            timestamp: item.timestamp,
            rsi: item.rsi,
            ma50: item.ma50,
            ma200: item.ma200,
            macd: item.macd,
            macdSignal: item.macdSignal,
            bollingerUpper: item.bollingerUpper,
            bollingerLower: item.bollingerLower,
            bollingerMiddle: item.bollingerMiddle
          };

        case 'derivatives':
          return {
            timestamp: item.timestamp,
            openInterest: item.openInterest,
            fundingRate: item.fundingRate,
            liquidationVolume: item.liquidationVolume,
            putCallRatio: item.putCallRatio
          };

        case 'sentiment':
          return {
            timestamp: item.timestamp,
            fearGreedIndex: item.fearGreedIndex,
            fearGreedClassification: item.fearGreedClassification,
            socialSentiment: item.socialSentiment,
            redditSentiment: item.redditSentiment,
            socialVolume: item.socialVolume,
            engagementRate: item.engagementRate,
            influencerSentiment: item.influencerSentiment,
            trendingScore: item.trendingScore,
            newsSentiment: item.newsSentiment,
            newsVolume: item.newsVolume,
            positiveNewsCount: item.positiveNewsCount,
            negativeNewsCount: item.negativeNewsCount,
            neutralNewsCount: item.neutralNewsCount,
            sentimentScore: item.sentimentScore,
            buzzScore: item.buzzScore,
            trendsScore: item.trendsScore,
            searchVolume: item.searchVolume,
            trendingKeywords: item.trendingKeywords,
            trendDirection: item.trendDirection
          };

        default:
          return {
            timestamp: item.timestamp,
            value: 0
          };
      }
    });

    // If no data found, generate mock data for demonstration
    if (formattedData.length === 0) {
      const mockData = generateMockHistoricalData(metric, timeframe, now, timeRange);
      return NextResponse.json({
        blockchain,
        metric,
        timeframe,
        interval,
        data: mockData,
        isMockData: true,
        dataPoints: mockData.length
      });
    }

    // Calculate statistics
    const stats = calculateStatistics(formattedData, metric);

    return NextResponse.json({
      blockchain,
      metric,
      timeframe,
      interval,
      data: formattedData,
      statistics: stats,
      isMockData: false,
      dataPoints: formattedData.length
    });

  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}

// Helper functions
function generateMockHistoricalData(metric: string, timeframe: string, now: Date, timeRange: number): any[] {
  const dataPoints = Math.min(100, Math.max(24, Math.floor(timeRange / (5 * 60 * 1000)))); // Max 100 data points
  const data = [];
  const baseValue = getBaseValueForMetric(metric);
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * timeRange / dataPoints));
    const randomVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
    const trendFactor = Math.sin(i / dataPoints * Math.PI * 2) * 0.05; // Sinusoidal trend
    const value = baseValue * (1 + randomVariation + trendFactor);
    
    const dataPoint: any = {
      timestamp: timestamp
    };
    
    switch (metric) {
      case 'price':
        dataPoint.price = value;
        dataPoint.volume24h = value * 1000000 * (0.8 + Math.random() * 0.4);
        dataPoint.marketCap = value * 19000000; // Assuming ~19M BTC
        dataPoint.priceChange24h = (Math.random() - 0.5) * 10;
        break;
        
      case 'volume':
        dataPoint.dailyVolume = value * 1000000;
        dataPoint.price = baseValue;
        dataPoint.exchangeVolume = value * 800000;
        dataPoint.volumeChange24h = (Math.random() - 0.5) * 20;
        dataPoint.volumeAvg30d = value * 900000;
        dataPoint.volumeVsAvg = (Math.random() - 0.5) * 0.3;
        break;
        
      case 'onchain':
        dataPoint.mvrv = 1 + (Math.random() - 0.5) * 2;
        dataPoint.nupl = (Math.random() - 0.5) * 0.5;
        dataPoint.sopr = 1 + (Math.random() - 0.5) * 0.5;
        dataPoint.activeAddresses = 500000 + Math.random() * 1000000;
        dataPoint.exchangeInflow = value * 100000;
        dataPoint.exchangeOutflow = value * 95000;
        dataPoint.transactionVolume = value * 200000;
        dataPoint.whaleHoldingsPercentage = 40 + Math.random() * 20;
        dataPoint.retailHoldingsPercentage = 30 + Math.random() * 15;
        dataPoint.exchangeHoldingsPercentage = 10 + Math.random() * 10;
        break;
        
      case 'technical':
        dataPoint.rsi = 30 + Math.random() * 40;
        dataPoint.ma50 = baseValue * (0.95 + Math.random() * 0.1);
        dataPoint.ma200 = baseValue * (0.9 + Math.random() * 0.2);
        dataPoint.macd = (Math.random() - 0.5) * baseValue * 0.02;
        dataPoint.macdSignal = (Math.random() - 0.5) * baseValue * 0.015;
        dataPoint.bollingerUpper = baseValue * 1.05;
        dataPoint.bollingerLower = baseValue * 0.95;
        dataPoint.bollingerMiddle = baseValue;
        break;
        
      case 'derivatives':
        dataPoint.openInterest = value * 5000000;
        dataPoint.fundingRate = (Math.random() - 0.5) * 0.01;
        dataPoint.liquidationVolume = value * 100000;
        dataPoint.putCallRatio = 0.5 + Math.random() * 1;
        break;
        
      case 'sentiment':
        dataPoint.fearGreedIndex = 20 + Math.random() * 60;
        dataPoint.fearGreedClassification = getFearGreedClassification(dataPoint.fearGreedIndex);
        dataPoint.socialSentiment = (Math.random() - 0.5) * 2;
        dataPoint.redditSentiment = (Math.random() - 0.5) * 2;
        dataPoint.socialVolume = 1000 + Math.random() * 5000;
        dataPoint.engagementRate = Math.random();
        dataPoint.influencerSentiment = (Math.random() - 0.5) * 2;
        dataPoint.trendingScore = Math.random() * 100;
        dataPoint.newsSentiment = (Math.random() - 0.5) * 2;
        dataPoint.newsVolume = 100 + Math.random() * 500;
        dataPoint.positiveNewsCount = Math.floor(Math.random() * 20);
        dataPoint.negativeNewsCount = Math.floor(Math.random() * 20);
        dataPoint.neutralNewsCount = Math.floor(Math.random() * 30);
        dataPoint.sentimentScore = (Math.random() - 0.5) * 2;
        dataPoint.buzzScore = Math.random() * 100;
        dataPoint.trendsScore = Math.random() * 100;
        dataPoint.searchVolume = 50 + Math.random() * 100;
        dataPoint.trendingKeywords = 'bitcoin,crypto,blockchain';
        dataPoint.trendDirection = Math.random() > 0.5 ? 'up' : 'down';
        break;
    }
    
    data.push(dataPoint);
  }
  
  return data;
}

function getBaseValueForMetric(metric: string): number {
  switch (metric) {
    case 'price':
      return 45000; // Base BTC price in USD
    case 'volume':
      return 30000000000; // Base volume in USD
    case 'onchain':
      return 45000; // Base on-chain value
    case 'technical':
      return 45000; // Base technical value
    case 'derivatives':
      return 45000; // Base derivatives value
    case 'sentiment':
      return 50; // Base sentiment score
    default:
      return 100;
  }
}

function getFearGreedClassification(score: number): string {
  if (score < 25) return 'Extreme Fear';
  if (score < 45) return 'Fear';
  if (score < 55) return 'Neutral';
  if (score < 75) return 'Greed';
  return 'Extreme Greed';
}

function calculateStatistics(data: any[], metric: string): any {
  if (data.length === 0) return null;
  
  const getValue = (item: any) => {
    switch (metric) {
      case 'price':
        return item.price;
      case 'volume':
        return item.dailyVolume;
      case 'onchain':
        return item.activeAddresses;
      case 'technical':
        return item.rsi;
      case 'derivatives':
        return item.openInterest;
      case 'sentiment':
        return item.fearGreedIndex;
      default:
        return 0;
    }
  };
  
  const values = data.map(getValue).filter(v => v !== null && v !== undefined);
  
  if (values.length === 0) return null;
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Calculate standard deviation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate trend
  const firstValue = values[values.length - 1];
  const lastValue = values[0];
  const trend = ((lastValue - firstValue) / firstValue) * 100;
  
  return {
    min,
    max,
    mean,
    stdDev,
    trend,
    dataPoints: values.length,
    change: lastValue - firstValue,
    changePercent: trend
  };
}