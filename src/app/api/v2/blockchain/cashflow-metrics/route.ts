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
    const [priceData, onChainData, volumeData, derivativesData] = await Promise.all([
      db.priceHistory.findFirst({
        where: { 
          cryptoId: crypto.id,
          timestamp: {
            gte: startDate
          }
        },
        orderBy: { timestamp: 'desc' }
      }),
      db.onChainMetric.findFirst({
        where: { 
          cryptoId: crypto.id,
          timestamp: {
            gte: startDate
          }
        },
        orderBy: { timestamp: 'desc' }
      }),
      db.volumeHistory.findFirst({
        where: { 
          cryptoId: crypto.id,
          timestamp: {
            gte: startDate
          }
        },
        orderBy: { timestamp: 'desc' }
      }),
      db.derivativeMetric.findFirst({
        where: { 
          cryptoId: crypto.id,
          timestamp: {
            gte: startDate
          }
        },
        orderBy: { timestamp: 'desc' }
      })
    ]);

    // Get previous period data for change calculations
    let previousStartDate = new Date(startDate);
    let previousEndDate = new Date(startDate);
    
    switch (timeframe) {
      case '7d':
        previousStartDate.setDate(now.getDate() - 14);
        previousEndDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        previousStartDate.setDate(now.getDate() - 60);
        previousEndDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        previousStartDate.setDate(now.getDate() - 180);
        previousEndDate.setDate(now.getDate() - 90);
        break;
      default: // 24h
        previousStartDate.setDate(now.getDate() - 2);
        previousEndDate.setDate(now.getDate() - 1);
        break;
    }

    const [previousPriceData, previousOnChainData, previousVolumeData, previousDerivativesData] = await Promise.all([
      db.priceHistory.findFirst({
        where: { 
          cryptoId: crypto.id,
          timestamp: {
            gte: previousStartDate,
            lt: previousEndDate
          }
        },
        orderBy: { timestamp: 'desc' }
      }),
      db.onChainMetric.findFirst({
        where: { 
          cryptoId: crypto.id,
          timestamp: {
            gte: previousStartDate,
            lt: previousEndDate
          }
        },
        orderBy: { timestamp: 'desc' }
      }),
      db.volumeHistory.findFirst({
        where: { 
          cryptoId: crypto.id,
          timestamp: {
            gte: previousStartDate,
            lt: previousEndDate
          }
        },
        orderBy: { timestamp: 'desc' }
      }),
      db.derivativeMetric.findFirst({
        where: { 
          cryptoId: crypto.id,
          timestamp: {
            gte: previousStartDate,
            lt: previousEndDate
          }
        },
        orderBy: { timestamp: 'desc' }
      })
    ]);

    // Calculate current values
    const currentBridgeFlows = calculateBridgeFlows(onChainData, volumeData);
    const currentExchangeFlows = (onChainData?.exchangeInflow || 0) + (onChainData?.exchangeOutflow || 0);
    const currentStakingMetrics = calculateStakingValue(blockchain, onChainData, priceData);
    const currentMiningValidation = calculateMiningValidation(blockchain, onChainData, priceData);

    // Calculate previous values for change calculations
    const previousBridgeFlows = calculateBridgeFlows(previousOnChainData, previousVolumeData);
    const previousExchangeFlows = (previousOnChainData?.exchangeInflow || 0) + (previousOnChainData?.exchangeOutflow || 0);
    const previousStakingMetrics = calculateStakingValue(blockchain, previousOnChainData, previousPriceData);
    const previousMiningValidation = calculateMiningValidation(blockchain, previousOnChainData, previousPriceData);

    // Format cashflow metrics data to match the expected interface
    const cashflowMetrics = {
      id: `cashflow-${blockchain}-${timeframe}-${now.getTime()}`,
      blockchain: blockchain as any,
      timeframe: timeframe as any,
      createdAt: now,
      updatedAt: now,
      
      // Main metrics with timeframe-specific changes
      bridgeFlows: {
        value: currentBridgeFlows,
        change: calculateChange(currentBridgeFlows, previousBridgeFlows),
        changePercent: calculateChangePercent(currentBridgeFlows, previousBridgeFlows),
        trend: calculateTrend(currentBridgeFlows, previousBridgeFlows),
        timestamp: now,
      },
      
      exchangeFlows: {
        value: currentExchangeFlows,
        change: calculateChange(currentExchangeFlows, previousExchangeFlows),
        changePercent: calculateChangePercent(currentExchangeFlows, previousExchangeFlows),
        trend: calculateTrend(currentExchangeFlows, previousExchangeFlows),
        timestamp: now,
      },
      
      stakingMetrics: {
        value: currentStakingMetrics,
        change: calculateChange(currentStakingMetrics, previousStakingMetrics),
        changePercent: calculateChangePercent(currentStakingMetrics, previousStakingMetrics),
        trend: calculateTrend(currentStakingMetrics, previousStakingMetrics),
        timestamp: now,
      },
      
      miningValidation: {
        value: currentMiningValidation,
        change: calculateChange(currentMiningValidation, previousMiningValidation),
        changePercent: calculateChangePercent(currentMiningValidation, previousMiningValidation),
        trend: calculateTrend(currentMiningValidation, previousMiningValidation),
        timestamp: now,
      },
      
      // Flow analysis with complex nested structures
      flowAnalysis: {
        bridgeFlowPatterns: generateBridgeFlowPatterns(onChainData, volumeData, blockchain),
        exchangeFlowCorrelations: generateExchangeFlowCorrelations(onChainData, volumeData),
        stakingTrends: generateStakingTrends(blockchain, onChainData, priceData),
        miningEfficiency: calculateMiningEfficiency(blockchain, onChainData, priceData),
      },
    };

    return NextResponse.json(cashflowMetrics);
  } catch (error) {
    console.error('Error fetching cashflow metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cashflow metrics' },
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

function calculateBridgeFlows(onChainData: any, volumeData: any): number {
  if (!onChainData || !volumeData) return 0;
  // Estimate bridge flows based on cross-chain activity
  return (volumeData.dailyVolume || 0) * 0.1; // 10% of volume assumed to be bridge flows
}

function generateBridgeFlowPatterns(onChainData: any, volumeData: any, blockchain: string): any[] {
  const patterns = [];
  const totalFlow = calculateBridgeFlows(onChainData, volumeData);
  
  // Generate some sample flow patterns
  patterns.push({
    direction: 'inflow' as const,
    amount: totalFlow * 0.6,
    source: 'ethereum',
    destination: blockchain,
    timestamp: new Date(),
  });
  
  patterns.push({
    direction: 'outflow' as const,
    amount: totalFlow * 0.4,
    source: blockchain,
    destination: 'ethereum',
    timestamp: new Date(),
  });
  
  return patterns;
}

function generateExchangeFlowCorrelations(onChainData: any, volumeData: any): any[] {
  const correlations = [];
  
  // Generate correlation data
  correlations.push({
    metric1: 'exchange_inflow',
    metric2: 'price',
    correlation: 0.75,
    significance: 0.95,
    timeframe: '24h' as const,
  });
  
  correlations.push({
    metric1: 'exchange_outflow',
    metric2: 'volume',
    correlation: 0.68,
    significance: 0.89,
    timeframe: '24h' as const,
  });
  
  return correlations;
}

function calculateStakingValue(blockchain: string, onChainData: any, priceData: any): number {
  if (!onChainData || !priceData) return 0;
  
  // Estimate staking value based on blockchain type
  const stakingMultipliers = {
    ethereum: 0.25, // 25% of ETH supply is staked
    solana: 0.70, // 70% of SOL supply is staked
    polygon: 0.35, // 35% of MATIC supply is staked
    bitcoin: 0.0, // Bitcoin doesn't have staking
    'binance-smart-chain': 0.15, // 15% of BNB supply is staked
  };
  
  const multiplier = stakingMultipliers[blockchain as keyof typeof stakingMultipliers] || 0;
  const estimatedStakedSupply = (onChainData.activeAddresses || 0) * 1000 * multiplier; // Estimate supply from active addresses
  return estimatedStakedSupply * (priceData.price || 0);
}

function generateStakingTrends(blockchain: string, onChainData: any, priceData: any): any[] {
  const trends = [];
  const stakingValue = calculateStakingValue(blockchain, onChainData, priceData);
  
  trends.push({
    direction: stakingValue > 10000000000 ? 'increasing' as const : 'stable' as const,
    strength: Math.min(100, stakingValue / 100000000),
    period: 30,
    confidence: 0.75,
  });
  
  return trends;
}

function calculateMiningValidation(blockchain: string, onChainData: any, priceData: any): number {
  if (!onChainData || !priceData) return 0;
  
  // Calculate mining validation rewards
  const dailyBlockRewards = {
    bitcoin: 900, // ~900 BTC per day
    ethereum: 0, // Post-merge, no mining rewards
    solana: 0, // No traditional mining
    'binance-smart-chain': 0, // PoS
    polygon: 0, // PoS
  };
  
  const dailyReward = dailyBlockRewards[blockchain as keyof typeof dailyBlockRewards] || 0;
  return dailyReward * (priceData.price || 0);
}

function calculateMiningEfficiency(blockchain: string, onChainData: any, priceData: any): any {
  const miningRevenue = calculateMiningValidation(blockchain, onChainData, priceData);
  const estimatedCost = miningRevenue * 0.4; // Assume 40% cost
  
  return {
    current: miningRevenue,
    average: miningRevenue * 0.9, // Slightly lower average
    peak: miningRevenue * 1.2, // Peak efficiency
    efficiency: estimatedCost > 0 ? (miningRevenue - estimatedCost) / estimatedCost : 0,
  };
}

function estimateMinerInflow(onChainData: any): number {
  if (!onChainData || !onChainData.transactionVolume) return 0;
  // Estimate miner inflow as a percentage of transaction volume
  return onChainData.transactionVolume * 0.15; // 15% assumption
}

function estimateInstitutionalInflow(priceData: any, volumeData: any): number {
  if (!volumeData || !volumeData.dailyVolume) return 0;
  // Estimate institutional inflow based on volume and price
  return volumeData.dailyVolume * 0.35; // 35% assumption
}

function estimateRetailInflow(volumeData: any): number {
  if (!volumeData || !volumeData.dailyVolume) return 0;
  // Estimate retail inflow as remaining volume
  return volumeData.dailyVolume * 0.50; // 50% assumption
}

function calculateTotalInflow(onChainData: any, volumeData: any): number {
  const minerInflow = estimateMinerInflow(onChainData);
  const institutionalInflow = estimateInstitutionalInflow(null, volumeData);
  const retailInflow = estimateRetailInflow(volumeData);
  return minerInflow + institutionalInflow + retailInflow;
}

function estimateMinerOutflow(onChainData: any): number {
  if (!onChainData || !onChainData.transactionVolume) return 0;
  // Estimate miner outflow
  return onChainData.transactionVolume * 0.12; // 12% assumption
}

function estimateInstitutionalOutflow(priceData: any, volumeData: any): number {
  if (!volumeData || !volumeData.dailyVolume) return 0;
  return volumeData.dailyVolume * 0.30; // 30% assumption
}

function estimateRetailOutflow(volumeData: any): number {
  if (!volumeData || !volumeData.dailyVolume) return 0;
  return volumeData.dailyVolume * 0.45; // 45% assumption
}

function calculateTotalOutflow(onChainData: any, volumeData: any): number {
  const minerOutflow = estimateMinerOutflow(onChainData);
  const institutionalOutflow = estimateInstitutionalOutflow(null, volumeData);
  const retailOutflow = estimateRetailOutflow(volumeData);
  return minerOutflow + institutionalOutflow + retailOutflow;
}

function calculateVolumeTrend(volumeData: any): 'increasing' | 'decreasing' | 'stable' {
  if (!volumeData || !volumeData.volumeChange24h) return 'stable';
  
  const change = volumeData.volumeChange24h;
  if (change > 5) return 'increasing';
  if (change < -5) return 'decreasing';
  return 'stable';
}

function calculateDerivativesFlow(derivativesData: any): 'positive' | 'negative' | 'neutral' {
  if (!derivativesData) return 'neutral';
  
  const fundingRate = derivativesData.fundingRate || 0;
  const openInterest = derivativesData.openInterest || 0;
  
  if (fundingRate > 0.01 && openInterest > 0) return 'positive';
  if (fundingRate < -0.01 && openInterest > 0) return 'negative';
  return 'neutral';
}

function calculateNetFlow(onChainData: any, volumeData: any): number {
  const totalInflow = calculateTotalInflow(onChainData, volumeData);
  const totalOutflow = calculateTotalOutflow(onChainData, volumeData);
  return totalInflow - totalOutflow;
}

function analyzeFlowTrend(onChainData: any, volumeData: any): 'bullish' | 'bearish' | 'neutral' {
  const netFlow = calculateNetFlow(onChainData, volumeData);
  
  if (netFlow > 1000000) return 'bullish'; // $1M+ positive flow
  if (netFlow < -1000000) return 'bearish'; // $1M+ negative flow
  return 'neutral';
}

function calculateFlowMomentum(onChainData: any, volumeData: any): number {
  if (!volumeData || !volumeData.volumeChange24h) return 50;
  
  const volumeChange = volumeData.volumeChange24h;
  const netFlow = calculateNetFlow(onChainData, volumeData);
  
  // Normalize momentum to 0-100 scale
  let momentum = 50;
  momentum += volumeChange > 0 ? 25 : -25;
  momentum += netFlow > 0 ? 25 : -25;
  
  return Math.max(0, Math.min(100, momentum));
}

function deriveFlowSentiment(onChainData: any, volumeData: any, derivativesData: any): 'positive' | 'negative' | 'neutral' {
  const flowTrend = analyzeFlowTrend(onChainData, volumeData);
  const derivativesFlow = calculateDerivativesFlow(derivativesData);
  
  if (flowTrend === 'bullish' && derivativesFlow === 'positive') return 'positive';
  if (flowTrend === 'bearish' && derivativesFlow === 'negative') return 'negative';
  return 'neutral';
}

function predictNext24hFlow(onChainData: any, volumeData: any): number {
  const currentNetFlow = calculateNetFlow(onChainData, volumeData);
  const volumeChange = volumeData?.volumeChange24h || 0;
  
  // Simple prediction based on current trend
  const trendMultiplier = 1 + (volumeChange / 100);
  return currentNetFlow * trendMultiplier;
}

function predictNext7dTrend(onChainData: any, volumeData: any): 'up' | 'down' | 'sideways' {
  const momentum = calculateFlowMomentum(onChainData, volumeData);
  
  if (momentum > 65) return 'up';
  if (momentum < 35) return 'down';
  return 'sideways';
}

function calculatePredictionConfidence(onChainData: any, volumeData: any): number {
  if (!onChainData && !volumeData) return 0;
  
  let confidence = 50; // Base confidence
  
  // Add confidence based on data availability
  if (onChainData) confidence += 25;
  if (volumeData) confidence += 25;
  
  return Math.min(100, confidence);
}