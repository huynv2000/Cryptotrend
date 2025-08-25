import { NextRequest, NextResponse } from 'next/server';
import { SpikeDetectionEngine, MetricSpikeDetectors } from '@/lib/spike-detection';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const createSpikes = searchParams.get('createSpikes') === 'true';
    const blockchain = searchParams.get('blockchain') || 'ethereum';
    const timeframe = searchParams.get('timeframe') || '24h';

    if (!createSpikes) {
      return NextResponse.json({
        message: 'This endpoint creates test spikes for all metrics. Add ?createSpikes=true to generate spikes.',
        usage: '/api/test-spikes?createSpikes=true&blockchain=ethereum&timeframe=24h'
      });
    }

    const now = new Date();
    
    // Generate realistic historical data with normal patterns
    const generateNormalHistoricalData = (baseValue: number, days: number = 90) => {
      const data = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Add realistic variation (±5%)
        const variation = 1 + (Math.random() - 0.5) * 0.1;
        // Add slight trend
        const trendFactor = 1 + (i / days) * 0.02;
        
        data.push({
          timestamp: date,
          value: baseValue * variation * trendFactor
        });
      }
      return data;
    };

    // Generate spike data for testing
    const generateSpikeHistoricalData = (baseValue: number, days: number = 90) => {
      const data = [];
      for (let i = days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        let value = baseValue;
        
        // Create normal pattern for most data
        if (i > 7) { // Older data - completely normal
          const variation = 1 + (Math.random() - 0.5) * 0.05; // Less variation
          const trendFactor = 1 + (i / days) * 0.01; // Less trend
          value = baseValue * variation * trendFactor;
        } else if (i > 2) { // Recent data - slight increase
          const variation = 1 + (Math.random() - 0.5) * 0.05;
          const trendFactor = 1.05; // Slight increase
          value = baseValue * variation * trendFactor;
        } else { // Very recent data - create dramatic spike
          const spikeMultiplier = 1 + (3 - i) * 0.5; // Dramatic spike for last 3 days
          value = baseValue * spikeMultiplier;
        }
        
        data.push({
          timestamp: date,
          value
        });
      }
      return data;
    };

    // Test data for Usage Metrics
    const usageHistoricalData = {
      dailyActiveAddresses: generateSpikeHistoricalData(500000, 90),
      newAddresses: generateSpikeHistoricalData(100000, 90),
      dailyTransactions: generateSpikeHistoricalData(1000000, 90),
      transactionVolume: generateSpikeHistoricalData(2000000000, 90),
      averageFee: generateNormalHistoricalData(5, 90),
      hashRate: generateNormalHistoricalData(150000000000000, 90),
    };

    const usageCurrentValues = {
      dailyActiveAddresses: 500000 * 2.5, // 150% spike - much more dramatic
      newAddresses: 100000 * 2.2, // 120% spike
      dailyTransactions: 1000000 * 3.0, // 200% spike
      transactionVolume: 2000000000 * 2.8, // 180% spike
      averageFee: 5 * 1.1, // 10% change (no spike)
      hashRate: 150000000000000 * 1.05, // 5% change (no spike)
    };

    // Test data for TVL Metrics
    const tvlHistoricalData = {
      chainTVL: generateSpikeHistoricalData(20000000000, 90),
      chainTVLChange24h: generateNormalHistoricalData(2, 90),
      chainTVLChange7d: generateNormalHistoricalData(5, 90),
      chainTVLChange30d: generateNormalHistoricalData(15, 90),
      tvlDominance: generateSpikeHistoricalData(18, 90),
      tvlRank: generateNormalHistoricalData(3, 90),
      tvlPeak: generateNormalHistoricalData(25000000000, 90),
      tvlToMarketCapRatio: generateSpikeHistoricalData(25, 90),
      defiTVL: generateSpikeHistoricalData(15000000000, 90),
      stakingTVL: generateNormalHistoricalData(5000000000, 90),
      bridgeTVL: generateNormalHistoricalData(2000000000, 90),
      lendingTVL: generateNormalHistoricalData(8000000000, 90),
      dexTVL: generateNormalHistoricalData(3000000000, 90),
      yieldTVL: generateNormalHistoricalData(1000000000, 90),
    };

    const tvlCurrentValues = {
      chainTVL: 20000000000 * 1.7, // 70% spike
      chainTVLChange24h: 2 * 1.2, // 20% spike
      chainTVLChange7d: 5 * 1.3, // 30% spike
      chainTVLChange30d: 15 * 1.4, // 40% spike
      tvlDominance: 18 * 1.5, // 50% spike
      tvlRank: 2, // Lower rank is better (slight improvement)
      tvlPeak: 25000000000 * 1.1, // 10% change (no spike)
      tvlToMarketCapRatio: 25 * 1.6, // 60% spike
      defiTVL: 15000000000 * 1.4, // 40% spike
      stakingTVL: 5000000000 * 1.1, // 10% change (no spike)
      bridgeTVL: 2000000000 * 1.2, // 20% spike
      lendingTVL: 8000000000 * 1.3, // 30% spike
      dexTVL: 3000000000 * 1.4, // 40% spike
      yieldTVL: 1000000000 * 1.5, // 50% spike
    };

    // Test data for Cashflow Metrics
    const cashflowHistoricalData = {
      bridgeFlows: generateSpikeHistoricalData(100000000, 90),
      exchangeFlows: generateSpikeHistoricalData(500000000, 90),
      stakingMetrics: generateSpikeHistoricalData(2000000000, 90),
      miningValidation: generateNormalHistoricalData(50000000, 90),
    };

    const cashflowCurrentValues = {
      bridgeFlows: 100000000 * 2.5, // 150% spike
      exchangeFlows: 500000000 * 2.2, // 120% spike
      stakingMetrics: 2000000000 * 2.3, // 130% spike
      miningValidation: 50000000 * 1.05, // 5% change (no spike)
    };

    // Generate spike detection results for all metrics
    const usageSpikeResults = MetricSpikeDetectors.detectUsageSpikes(
      usageHistoricalData,
      usageCurrentValues,
      blockchain,
      timeframe
    );

    const tvlSpikeResults = MetricSpikeDetectors.detectTVLSpikes(
      tvlHistoricalData,
      tvlCurrentValues,
      blockchain,
      timeframe
    );

    const cashflowSpikeResults = MetricSpikeDetectors.detectCashflowSpikes(
      cashflowHistoricalData,
      cashflowCurrentValues,
      blockchain,
      timeframe
    );

    // Format the response to match the expected API structure
    const response = {
      success: true,
      message: 'Test spikes generated for all metrics',
      blockchain,
      timeframe,
      generatedAt: now,
      
      // Usage Metrics with spikes
      usageMetrics: {
        id: `usage-${blockchain}-${timeframe}-${now.getTime()}`,
        blockchain: blockchain as any,
        timeframe: timeframe as any,
        createdAt: now,
        updatedAt: now,
        
        dailyActiveAddresses: {
          value: usageCurrentValues.dailyActiveAddresses,
          change: usageCurrentValues.dailyActiveAddresses * 0.6, // 150% total increase, so 60% of current value
          changePercent: 150,
          trend: 'up' as const,
          timestamp: now,
        },
        
        newAddresses: {
          value: usageCurrentValues.newAddresses,
          change: usageCurrentValues.newAddresses * 0.545, // 120% total increase, so ~54.5% of current value
          changePercent: 120,
          trend: 'up' as const,
          timestamp: now,
        },
        
        dailyTransactions: {
          value: usageCurrentValues.dailyTransactions,
          change: usageCurrentValues.dailyTransactions * 0.667, // 200% total increase, so 66.7% of current value
          changePercent: 200,
          trend: 'up' as const,
          timestamp: now,
        },
        
        transactionVolume: {
          value: usageCurrentValues.transactionVolume,
          change: usageCurrentValues.transactionVolume * 0.643, // 180% total increase, so ~64.3% of current value
          changePercent: 180,
          trend: 'up' as const,
          timestamp: now,
        },
        
        averageFee: {
          value: usageCurrentValues.averageFee,
          change: usageCurrentValues.averageFee * 0.1,
          changePercent: 10,
          trend: 'up' as const,
          timestamp: now,
        },
        
        hashRate: {
          value: usageCurrentValues.hashRate,
          change: usageCurrentValues.hashRate * 0.05,
          changePercent: 5,
          trend: 'up' as const,
          timestamp: now,
        },
        
        spikeDetection: usageSpikeResults,
      },
      
      // TVL Metrics with spikes
      tvlMetrics: {
        id: `tvl-${blockchain}-${timeframe}-${now.getTime()}`,
        blockchain: blockchain as any,
        timeframe: timeframe as any,
        createdAt: now,
        updatedAt: now,
        
        chainTVL: {
          value: tvlCurrentValues.chainTVL,
          change: tvlCurrentValues.chainTVL * 0.7,
          changePercent: 70,
          trend: 'up' as const,
          timestamp: now,
        },
        
        tvlDominance: {
          value: tvlCurrentValues.tvlDominance,
          change: tvlCurrentValues.tvlDominance * 0.5,
          changePercent: 50,
          trend: 'up' as const,
          timestamp: now,
        },
        
        tvlRank: {
          value: tvlCurrentValues.tvlRank,
          change: -1,
          changePercent: -33,
          trend: 'down' as const, // Lower rank is better
          timestamp: now,
        },
        
        tvlToMarketCapRatio: {
          value: tvlCurrentValues.tvlToMarketCapRatio,
          change: tvlCurrentValues.tvlToMarketCapRatio * 0.6,
          changePercent: 60,
          trend: 'up' as const,
          timestamp: now,
        },
        
        spikeDetection: tvlSpikeResults,
      },
      
      // Cashflow Metrics with spikes
      cashflowMetrics: {
        id: `cashflow-${blockchain}-${timeframe}-${now.getTime()}`,
        blockchain: blockchain as any,
        timeframe: timeframe as any,
        createdAt: now,
        updatedAt: now,
        
        bridgeFlows: {
          value: cashflowCurrentValues.bridgeFlows,
          change: cashflowCurrentValues.bridgeFlows * 0.6, // 150% total increase, so 60% of current value
          changePercent: 150,
          trend: 'up' as const,
          timestamp: now,
        },
        
        exchangeFlows: {
          value: cashflowCurrentValues.exchangeFlows,
          change: cashflowCurrentValues.exchangeFlows * 0.545, // 120% total increase, so ~54.5% of current value
          changePercent: 120,
          trend: 'up' as const,
          timestamp: now,
        },
        
        stakingMetrics: {
          value: cashflowCurrentValues.stakingMetrics,
          change: cashflowCurrentValues.stakingMetrics * 0.565, // 130% total increase, so ~56.5% of current value
          changePercent: 130,
          trend: 'up' as const,
          timestamp: now,
        },
        
        miningValidation: {
          value: cashflowCurrentValues.miningValidation,
          change: cashflowCurrentValues.miningValidation * 0.05,
          changePercent: 5,
          trend: 'up' as const,
          timestamp: now,
        },
        
        spikeDetection: cashflowSpikeResults,
      },
      
      // Summary of spikes detected
      spikeSummary: {
        usageMetrics: {
          totalMetrics: Object.keys(usageSpikeResults).length,
          spikesDetected: Object.values(usageSpikeResults).filter(r => r.isSpike).length,
          spikeDetails: Object.entries(usageSpikeResults)
            .filter(([_, r]) => r.isSpike)
            .map(([metric, r]) => ({
              metric,
              severity: r.severity,
              deviation: r.deviation.toFixed(1) + '%'
            }))
        },
        tvlMetrics: {
          totalMetrics: Object.keys(tvlSpikeResults).length,
          spikesDetected: Object.values(tvlSpikeResults).filter(r => r.isSpike).length,
          spikeDetails: Object.entries(tvlSpikeResults)
            .filter(([_, r]) => r.isSpike)
            .map(([metric, r]) => ({
              metric,
              severity: r.severity,
              deviation: r.deviation.toFixed(1) + '%'
            }))
        },
        cashflowMetrics: {
          totalMetrics: Object.keys(cashflowSpikeResults).length,
          spikesDetected: Object.values(cashflowSpikeResults).filter(r => r.isSpike).length,
          spikeDetails: Object.entries(cashflowSpikeResults)
            .filter(([_, r]) => r.isSpike)
            .map(([metric, r]) => ({
              metric,
              severity: r.severity,
              deviation: r.deviation.toFixed(1) + '%'
            }))
        }
      }
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error generating test spikes:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate test spikes',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}