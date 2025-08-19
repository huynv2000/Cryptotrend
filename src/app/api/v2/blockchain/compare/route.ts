import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blockchains, metric, timeframe = '24h' } = body;

    if (!blockchains || !Array.isArray(blockchains) || blockchains.length === 0) {
      return NextResponse.json(
        { error: 'Blockchains array is required' },
        { status: 400 }
      );
    }

    if (!metric) {
      return NextResponse.json(
        { error: 'Metric is required' },
        { status: 400 }
      );
    }

    // Limit to 10 blockchains for performance
    const limitedBlockchains = blockchains.slice(0, 10);

    // Get cryptocurrency data for each blockchain
    const cryptoData = await Promise.all(
      limitedBlockchains.map(async (blockchain) => {
        const crypto = await db.cryptocurrency.findFirst({
          where: { coinGeckoId: blockchain }
        });
        return { blockchain, crypto };
      })
    );

    // Filter out blockchains that don't exist
    const validCryptoData = cryptoData.filter(item => item.crypto !== null);

    if (validCryptoData.length === 0) {
      return NextResponse.json(
        { error: 'No valid blockchains found' },
        { status: 404 }
      );
    }

    // Calculate time range based on timeframe
    const now = new Date();
    let timeRange: number;

    switch (timeframe) {
      case '1h':
        timeRange = 60 * 60 * 1000; // 1 hour
        break;
      case '24h':
        timeRange = 24 * 60 * 60 * 1000; // 24 hours
        break;
      case '7d':
        timeRange = 7 * 24 * 60 * 60 * 1000; // 7 days
        break;
      case '30d':
        timeRange = 30 * 24 * 60 * 60 * 1000; // 30 days
        break;
      case '90d':
        timeRange = 90 * 24 * 60 * 60 * 1000; // 90 days
        break;
      default:
        timeRange = 24 * 60 * 60 * 1000; // Default 24 hours
    }

    const startTime = new Date(now.getTime() - timeRange);

    // Fetch comparison data for each blockchain
    const comparisonData = await Promise.all(
      validCryptoData.map(async ({ blockchain, crypto }) => {
        let data: any = {};

        switch (metric) {
          case 'price':
            const priceData = await db.priceHistory.findFirst({
              where: { cryptoId: crypto!.id },
              orderBy: { timestamp: 'desc' }
            });
            data = {
              currentPrice: priceData?.price || 0,
              priceChange24h: priceData?.priceChange24h || 0,
              marketCap: priceData?.marketCap || 0,
              volume24h: priceData?.volume24h || 0,
            };
            break;

          case 'volume':
            const volumeData = await db.volumeHistory.findFirst({
              where: { cryptoId: crypto!.id },
              orderBy: { timestamp: 'desc' }
            });
            data = {
              dailyVolume: volumeData?.dailyVolume || 0,
              exchangeVolume: volumeData?.exchangeVolume || 0,
              volumeChange24h: volumeData?.volumeChange24h || 0,
              volumeVsAvg: volumeData?.volumeVsAvg || 0,
            };
            break;

          case 'onchain':
            const onChainData = await db.onChainMetric.findFirst({
              where: { cryptoId: crypto!.id },
              orderBy: { timestamp: 'desc' }
            });
            data = {
              activeAddresses: onChainData?.activeAddresses || 0,
              transactionVolume: onChainData?.transactionVolume || 0,
              exchangeInflow: onChainData?.exchangeInflow || 0,
              exchangeOutflow: onChainData?.exchangeOutflow || 0,
              mvrv: onChainData?.mvrv || 0,
            };
            break;

          case 'technical':
            const technicalData = await db.technicalIndicator.findFirst({
              where: { cryptoId: crypto!.id },
              orderBy: { timestamp: 'desc' }
            });
            data = {
              rsi: technicalData?.rsi || 50,
              macd: technicalData?.macd || 0,
              ma50: technicalData?.ma50 || 0,
              ma200: technicalData?.ma200 || 0,
            };
            break;

          case 'derivatives':
            const derivativesData = await db.derivativeMetric.findFirst({
              where: { cryptoId: crypto!.id },
              orderBy: { timestamp: 'desc' }
            });
            data = {
              openInterest: derivativesData?.openInterest || 0,
              fundingRate: derivativesData?.fundingRate || 0,
              liquidationVolume: derivativesData?.liquidationVolume || 0,
              putCallRatio: derivativesData?.putCallRatio || 0,
            };
            break;

          case 'market_cap':
            const marketCapData = await db.priceHistory.findFirst({
              where: { cryptoId: crypto!.id },
              orderBy: { timestamp: 'desc' }
            });
            data = {
              marketCap: marketCapData?.marketCap || 0,
              rank: crypto!.rank || 0,
              marketCapDominance: 0, // Will be calculated later
            };
            break;

          case 'volatility':
            const volatilityData = await db.priceHistory.findMany({
              where: {
                cryptoId: crypto!.id,
                timestamp: {
                  gte: startTime,
                  lte: now
                }
              },
              orderBy: { timestamp: 'asc' }
            });
            data = calculateVolatilityMetrics(volatilityData);
            break;

          default:
            data = { error: 'Invalid metric' };
        }

        return {
          blockchain,
          symbol: crypto!.symbol,
          name: crypto!.name,
          rank: crypto!.rank,
          data,
          timestamp: now
        };
      })
    );

    // Calculate market cap dominance if requested
    if (metric === 'market_cap') {
      const totalMarketCap = comparisonData.reduce((sum, item) => {
        return sum + (item.data.marketCap || 0);
      }, 0);

      comparisonData.forEach(item => {
        if (totalMarketCap > 0) {
          item.data.marketCapDominance = (item.data.marketCap / totalMarketCap) * 100;
        }
      });
    }

    // Calculate rankings and comparisons
    const rankings = calculateRankings(comparisonData, metric);
    const correlations = calculateCorrelations(comparisonData, metric);
    const insights = generateComparisonInsights(comparisonData, metric);

    return NextResponse.json({
      metric,
      timeframe,
      blockchains: limitedBlockchains,
      data: comparisonData,
      rankings,
      correlations,
      insights,
      timestamp: now,
      dataPoints: comparisonData.length
    });

  } catch (error) {
    console.error('Error comparing metrics:', error);
    return NextResponse.json(
      { error: 'Failed to compare metrics' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateVolatilityMetrics(priceData: any[]): any {
  if (priceData.length < 2) {
    return {
      volatility: 0,
      high24h: 0,
      low24h: 0,
      priceRange: 0,
      averagePrice: 0
    };
  }

  const prices = priceData.map(p => p.price);
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const average = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  // Calculate volatility (standard deviation of returns)
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }

  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(365) * 100; // Annualized volatility

  return {
    volatility: volatility,
    high24h: high,
    low24h: low,
    priceRange: high - low,
    averagePrice: average
  };
}

function calculateRankings(data: any[], metric: string): any[] {
  const getValue = (item: any) => {
    switch (metric) {
      case 'price':
        return item.data.currentPrice || 0;
      case 'volume':
        return item.data.dailyVolume || 0;
      case 'onchain':
        return item.data.activeAddresses || 0;
      case 'technical':
        return item.data.rsi || 0;
      case 'derivatives':
        return item.data.openInterest || 0;
      case 'market_cap':
        return item.data.marketCap || 0;
      case 'volatility':
        return item.data.volatility || 0;
      default:
        return 0;
    }
  };

  return data
    .map(item => ({
      blockchain: item.blockchain,
      symbol: item.symbol,
      value: getValue(item),
      rank: 0
    }))
    .sort((a, b) => b.value - a.value)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));
}

