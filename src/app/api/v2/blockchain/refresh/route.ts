import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { blockchain, timeframe = '24h' } = body;

    if (!blockchain) {
      return NextResponse.json(
        { error: 'Blockchain is required' },
        { status: 400 }
      );
    }

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

    // Simulate data refresh process
    const refreshStart = new Date();
    
    // In a real implementation, this would trigger actual data collection
    // For now, we'll simulate the refresh process
    
    // Simulate API calls to external services
    const refreshTasks = [
      refreshPriceData(crypto.id),
      refreshOnChainData(crypto.id),
      refreshTechnicalData(crypto.id),
      refreshSentimentData(),
      refreshDerivativesData(crypto.id)
    ];

    const results = await Promise.allSettled(refreshTasks);
    
    const refreshEnd = new Date();
    const refreshDuration = refreshEnd.getTime() - refreshStart.getTime();

    // Check which tasks succeeded
    const successfulTasks = results.filter(result => result.status === 'fulfilled').length;
    const totalTasks = results.length;

    // Generate refresh summary
    const refreshSummary = {
      blockchain,
      timeframe,
      refreshStart,
      refreshEnd,
      refreshDuration,
      status: successfulTasks === totalTasks ? 'success' : 'partial',
      tasksCompleted: successfulTasks,
      totalTasks,
      message: successfulTasks === totalTasks 
        ? 'All data refreshed successfully' 
        : `${successfulTasks}/${totalTasks} data sources refreshed`,
      
      details: {
        priceData: results[0].status === 'fulfilled',
        onChainData: results[1].status === 'fulfilled',
        technicalData: results[2].status === 'fulfilled',
        sentimentData: results[3].status === 'fulfilled',
        derivativesData: results[4].status === 'fulfilled'
      },
      
      nextRefresh: new Date(refreshEnd.getTime() + 5 * 60 * 1000), // Next refresh in 5 minutes
      dataFreshness: {
        priceData: await getDataFreshness('price', crypto.id),
        onChainData: await getDataFreshness('onchain', crypto.id),
        technicalData: await getDataFreshness('technical', crypto.id),
        sentimentData: await getDataFreshness('sentiment', crypto.id),
        derivativesData: await getDataFreshness('derivatives', crypto.id)
      }
    };

    return NextResponse.json(refreshSummary);

  } catch (error) {
    console.error('Error refreshing data:', error);
    return NextResponse.json(
      { error: 'Failed to refresh data' },
      { status: 500 }
    );
  }
}

// Helper functions for simulating data refresh
async function refreshPriceData(cryptoId: number): Promise<void> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
  
  // In a real implementation, this would fetch fresh data from CoinGecko or other price APIs
  // For now, we'll just update the timestamp to simulate refresh
  
  const latestPrice = await db.priceHistory.findFirst({
    where: { cryptoId },
    orderBy: { timestamp: 'desc' }
  });

  if (latestPrice) {
    // Simulate small price changes
    const priceChange = (Math.random() - 0.5) * 0.02; // ±1% change
    const newPrice = latestPrice.price * (1 + priceChange);
    
    await db.priceHistory.create({
      data: {
        cryptoId,
        price: newPrice,
        volume24h: latestPrice.volume24h * (0.95 + Math.random() * 0.1),
        marketCap: newPrice * (latestPrice.marketCap / latestPrice.price),
        priceChange24h: priceChange * 100,
        timestamp: new Date()
      }
    });
  }
}

async function refreshOnChainData(cryptoId: number): Promise<void> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
  
  // Simulate on-chain data refresh
  const latestOnChain = await db.onChainMetric.findFirst({
    where: { cryptoId },
    orderBy: { timestamp: 'desc' }
  });

  if (latestOnChain) {
    // Simulate small changes in on-chain metrics
    await db.onChainMetric.create({
      data: {
        cryptoId,
        mvrv: latestOnChain.mvrv * (0.98 + Math.random() * 0.04),
        nupl: latestOnChain.nupl * (0.95 + Math.random() * 0.1),
        sopr: latestOnChain.sopr * (0.99 + Math.random() * 0.02),
        activeAddresses: Math.floor(latestOnChain.activeAddresses * (0.9 + Math.random() * 0.2)),
        exchangeInflow: latestOnChain.exchangeInflow * (0.9 + Math.random() * 0.2),
        exchangeOutflow: latestOnChain.exchangeOutflow * (0.9 + Math.random() * 0.2),
        transactionVolume: latestOnChain.transactionVolume * (0.9 + Math.random() * 0.2),
        supplyDistribution: latestOnChain.supplyDistribution,
        whaleHoldingsPercentage: latestOnChain.whaleHoldingsPercentage * (0.98 + Math.random() * 0.04),
        retailHoldingsPercentage: latestOnChain.retailHoldingsPercentage * (0.98 + Math.random() * 0.04),
        exchangeHoldingsPercentage: latestOnChain.exchangeHoldingsPercentage * (0.98 + Math.random() * 0.04),
        timestamp: new Date()
      }
    });
  }
}

