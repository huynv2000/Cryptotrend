import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockchain = searchParams.get('blockchain') || 'ethereum';
    const timeframe = searchParams.get('timeframe') || '24h';
    
    // Test spike data
    const spikeData = {
      dailyActiveAddresses: {
        isSpike: true,
        severity: 'medium',
        confidence: 1,
        message: 'dailyActiveAddresses shows significant spike of 72.0% above normal levels',
        threshold: 967186.2353066397,
        currentValue: 1250000,
        baseline: 726601.6029899075,
        deviation: 72.03375203912982
      },
      newAddresses: {
        isSpike: true,
        severity: 'medium',
        confidence: 1,
        message: 'newAddresses shows significant spike of 51.2% above normal levels',
        threshold: 151245.1145161938,
        currentValue: 220000,
        baseline: 145545.6029899075,
        deviation: 51.2451145161938
      },
      dailyTransactions: {
        isSpike: true,
        severity: 'high',
        confidence: 1,
        message: 'dailyTransactions shows critical spike of 105.8% above normal levels',
        threshold: 1968829.9905803874,
        currentValue: 2200000,
        baseline: 1068829.9905803874,
        deviation: 105.812205312236
      },
      transactionVolume: {
        isSpike: true,
        severity: 'medium',
        confidence: 1,
        message: 'transactionVolume shows significant spike of 91.6% above normal levels',
        threshold: 3951087144.2648706,
        currentValue: 3800000000,
        baseline: 1984107144.2648706,
        deviation: 91.60444527721359
      },
      averageFee: {
        isSpike: false,
        severity: 'low',
        confidence: 0,
        message: 'No significant spike detected',
        threshold: 5.949474179435017,
        currentValue: 5.5,
        baseline: 4.957895149529182,
        deviation: 0
      },
      hashRate: {
        isSpike: false,
        severity: 'low',
        confidence: 0,
        message: 'No significant spike detected',
        threshold: 181262580336136.1,
        currentValue: 157500000000000,
        baseline: 151052150280113.4,
        deviation: 0
      }
    };

    const now = new Date();
    
    return NextResponse.json({
      id: `usage-${blockchain}-${timeframe}-${now.getTime()}`,
      blockchain: blockchain as any,
      timeframe: timeframe as any,
      createdAt: now,
      updatedAt: now,
      
      dailyActiveAddresses: {
        value: 1250000,
        change: 750000,
        changePercent: 150,
        trend: 'up' as const,
        timestamp: now,
      },
      
      newAddresses: {
        value: 220000,
        change: 120000,
        changePercent: 120,
        trend: 'up' as const,
        timestamp: now,
      },
      
      dailyTransactions: {
        value: 2200000,
        change: 1466667,
        changePercent: 200,
        trend: 'up' as const,
        timestamp: now,
      },
      
      transactionVolume: {
        value: 3800000000,
        change: 2444444444,
        changePercent: 180,
        trend: 'up' as const,
        timestamp: now,
      },
      
      averageFee: {
        value: 5.5,
        change: 0.5,
        changePercent: 10,
        trend: 'up' as const,
        timestamp: now,
      },
      
      hashRate: {
        value: 157500000000000,
        change: 7875000000000,
        changePercent: 5,
        trend: 'up' as const,
        timestamp: now,
      },
      
      rollingAverages: {
        dailyActiveAddresses: { '7d': 625000, '30d': 587500, '90d': 550000 },
        newAddresses: { '7d': 132000, '30d': 121000, '90d': 110000 },
        dailyTransactions: { '7d': 1500000, '30d': 1350000, '90d': 1200000 },
        transactionVolume: { '7d': 2800000000, '30d': 2520000000, '90d': 2240000000 },
        averageFee: { '7d': 5.1, '30d': 5.05, '90d': 5.0 },
        hashRate: { '7d': 155000000000000, '30d': 152500000000000, '90d': 150000000000000 },
      },
      
      spikeDetection: spikeData,
    });
    
  } catch (error) {
    console.error('Error in test spike endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to generate test spike data' },
      { status: 500 }
    );
  }
}