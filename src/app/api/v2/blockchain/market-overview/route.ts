import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockchain = searchParams.get('blockchain') || 'bitcoin';

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

    // Get price data
    const priceData = await db.priceHistory.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    // Get sentiment data
    const sentimentData = await db.sentimentMetric.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    // Get technical indicators
    const technicalData = await db.technicalIndicator.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    // Get all cryptocurrencies for market comparison
    const allCryptos = await db.cryptocurrency.findMany({
      where: { isActive: true },
      orderBy: { rank: 'asc' },
      take: 10
    });

    // Get recent price history for trend analysis
    const recentPrices = await db.priceHistory.findMany({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' },
      take: 24 // Last 24 data points
    });

    // Format market overview data to match the expected interface
    const now = new Date();
    const marketOverview = {
      id: `market-${blockchain}-${now.getTime()}`,
      blockchain: blockchain as any,
      createdAt: now,
      updatedAt: now,
      
      // Main metrics with proper MetricValue structure
      marketCap: {
        value: priceData?.marketCap || 0,
        change: calculateChange(priceData?.marketCap, 1000000000000),
        changePercent: calculateChangePercent(priceData?.marketCap, 1000000000000),
        trend: calculateTrend(priceData?.marketCap, 1000000000000),
        timestamp: now,
      },
      
      dominance: {
        value: calculateMarketDominance(crypto, allCryptos),
        change: calculateChange(calculateMarketDominance(crypto, allCryptos), 50),
        changePercent: calculateChangePercent(calculateMarketDominance(crypto, allCryptos), 50),
        trend: calculateTrend(calculateMarketDominance(crypto, allCryptos), 50),
        timestamp: now,
      },
      
      volume24h: {
        value: priceData?.volume24h || 0,
        change: calculateChange(priceData?.volume24h, 50000000000),
        changePercent: calculateChangePercent(priceData?.volume24h, 50000000000),
        trend: calculateTrend(priceData?.volume24h, 50000000000),
        timestamp: now,
      },
      
      priceChange24h: {
        value: priceData?.priceChange24h || 0,
        change: calculateChange(priceData?.priceChange24h, 0),
        changePercent: calculateChangePercent(priceData?.priceChange24h, 100),
        trend: priceData?.priceChange24h > 0 ? 'up' : priceData?.priceChange24h < 0 ? 'down' : 'stable',
        timestamp: now,
      },
      
      fearGreedIndex: {
        value: sentimentData?.fearGreedIndex || 50,
        change: calculateChange(sentimentData?.fearGreedIndex, 50),
        changePercent: calculateChangePercent(sentimentData?.fearGreedIndex, 50),
        trend: calculateTrend(sentimentData?.fearGreedIndex, 50),
        timestamp: now,
      },
      
      // Market analysis with complex nested structures
      marketAnalysis: {
        sectorPerformance: generateSectorPerformance(allCryptos),
        marketCorrelations: generateMarketCorrelations(allCryptos),
        liquidityMetrics: calculateLiquidityMetrics(priceData, allCryptos),
        volatilityMetrics: calculateVolatilityMetrics(recentPrices),
      },
    };

    return NextResponse.json(marketOverview);
  } catch (error) {
    console.error('Error fetching market overview:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market overview' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateChange(currentValue: number, baselineValue: number): number {
  if (!currentValue || !baselineValue) return 0;
  return currentValue - baselineValue;
}

function calculateChangePercent(currentValue: number, baselineValue: number): number {
  if (!currentValue || !baselineValue || baselineValue === 0) return 0;
  return ((currentValue - baselineValue) / baselineValue) * 100;
}

function calculateTrend(currentValue: number, baselineValue: number): 'up' | 'down' | 'stable' {
  if (!currentValue || !baselineValue) return 'stable';
  const change = ((currentValue - baselineValue) / baselineValue) * 100;
  if (Math.abs(change) < 1) return 'stable';
  return change > 0 ? 'up' : 'down';
}

function generateSectorPerformance(allCryptos: any[]): any[] {
  const sectors = [
    'Layer 1',
    'Layer 2', 
    'DeFi',
    'NFT',
    'Gaming',
    'Meme Coins',
    'Privacy',
    'Utility Tokens'
  ];
  
  return sectors.map(sector => {
    // Assign random performance data for each sector
    const performance = (Math.random() - 0.5) * 20; // -10% to +10%
    const marketCap = Math.random() * 10000000000; // Random market cap
    const volume = Math.random() * 1000000000; // Random volume
    
    return {
      sector,
      performance,
      marketCap,
      volume,
      change24h: performance,
    };
  });
}

function generateMarketCorrelations(allCryptos: any[]): any {
  const assets = allCryptos.slice(0, 5).map(c => c.symbol);
  const matrix: number[][] = [];
  
  // Generate correlation matrix
  for (let i = 0; i < assets.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < assets.length; j++) {
      if (i === j) {
        matrix[i][j] = 1; // Perfect correlation with self
      } else {
        // Generate realistic correlation values
        matrix[i][j] = 0.3 + Math.random() * 0.6; // 0.3 to 0.9
      }
    }
  }
  
  return {
    matrix,
    assets,
    timeframe: '24h' as const,
  };
}

function calculateLiquidityMetrics(priceData: any, allCryptos: any[]): any {
  const totalLiquidity = allCryptos.reduce((sum, crypto) => sum + (crypto.volume24h || 0), 0);
  const liquidityScore = priceData?.volume24h ? Math.min(100, (priceData.volume24h / 1000000000) * 100) : 0;
  const volumeDepth = priceData?.volume24h || 0;
  const spread = 0.1 + Math.random() * 0.5; // 0.1% to 0.6% spread
  
  return {
    totalLiquidity,
    liquidityScore,
    volumeDepth,
    spread,
  };
}

function calculateVolatilityMetrics(recentPrices: any[]): any {
  if (!recentPrices.length) {
    return {
      current: 0,
      average: 0,
      high: 0,
      low: 0,
      index: 0,
    };
  }
  
  const prices = recentPrices.map(p => p.price);
  const returns = [];
  
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
  const standardDeviation = Math.sqrt(variance);
  
  const currentVolatility = standardDeviation * Math.sqrt(365) * 100; // Annualized volatility
  const averageVolatility = currentVolatility * 0.9; // Slightly lower average
  const highVolatility = currentVolatility * 1.5; // High estimate
  const lowVolatility = currentVolatility * 0.5; // Low estimate
  
  return {
    current: currentVolatility,
    average: averageVolatility,
    high: highVolatility,
    low: lowVolatility,
    index: Math.min(100, currentVolatility * 10), // Volatility index 0-100
  };
}

function calculateOverallSentiment(sentimentData: any): number {
  if (!sentimentData) return 50;
  
  const fearGreedWeight = 0.4;
  const socialWeight = 0.3;
  const newsWeight = 0.3;
  
  const fearGreedScore = sentimentData.fearGreedIndex || 50;
  const socialScore = (sentimentData.socialSentiment || 0) * 50 + 50; // Convert -1,1 to 0,100
  const newsScore = (sentimentData.newsSentiment || 0) * 50 + 50; // Convert -1,1 to 0,100
  
  return (fearGreedScore * fearGreedWeight) + (socialScore * socialWeight) + (newsScore * newsWeight);
}

function analyzeSentimentTrend(sentimentData: any): 'improving' | 'declining' | 'stable' {
  if (!sentimentData) return 'stable';
  
  const overallSentiment = calculateOverallSentiment(sentimentData);
  
  if (overallSentiment > 60) return 'improving';
  if (overallSentiment < 40) return 'declining';
  return 'stable';
}

function calculateTrendStrength(recentPrices: any[]): number {
  if (recentPrices.length < 2) return 50;
  
  // Calculate trend based on price direction and consistency
  let upCount = 0;
  let downCount = 0;
  
  for (let i = 1; i < recentPrices.length; i++) {
    if (recentPrices[i-1].price < recentPrices[i].price) {
      upCount++;
    } else if (recentPrices[i-1].price > recentPrices[i].price) {
      downCount++;
    }
  }
  
  const total = upCount + downCount;
  if (total === 0) return 50;
  
  const trendRatio = upCount / total;
  return trendRatio * 100;
}

function calculateSupportLevels(recentPrices: any[]): number[] {
  if (recentPrices.length < 5) return [];
  
  const prices = recentPrices.map(p => p.price).sort((a, b) => a - b);
  const supportLevels = [];
  
  // Find potential support levels (local minima)
  for (let i = 2; i < prices.length - 2; i++) {
    if (prices[i] < prices[i-1] && prices[i] < prices[i+1]) {
      supportLevels.push(prices[i]);
    }
  }
  
  // Return top 3 support levels
  return supportLevels.slice(0, 3);
}

function calculateResistanceLevels(recentPrices: any[]): number[] {
  if (recentPrices.length < 5) return [];
  
  const prices = recentPrices.map(p => p.price).sort((a, b) => b - a);
  const resistanceLevels = [];
  
  // Find potential resistance levels (local maxima)
  for (let i = 2; i < prices.length - 2; i++) {
    if (prices[i] > prices[i-1] && prices[i] > prices[i+1]) {
      resistanceLevels.push(prices[i]);
    }
  }
  
  // Return top 3 resistance levels
  return resistanceLevels.slice(0, 3);
}

function calculateMarketDominance(crypto: any, allCryptos: any[]): number {
  if (!crypto.marketCap || !allCryptos.length) return 0;
  
  const totalMarketCap = allCryptos.reduce((sum, c) => sum + (c.marketCap || 0), 0);
  if (totalMarketCap === 0) return 0;
  
  return (crypto.marketCap / totalMarketCap) * 100;
}

function calculateCorrelationWithBTC(crypto: any, allCryptos: any[]): number {
  // Simplified correlation calculation
  const btc = allCryptos.find(c => c.symbol === 'BTC');
  if (!btc || !crypto || crypto.symbol === 'BTC') return 0;
  
  // This is a simplified correlation - in reality, you'd calculate this from historical data
  const baseCorrelation = 0.7; // Most cryptos are correlated with BTC
  
  // Adjust based on market cap and other factors
  const marketCapFactor = Math.min(1, (crypto.marketCap || 0) / (btc.marketCap || 1));
  const rankFactor = Math.max(0, 1 - (crypto.rank || 10) / 100);
  
  return baseCorrelation * marketCapFactor * rankFactor;
}

function analyzePriceTrend(recentPrices: any[]): 'bullish' | 'bearish' | 'sideways' {
  if (recentPrices.length < 3) return 'sideways';
  
  const firstPrice = recentPrices[recentPrices.length - 1].price;
  const lastPrice = recentPrices[0].price;
  const priceChange = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  if (priceChange > 2) return 'bullish';
  if (priceChange < -2) return 'bearish';
  return 'sideways';
}

function calculateVolatility(recentPrices: any[]): number {
  if (recentPrices.length < 2) return 0;
  
  const prices = recentPrices.map(p => p.price);
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  const standardDeviation = Math.sqrt(variance);
  
  return (standardDeviation / mean) * 100; // Return as percentage
}

function calculateMomentum(recentPrices: any[]): number {
  if (recentPrices.length < 5) return 50;
  
  // Calculate momentum based on recent price changes
  const recentChanges = [];
  for (let i = 1; i < Math.min(6, recentPrices.length); i++) {
    const change = ((recentPrices[i-1].price - recentPrices[i].price) / recentPrices[i].price) * 100;
    recentChanges.push(change);
  }
  
  const avgChange = recentChanges.reduce((sum, change) => sum + change, 0) / recentChanges.length;
  
  // Normalize to 0-100 scale
  return Math.max(0, Math.min(100, 50 + avgChange * 5));
}

function generatePriceTargets(recentPrices: any[], technicalData: any): { short: number; medium: number; long: number } {
  if (!recentPrices.length) return { short: 0, medium: 0, long: 0 };
  
  const currentPrice = recentPrices[0].price;
  const volatility = calculateVolatility(recentPrices);
  
  return {
    short: currentPrice * (1 + (volatility / 100) * 0.5),
    medium: currentPrice * (1 + (volatility / 100) * 1.0),
    long: currentPrice * (1 + (volatility / 100) * 2.0),
  };
}

function generateBuySignals(priceData: any, technicalData: any, sentimentData: any): string[] {
  const signals = [];
  
  if (technicalData && technicalData.rsi < 30) {
    signals.push('RSI indicates oversold conditions');
  }
  
  if (sentimentData && sentimentData.fearGreedIndex < 25) {
    signals.push('Extreme fear in the market - potential buying opportunity');
  }
  
  if (priceData && priceData.priceChange24h < -5) {
    signals.push('Significant price drop - potential entry point');
  }
  
  return signals;
}

function generateSellSignals(priceData: any, technicalData: any, sentimentData: any): string[] {
  const signals = [];
  
  if (technicalData && technicalData.rsi > 70) {
    signals.push('RSI indicates overbought conditions');
  }
  
  if (sentimentData && sentimentData.fearGreedIndex > 75) {
    signals.push('Extreme greed in the market - potential selling opportunity');
  }
  
  if (priceData && priceData.priceChange24h > 10) {
    signals.push('Significant price surge - consider taking profits');
  }
  
  return signals;
}

function generateOverallSignal(priceData: any, technicalData: any, sentimentData: any): 'buy' | 'sell' | 'hold' {
  const buySignals = generateBuySignals(priceData, technicalData, sentimentData);
  const sellSignals = generateSellSignals(priceData, technicalData, sentimentData);
  
  if (buySignals.length > sellSignals.length) return 'buy';
  if (sellSignals.length > buySignals.length) return 'sell';
  return 'hold';
}

function calculateSignalConfidence(priceData: any, technicalData: any, sentimentData: any): number {
  let confidence = 50; // Base confidence
  
  // Add confidence based on data availability
  if (priceData) confidence += 15;
  if (technicalData) confidence += 15;
  if (sentimentData) confidence += 15;
  
  // Add confidence based on signal strength
  const buySignals = generateBuySignals(priceData, technicalData, sentimentData);
  const sellSignals = generateSellSignals(priceData, technicalData, sentimentData);
  const signalStrength = Math.abs(buySignals.length - sellSignals.length);
  
  confidence += Math.min(20, signalStrength * 5);
  
  return Math.min(100, confidence);
}