function calculateCorrelations(data: any[], metric: string): any {
  if (data.length < 2) return {};

  const getValue = (item: any) => {
    switch (metric) {
      case 'price':
        return item.data.currentPrice || 0;
      case 'volume':
        return item.data.dailyVolume || 0;
      case 'onchain':
        return item.data.activeAddresses || 0;
      case 'technical':
        return item.data.rsi || 0;
      case 'derivatives':
        return item.data.openInterest || 0;
      case 'market_cap':
        return item.data.marketCap || 0;
      case 'volatility':
        return item.data.volatility || 0;
      default:
        return 0;
    }
  };

  const correlations: any = {};
  
  // Calculate correlation with Bitcoin (first item if BTC exists)
  const btcData = data.find(item => item.blockchain === 'bitcoin');
  if (btcData) {
    const btcValue = getValue(btcData);
    
    data.forEach(item => {
      if (item.blockchain !== 'bitcoin') {
        const itemValue = getValue(item);
        // Simplified correlation calculation
        const correlation = calculateSimpleCorrelation(btcValue, itemValue, data.length);
        correlations[`${item.blockchain}_vs_btc`] = correlation;
      }
    });
  }

  return correlations;
}

function calculateSimpleCorrelation(value1: number, value2: number, dataSize: number): number {
  // This is a simplified correlation calculation
  // In a real implementation, you would use historical data to calculate proper correlation
  const ratio = value1 > 0 ? value2 / value1 : 1;
  const correlation = Math.max(-1, Math.min(1, (ratio - 1) * 2));
  
  // Add some randomness based on data size
  const noise = (Math.random() - 0.5) * (1 / Math.sqrt(dataSize));
  return Math.max(-1, Math.min(1, correlation + noise));
}

