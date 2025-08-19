import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockchain = searchParams.get('blockchain') || 'bitcoin';
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

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default: // 24h
        startDate.setDate(now.getDate() - 1);
        break;
    }

    // Get historical data for the specified timeframe
    const historicalData = await db.onChainMetric.findMany({
      where: { 
        cryptoId: crypto.id,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    const priceHistory = await db.priceHistory.findMany({
      where: { 
        cryptoId: crypto.id,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    // Get the most recent data points
    const onChainData = historicalData[0];
    const priceData = priceHistory[0];

    // Calculate timeframe-specific changes and trends
    const changes = calculateTimeframeChanges(historicalData, priceHistory, timeframe);

    // Calculate rolling averages for the timeframe
    const rollingAverages = calculateTimeframeRollingAverages(historicalData, priceHistory, timeframe);

    // Format usage metrics data to match the expected interface
    const usageMetrics = {
      id: `usage-${blockchain}-${timeframe}-${now.getTime()}`,
      blockchain: blockchain as any,
      timeframe: timeframe as any,
      createdAt: now,
      updatedAt: now,
      
      // Main metrics with calculated changes and trends
      dailyActiveAddresses: onChainData?.activeAddresses ? {
        value: onChainData.activeAddresses,
        change: changes.dailyActiveAddresses?.change || 0,
        changePercent: changes.dailyActiveAddresses?.changePercent || 0,
        trend: changes.dailyActiveAddresses?.trend || 'stable',
        timestamp: now,
      } : {
        value: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable' as const,
        timestamp: now,
      },
      
      newAddresses: onChainData?.newAddresses ? {
        value: onChainData.newAddresses,
        change: changes.newAddresses?.change || 0,
        changePercent: changes.newAddresses?.changePercent || 0,
        trend: changes.newAddresses?.trend || 'stable',
        timestamp: now,
      } : {
        value: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable' as const,
        timestamp: now,
      },
      
      dailyTransactions: onChainData?.transactionVolume ? {
        value: onChainData.transactionVolume,
        change: changes.dailyTransactions?.change || 0,
        changePercent: changes.dailyTransactions?.changePercent || 0,
        trend: changes.dailyTransactions?.trend || 'stable',
        timestamp: now,
      } : {
        value: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable' as const,
        timestamp: now,
      },
      
      transactionVolume: priceData?.volume24h ? {
        value: priceData.volume24h,
        change: changes.transactionVolume?.change || 0,
        changePercent: changes.transactionVolume?.changePercent || 0,
        trend: changes.transactionVolume?.trend || 'stable',
        timestamp: now,
      } : {
        value: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable' as const,
        timestamp: now,
      },
      
      averageFee: onChainData ? {
        value: calculateAverageFee(onChainData),
        change: changes.averageFee?.change || 0,
        changePercent: changes.averageFee?.changePercent || 0,
        trend: changes.averageFee?.trend || 'stable',
        timestamp: now,
      } : {
        value: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable' as const,
        timestamp: now,
      },
      
      hashRate: onChainData ? {
        value: calculateHashRate(blockchain, onChainData),
        change: changes.hashRate?.change || 0,
        changePercent: changes.hashRate?.changePercent || 0,
        trend: changes.hashRate?.trend || 'stable',
        timestamp: now,
      } : {
        value: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable' as const,
        timestamp: now,
      },
      
      // Rolling averages calculated from historical data
      rollingAverages: rollingAverages,
      
      // Spike detection with timeframe-specific baselines
      spikeDetection: {
        dailyActiveAddresses: detectSpike(
          onChainData?.activeAddresses || 0, 
          rollingAverages.dailyActiveAddresses[timeframe] || rollingAverages.dailyActiveAddresses['30d'], 
          'daily active addresses'
        ),
        newAddresses: detectSpike(
          onChainData?.newAddresses || 0, 
          rollingAverages.newAddresses[timeframe] || rollingAverages.newAddresses['30d'], 
          'new addresses'
        ),
        dailyTransactions: detectSpike(
          onChainData?.transactionVolume || 0, 
          rollingAverages.dailyTransactions[timeframe] || rollingAverages.dailyTransactions['30d'], 
          'daily transactions'
        ),
        transactionVolume: detectSpike(
          priceData?.volume24h || 0, 
          rollingAverages.transactionVolume[timeframe] || rollingAverages.transactionVolume['30d'], 
          'transaction volume'
        ),
        averageFee: detectSpike(
          onChainData ? calculateAverageFee(onChainData) : 0, 
          rollingAverages.averageFee[timeframe] || rollingAverages.averageFee['30d'], 
          'average fee'
        ),
        hashRate: detectSpike(
          onChainData ? calculateHashRate(blockchain, onChainData) : 0, 
          rollingAverages.hashRate[timeframe] || rollingAverages.hashRate['30d'], 
          'hash rate'
        ),
      },
    };

    return NextResponse.json(usageMetrics);
  } catch (error) {
    console.error('Error fetching usage metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage metrics' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateRollingAverages(historicalData: any[], priceHistory: any[], blockchain: string) {
  const defaults = {
    dailyActiveAddresses: { '7d': 0, '30d': 0, '90d': 0 },
    newAddresses: { '7d': 0, '30d': 0, '90d': 0 },
    dailyTransactions: { '7d': 0, '30d': 0, '90d': 0 },
    transactionVolume: { '7d': 0, '30d': 0, '90d': 0 },
    averageFee: { '7d': 0, '30d': 0, '90d': 0 },
    hashRate: { '7d': 0, '30d': 0, '90d': 0 },
  };

  if (!historicalData.length && !priceHistory.length) {
    return defaults;
  }

  // Calculate rolling averages for on-chain metrics
  const onChainAverages = {
    dailyActiveAddresses: calculateMetricRollingAverage(historicalData, 'activeAddresses'),
    newAddresses: calculateMetricRollingAverage(historicalData, 'newAddresses'),
    dailyTransactions: calculateMetricRollingAverage(historicalData, 'transactionVolume'),
  };

  // Calculate rolling averages for price volume
  const volumeAverages = calculateMetricRollingAverage(priceHistory, 'volume24h');

  // Calculate derived metrics
  const feeAverages = calculateFeeRollingAverage(historicalData);
  const hashRateAverages = calculateHashRateRollingAverage(historicalData, blockchain);

  return {
    dailyActiveAddresses: onChainAverages,
    newAddresses: onChainAverages,
    dailyTransactions: onChainAverages,
    transactionVolume: volumeAverages,
    averageFee: feeAverages,
    hashRate: hashRateAverages,
  };
}

function calculateChanges(historicalData: any[], priceHistory: any[], blockchain: string) {
  const defaults = {
    dailyActiveAddresses: { change: 0, changePercent: 0, trend: 'stable' as const },
    newAddresses: { change: 0, changePercent: 0, trend: 'stable' as const },
    dailyTransactions: { change: 0, changePercent: 0, trend: 'stable' as const },
    transactionVolume: { change: 0, changePercent: 0, trend: 'stable' as const },
    averageFee: { change: 0, changePercent: 0, trend: 'stable' as const },
    hashRate: { change: 0, changePercent: 0, trend: 'stable' as const },
  };

  if (!historicalData.length && !priceHistory.length) {
    return defaults;
  }

  const currentOnChain = historicalData[0];
  const previousOnChain = historicalData[1];
  const currentPrice = priceHistory[0];
  const previousPrice = priceHistory[1];

  return {
    dailyActiveAddresses: calculateMetricChange(
      currentOnChain?.activeAddresses,
      previousOnChain?.activeAddresses,
      'daily active addresses'
    ),
    newAddresses: calculateMetricChange(
      currentOnChain?.newAddresses,
      previousOnChain?.newAddresses,
      'new addresses'
    ),
    dailyTransactions: calculateMetricChange(
      currentOnChain?.transactionVolume,
      previousOnChain?.transactionVolume,
      'daily transactions'
    ),
    transactionVolume: calculateMetricChange(
      currentPrice?.volume24h,
      previousPrice?.volume24h,
      'transaction volume'
    ),
    averageFee: calculateMetricChange(
      currentOnChain ? calculateAverageFee(currentOnChain) : 0,
      previousOnChain ? calculateAverageFee(previousOnChain) : 0,
      'average fee'
    ),
    hashRate: calculateMetricChange(
      currentOnChain ? calculateHashRate(blockchain, currentOnChain) : 0,
      previousOnChain ? calculateHashRate(blockchain, previousOnChain) : 0,
      'hash rate'
    ),
  };
}

function calculateTimeframeChanges(historicalData: any[], priceHistory: any[], timeframe: string) {
  const defaults = {
    dailyActiveAddresses: { change: 0, changePercent: 0, trend: 'stable' as const },
    newAddresses: { change: 0, changePercent: 0, trend: 'stable' as const },
    dailyTransactions: { change: 0, changePercent: 0, trend: 'stable' as const },
    transactionVolume: { change: 0, changePercent: 0, trend: 'stable' as const },
    averageFee: { change: 0, changePercent: 0, trend: 'stable' as const },
    hashRate: { change: 0, changePercent: 0, trend: 'stable' as const },
  };

  if (!historicalData.length && !priceHistory.length) {
    return defaults;
  }

  const currentOnChain = historicalData[0];
  const currentPrice = priceHistory[0];
  
  // Calculate baseline based on timeframe
  let baselineOnChain, baselinePrice;
  
  if (timeframe === '7d' && historicalData.length > 7) {
    baselineOnChain = historicalData[7];
    baselinePrice = priceHistory[7];
  } else if (timeframe === '30d' && historicalData.length > 30) {
    baselineOnChain = historicalData[30];
    baselinePrice = priceHistory[30];
  } else if (timeframe === '90d' && historicalData.length > 90) {
    baselineOnChain = historicalData[90];
    baselinePrice = priceHistory[90];
  } else {
    // Fallback to previous data point
    baselineOnChain = historicalData[1] || currentOnChain;
    baselinePrice = priceHistory[1] || currentPrice;
  }

  return {
    dailyActiveAddresses: calculateMetricChange(
      currentOnChain?.activeAddresses,
      baselineOnChain?.activeAddresses,
      'daily active addresses'
    ),
    newAddresses: calculateMetricChange(
      currentOnChain?.newAddresses,
      baselineOnChain?.newAddresses,
      'new addresses'
    ),
    dailyTransactions: calculateMetricChange(
      currentOnChain?.transactionVolume,
      baselineOnChain?.transactionVolume,
      'daily transactions'
    ),
    transactionVolume: calculateMetricChange(
      currentPrice?.volume24h,
      baselinePrice?.volume24h,
      'transaction volume'
    ),
    averageFee: calculateMetricChange(
      currentOnChain ? calculateAverageFee(currentOnChain) : 0,
      baselineOnChain ? calculateAverageFee(baselineOnChain) : 0,
      'average fee'
    ),
    hashRate: calculateMetricChange(
      currentOnChain ? calculateHashRate('bitcoin', currentOnChain) : 0,
      baselineOnChain ? calculateHashRate('bitcoin', baselineOnChain) : 0,
      'hash rate'
    ),
  };
}

function calculateTimeframeRollingAverages(historicalData: any[], priceHistory: any[], timeframe: string) {
  const defaults = {
    dailyActiveAddresses: { '24h': 0, '7d': 0, '30d': 0, '90d': 0 },
    newAddresses: { '24h': 0, '7d': 0, '30d': 0, '90d': 0 },
    dailyTransactions: { '24h': 0, '7d': 0, '30d': 0, '90d': 0 },
    transactionVolume: { '24h': 0, '7d': 0, '30d': 0, '90d': 0 },
    averageFee: { '24h': 0, '7d': 0, '30d': 0, '90d': 0 },
    hashRate: { '24h': 0, '7d': 0, '30d': 0, '90d': 0 },
  };

  if (!historicalData.length && !priceHistory.length) {
    return defaults;
  }

  // Calculate rolling averages for on-chain metrics
  const onChainAverages = {
    dailyActiveAddresses: calculateMetricRollingAverage(historicalData, 'activeAddresses'),
    newAddresses: calculateMetricRollingAverage(historicalData, 'newAddresses'),
    dailyTransactions: calculateMetricRollingAverage(historicalData, 'transactionVolume'),
  };

  // Calculate rolling averages for price volume
  const volumeAverages = calculateMetricRollingAverage(priceHistory, 'volume24h');

  // Calculate derived metrics
  const feeAverages = calculateFeeRollingAverage(historicalData);
  const hashRateAverages = calculateHashRateRollingAverage(historicalData, 'bitcoin');

  return {
    dailyActiveAddresses: onChainAverages,
    newAddresses: onChainAverages,
    dailyTransactions: onChainAverages,
    transactionVolume: volumeAverages,
    averageFee: feeAverages,
    hashRate: hashRateAverages,
  };
}

function calculateMetricRollingAverage(data: any[], field: string) {
  const result = { '24h': 0, '7d': 0, '30d': 0, '90d': 0 };
  
  if (!data.length) return result;

  const periods = [
    { key: '24h', days: 1 },
    { key: '7d', days: 7 },
    { key: '30d', days: 30 },
    { key: '90d', days: 90 },
  ];

  periods.forEach(({ key, days }) => {
    const periodData = data.slice(0, days);
    const validValues = periodData
      .map(item => item[field])
      .filter(value => value !== null && value !== undefined && !isNaN(value));
    
    if (validValues.length > 0) {
      result[key as keyof typeof result] = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
    }
  });

  return result;
}

function calculateFeeRollingAverage(historicalData: any[]) {
  const result = { '24h': 0, '7d': 0, '30d': 0, '90d': 0 };
  
  if (!historicalData.length) return result;

  const periods = [
    { key: '24h', days: 1 },
    { key: '7d', days: 7 },
    { key: '30d', days: 30 },
    { key: '90d', days: 90 },
  ];

  periods.forEach(({ key, days }) => {
    const periodData = historicalData.slice(0, days);
    const validFees = periodData
      .map(item => calculateAverageFee(item))
      .filter(fee => fee !== null && fee !== undefined && !isNaN(fee));
    
    if (validFees.length > 0) {
      result[key as keyof typeof result] = validFees.reduce((sum, fee) => sum + fee, 0) / validFees.length;
    }
  });

  return result;
}

function calculateHashRateRollingAverage(historicalData: any[], blockchain: string) {
  const result = { '24h': 0, '7d': 0, '30d': 0, '90d': 0 };
  
  if (!historicalData.length) return result;

  const periods = [
    { key: '24h', days: 1 },
    { key: '7d', days: 7 },
    { key: '30d', days: 30 },
    { key: '90d', days: 90 },
  ];

  periods.forEach(({ key, days }) => {
    const periodData = historicalData.slice(0, days);
    const validHashRates = periodData
      .map(item => calculateHashRate(blockchain, item))
      .filter(rate => rate !== null && rate !== undefined && !isNaN(rate));
    
    if (validHashRates.length > 0) {
      result[key as keyof typeof result] = validHashRates.reduce((sum, rate) => sum + rate, 0) / validHashRates.length;
    }
  });

  return result;
}

function calculateMetricChange(currentValue: number | undefined, previousValue: number | undefined, metricName: string) {
  if (currentValue === undefined || previousValue === undefined || previousValue === 0) {
    return { change: 0, changePercent: 0, trend: 'stable' as const };
  }

  const change = currentValue - previousValue;
  const changePercent = ((currentValue - previousValue) / previousValue) * 100;
  const trend = Math.abs(changePercent) < 1 ? 'stable' : changePercent > 0 ? 'up' : 'down';

  return { change, changePercent, trend };
}
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

function calculateAverageFee(onChainData: any): number {
  if (!onChainData || !onChainData.transactionVolume) return 0;
  // Simple fee calculation based on transaction volume
  return Math.max(1, 100 / (onChainData.transactionVolume / 1000000));
}

function calculateHashRate(blockchain: string, onChainData: any): number {
  if (!onChainData) return 0;
  
  // Estimate hash rate based on blockchain type and activity
  const baseHashRates = {
    bitcoin: 500000000000000, // 500 EH/s
    ethereum: 1000000000000,   // 1 TH/s (post-merge)
    solana: 500000000000,      // 500 GH/s
    'binance-smart-chain': 1000000000000, // 1 TH/s
    polygon: 1000000000,      // 1 GH/s
  };
  
  const baseRate = baseHashRates[blockchain as keyof typeof baseHashRates] || 1000000000;
  const activityMultiplier = Math.min(2, Math.max(0.5, (onChainData.activeAddresses || 0) / 1000000));
  
  return baseRate * activityMultiplier;
}

function detectSpike(currentValue: number, baselineValue: number | null, metricName: string): any {
  if (!currentValue || !baselineValue) {
    return {
      isSpike: false,
      severity: 'low' as const,
      confidence: 0,
      message: baselineValue ? 'Insufficient data for spike detection' : 'No baseline data available',
      threshold: baselineValue ? baselineValue * 1.5 : null,
      currentValue: currentValue || 0,
      baseline: baselineValue,
      deviation: 0,
    };
  }
  
  const changePercent = Math.abs(((currentValue - baselineValue) / baselineValue) * 100);
  const threshold = baselineValue * 1.5; // 50% increase threshold
  
  const isSpike = currentValue > threshold;
  let severity: 'low' | 'medium' | 'high' = 'low';
  
  if (changePercent > 100) severity = 'high';
  else if (changePercent > 50) severity = 'medium';
  
  const confidence = Math.min(100, changePercent);
  
  return {
    isSpike,
    severity,
    confidence,
    message: isSpike 
      ? `Spike detected in ${metricName}: ${changePercent.toFixed(2)}% increase` 
      : `No spike detected in ${metricName}`,
    threshold,
    currentValue,
    baseline: baselineValue,
    deviation: currentValue - baselineValue,
  };
}

function calculateVolatility(priceData: any): number {
  if (!priceData || !priceData.price) return 0;
  // Simple volatility calculation based on price change
  return Math.abs(priceData.priceChange24h / priceData.price) * 100;
}

function calculateNetworkUtilization(onChainData: any): number {
  if (!onChainData || !onChainData.activeAddresses) return 0;
  // Normalize to 0-100 scale
  return Math.min(100, (onChainData.activeAddresses / 1000000) * 100);
}

function calculateBollingerPosition(technicalData: any): number {
  if (!technicalData || !technicalData.bollingerUpper || !technicalData.bollingerLower) return 50;
  const range = technicalData.bollingerUpper - technicalData.bollingerLower;
  const position = (technicalData.rsi - technicalData.bollingerLower) / range;
  return position * 100;
}

function calculateTrendStrength(technicalData: any): number {
  if (!technicalData) return 50;
  // Simple trend strength based on MACD and RSI
  const macdSignal = technicalData.macd > 0 ? 1 : -1;
  const rsiSignal = technicalData.rsi > 50 ? 1 : -1;
  return 50 + (macdSignal * rsiSignal * 25);
}

function calculateOverallHealth(priceData: any, onChainData: any, technicalData: any): number {
  let health = 50; // Base health
  
  // Price health (30% weight)
  if (priceData && priceData.price > 0) {
    const priceHealth = Math.max(0, 100 - Math.abs(priceData.priceChange24h) / 2);
    health += (priceHealth - 50) * 0.3;
  }
  
  // On-chain health (40% weight)
  if (onChainData && onChainData.activeAddresses > 0) {
    const onChainHealth = Math.min(100, (onChainData.activeAddresses / 100000) * 100);
    health += (onChainHealth - 50) * 0.4;
  }
  
  // Technical health (30% weight)
  if (technicalData && technicalData.rsi > 0) {
    const rsiHealth = 100 - Math.abs(technicalData.rsi - 50);
    health += (rsiHealth - 50) * 0.3;
  }
  
  return Math.max(0, Math.min(100, health));
}

function calculateRiskLevel(priceData: any, onChainData: any): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  
  // Price volatility risk
  if (priceData && priceData.priceChange24h) {
    const volatility = Math.abs(priceData.priceChange24h / priceData.price) * 100;
    riskScore += volatility > 10 ? 2 : volatility > 5 ? 1 : 0;
  }
  
  // On-chain activity risk
  if (onChainData && onChainData.activeAddresses) {
    const activityRatio = onChainData.activeAddresses / 1000000;
    riskScore += activityRatio < 0.1 ? 2 : activityRatio < 0.5 ? 1 : 0;
  }
  
  if (riskScore >= 3) return 'high';
  if (riskScore >= 1) return 'medium';
  return 'low';
}

function generateRecommendation(priceData: any, onChainData: any, technicalData: any): string {
  const health = calculateOverallHealth(priceData, onChainData, technicalData);
  const risk = calculateRiskLevel(priceData, onChainData);
  
  if (health > 70 && risk === 'low') {
    return 'Strong buy signal - Network healthy and low risk';
  } else if (health > 50 && risk === 'medium') {
    return 'Hold position - Monitor for changes';
  } else if (health < 30 || risk === 'high') {
    return 'Consider selling - High risk detected';
  } else {
    return 'Neutral - Wait for clearer signals';
  }
}