async function refreshTechnicalData(cryptoId: number): Promise<void> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700));
  
  // Get latest price data for technical calculations
  const recentPrices = await db.priceHistory.findMany({
    where: { cryptoId },
    orderBy: { timestamp: 'desc' },
    take: 50
  });

  if (recentPrices.length >= 14) { // Need enough data for technical indicators
    const prices = recentPrices.map(p => p.price);
    
    // Calculate RSI
    const rsi = calculateRSI(prices);
    
    // Calculate Moving Averages
    const ma50 = calculateMA(prices, 50);
    const ma200 = calculateMA(prices, Math.min(200, prices.length));
    
    // Calculate MACD
    const macd = calculateMACD(prices);
    
    // Calculate Bollinger Bands
    const bollinger = calculateBollingerBands(prices);
    
    await db.technicalIndicator.create({
      data: {
        cryptoId,
        rsi,
        ma50,
        ma200,
        macd: macd.macd,
        macdSignal: macd.signal,
        bollingerUpper: bollinger.upper,
        bollingerLower: bollinger.lower,
        bollingerMiddle: bollinger.middle,
        timestamp: new Date()
      }
    });
  }
}

async function refreshSentimentData(): Promise<void> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 900));
  
  // Simulate sentiment data refresh (global sentiment, not crypto-specific)
  const latestSentiment = await db.sentimentMetric.findFirst({
    orderBy: { timestamp: 'desc' }
  });

  if (latestSentiment) {
    // Simulate changes in sentiment metrics
    const fearGreedChange = (Math.random() - 0.5) * 10; // ±5 change
    const newFearGreed = Math.max(0, Math.min(100, latestSentiment.fearGreedIndex + fearGreedChange));
    
    await db.sentimentMetric.create({
      data: {
        fearGreedIndex: newFearGreed,
        fearGreedClassification: getFearGreedClassification(newFearGreed),
        socialSentiment: Math.max(-1, Math.min(1, latestSentiment.socialSentiment + (Math.random() - 0.5) * 0.2)),
        redditSentiment: Math.max(-1, Math.min(1, latestSentiment.redditSentiment + (Math.random() - 0.5) * 0.2)),
        socialVolume: Math.floor(latestSentiment.socialVolume * (0.8 + Math.random() * 0.4)),
        engagementRate: Math.max(0, Math.min(1, latestSentiment.engagementRate + (Math.random() - 0.5) * 0.1)),
        influencerSentiment: Math.max(-1, Math.min(1, latestSentiment.influencerSentiment + (Math.random() - 0.5) * 0.2)),
        trendingScore: Math.max(0, Math.min(100, latestSentiment.trendingScore + (Math.random() - 0.5) * 10)),
        newsSentiment: Math.max(-1, Math.min(1, latestSentiment.newsSentiment + (Math.random() - 0.5) * 0.2)),
        newsVolume: Math.floor(latestSentiment.newsVolume * (0.8 + Math.random() * 0.4)),
        positiveNewsCount: Math.floor(latestSentiment.positiveNewsCount * (0.8 + Math.random() * 0.4)),
        negativeNewsCount: Math.floor(latestSentiment.negativeNewsCount * (0.8 + Math.random() * 0.4)),
        neutralNewsCount: Math.floor(latestSentiment.neutralNewsCount * (0.8 + Math.random() * 0.4)),
        sentimentScore: Math.max(-1, Math.min(1, latestSentiment.sentimentScore + (Math.random() - 0.5) * 0.2)),
        buzzScore: Math.max(0, Math.min(100, latestSentiment.buzzScore + (Math.random() - 0.5) * 10)),
        trendsScore: Math.max(0, Math.min(100, latestSentiment.trendsScore + (Math.random() - 0.5) * 10)),
        searchVolume: Math.floor(latestSentiment.searchVolume * (0.8 + Math.random() * 0.4)),
        trendingKeywords: latestSentiment.trendingKeywords,
        trendDirection: Math.random() > 0.5 ? 'up' : 'down',
        timestamp: new Date()
      }
    });
  }
}