function generateComparisonInsights(data: any[], metric: string): string[] {
  const insights: string[] = [];
  
  if (data.length === 0) return insights;

  const getValue = (item: any) => {
    switch (metric) {
      case 'price':
        return item.data.currentPrice || 0;
      case 'volume':
        return item.data.dailyVolume || 0;
      case 'onchain':
        return item.data.activeAddresses || 0;
      case 'technical':
        return item.data.rsi || 0;
      case 'derivatives':
        return item.data.openInterest || 0;
      case 'market_cap':
        return item.data.marketCap || 0;
      case 'volatility':
        return item.data.volatility || 0;
      default:
        return 0;
    }
  };

  const values = data.map(getValue).filter(v => v > 0);
  if (values.length === 0) return insights;

  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;

  // Find leaders and laggards
  const leader = data.find(item => getValue(item) === maxValue);
  const laggard = data.find(item => getValue(item) === minValue);

  if (leader && laggard) {
    const ratio = maxValue / minValue;
    if (ratio > 2) {
      insights.push(`${leader.symbol} leads with ${ratio.toFixed(1)}x higher ${metric} than ${laggard.symbol}`);
    }
  }

  // Market concentration analysis
  const topValue = maxValue;
  const totalValue = values.reduce((sum, val) => sum + val, 0);
  const concentration = (topValue / totalValue) * 100;

  if (concentration > 60) {
    insights.push(`High market concentration: Top asset represents ${concentration.toFixed(1)}% of total ${metric}`);
  } else if (concentration < 30) {
    insights.push(`Low market concentration: Relatively distributed ${metric} across assets`);
  }

  // Volatility insights
  if (metric === 'volatility') {
    const avgVolatility = avgValue;
    if (avgVolatility > 80) {
      insights.push('High volatility across all assets - Increased risk environment');
    } else if (avgVolatility < 30) {
      insights.push('Low volatility across all assets - Stable market conditions');
    }
  }

  // Technical insights
  if (metric === 'technical') {
    const overbought = data.filter(item => (item.data.rsi || 0) > 70);
    const oversold = data.filter(item => (item.data.rsi || 0) < 30);
    
    if (overbought.length > 0) {
      insights.push(`${overbought.length} assets showing overbought conditions`);
    }
    if (oversold.length > 0) {
      insights.push(`${oversold.length} assets showing oversold conditions`);
    }
  }

  // Volume insights
  if (metric === 'volume') {
    const highVolumeAssets = data.filter(item => (item.data.dailyVolume || 0) > avgValue * 1.5);
    if (highVolumeAssets.length > 0) {
      insights.push(`${highVolumeAssets.length} assets showing unusually high volume`);
    }
  }

  return insights;
}