async function refreshDerivativesData(cryptoId: number): Promise<void> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 400 + Math.random() * 800));
  
  // Simulate derivatives data refresh
  const latestDerivatives = await db.derivativeMetric.findFirst({
    where: { cryptoId },
    orderBy: { timestamp: 'desc' }
  });

  if (latestDerivatives) {
    // Simulate changes in derivatives metrics
    await db.derivativeMetric.create({
      data: {
        cryptoId,
        openInterest: latestDerivatives.openInterest * (0.95 + Math.random() * 0.1),
        fundingRate: Math.max(-0.05, Math.min(0.05, latestDerivatives.fundingRate + (Math.random() - 0.5) * 0.01)),
        liquidationVolume: latestDerivatives.liquidationVolume * (0.8 + Math.random() * 0.4),
        putCallRatio: Math.max(0.1, Math.min(5, latestDerivatives.putCallRatio * (0.9 + Math.random() * 0.2))),
        timestamp: new Date()
      }
    });
  }
}

// Technical analysis helper functions
function calculateRSI(prices: number[]): number {
  if (prices.length < 14) return 50;
  
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i-1];
    if (change > 0) {
      gains.push(change);
      losses.push(0);
    } else {
      gains.push(0);
      losses.push(Math.abs(change));
    }
  }
  
  const avgGain = gains.slice(-14).reduce((sum, gain) => sum + gain, 0) / 14;
  const avgLoss = losses.slice(-14).reduce((sum, loss) => sum + loss, 0) / 14;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  
  return Math.max(0, Math.min(100, rsi));
}

function calculateMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const relevantPrices = prices.slice(-period);
  return relevantPrices.reduce((sum, price) => sum + price, 0) / period;
}

function calculateMACD(prices: number[]): { macd: number; signal: number } {
  if (prices.length < 26) return { macd: 0, signal: 0 };
  
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;
  
  // For signal line, we'd need MACD history, so we'll simulate it
  const signal = macd * 0.9; // Simplified signal calculation
  
  return { macd, signal };
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const multiplier = 2 / (period + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
}

function calculateBollingerBands(prices: number[]): { upper: number; middle: number; lower: number } {
  if (prices.length < 20) {
    const price = prices[prices.length - 1] || 0;
    return { upper: price * 1.02, middle: price, lower: price * 0.98 };
  }
  
  const period = 20;
  const relevantPrices = prices.slice(-period);
  const middle = relevantPrices.reduce((sum, price) => sum + price, 0) / period;
  
  // Calculate standard deviation
  const variance = relevantPrices.reduce((sum, price) => sum + Math.pow(price - middle, 2), 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const upper = middle + (stdDev * 2);
  const lower = middle - (stdDev * 2);
  
  return { upper, middle, lower };
}

function getFearGreedClassification(score: number): string {
  if (score < 25) return 'Extreme Fear';
  if (score < 45) return 'Fear';
  if (score < 55) return 'Neutral';
  if (score < 75) return 'Greed';
  return 'Extreme Greed';
}

async function getDataFreshness(dataType: string, cryptoId: number): Promise<{
  isFresh: boolean;
  lastUpdate: Date | null;
  age: number; // in minutes
}> {
  let lastUpdate: Date | null = null;
  
  switch (dataType) {
    case 'price':
      const priceData = await db.priceHistory.findFirst({
        where: { cryptoId },
        orderBy: { timestamp: 'desc' }
      });
      lastUpdate = priceData?.timestamp || null;
      break;
      
    case 'onchain':
      const onChainData = await db.onChainMetric.findFirst({
        where: { cryptoId },
        orderBy: { timestamp: 'desc' }
      });
      lastUpdate = onChainData?.timestamp || null;
      break;
      
    case 'technical':
      const technicalData = await db.technicalIndicator.findFirst({
        where: { cryptoId },
        orderBy: { timestamp: 'desc' }
      });
      lastUpdate = technicalData?.timestamp || null;
      break;
      
    case 'sentiment':
      const sentimentData = await db.sentimentMetric.findFirst({
        orderBy: { timestamp: 'desc' }
      });
      lastUpdate = sentimentData?.timestamp || null;
      break;
      
    case 'derivatives':
      const derivativesData = await db.derivativeMetric.findFirst({
        where: { cryptoId },
        orderBy: { timestamp: 'desc' }
      });
      lastUpdate = derivativesData?.timestamp || null;
      break;
  }
  
  if (!lastUpdate) {
    return {
      isFresh: false,
      lastUpdate: null,
      age: Infinity
    };
  }
  
  const now = new Date();
  const age = (now.getTime() - lastUpdate.getTime()) / (1000 * 60); // age in minutes
  
  // Consider data fresh if less than 10 minutes old
  const isFresh = age < 10;
  
  return {
    isFresh,
    lastUpdate,
    age
  };
}