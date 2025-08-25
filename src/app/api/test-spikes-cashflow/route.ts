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

    // Get current price and volume data
    const currentPrice = await db.priceHistory.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    const currentVolume = await db.volumeHistory.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    const now = new Date();
    
    // Create on-chain spike data for cash flow metrics
    const cashflowSpikeData = {
      cryptoId: crypto.id,
      timestamp: now,
      activeAddresses: 27638272, // Use the same spiked value from before
      newAddresses: 2033568,
      transactionVolume: 2879785489000,
      exchangeInflow: 15000000000, // $15B exchange inflow (spike)
      exchangeOutflow: 8000000000, // $8B exchange outflow
      mvrv: 3.5,
      nupl: 0.9,
      sopr: 2.0,
      supplyDistribution: '{}',
      whaleHoldingsPercentage: 85,
      retailHoldingsPercentage: 10,
      exchangeHoldingsPercentage: 5,
    };

    // Create volume spike data
    const volumeSpikeData = {
      cryptoId: crypto.id,
      timestamp: now,
      dailyVolume: 200000000000, // $200B daily volume (huge spike)
      price: currentPrice?.price || 65000,
      exchangeVolume: 180000000000, // $180B exchange volume
      volumeChange24h: 450.5, // 450.5% increase
      volumeAvg30d: 50000000000,
      volumeVsAvg: 300.0, // 300% vs average
    };

    // Insert spike data
    await db.onChainMetric.create({
      data: cashflowSpikeData
    });

    await db.volumeHistory.create({
      data: volumeSpikeData
    });

    return NextResponse.json({
      message: 'Cash Flow spike data created successfully',
      blockchain,
      cashflowData: {
        exchangeInflow: '$15B',
        exchangeOutflow: '$8B',
        totalExchangeFlows: '$23B',
        dailyVolume: '$200B',
        volumeChange24h: '+450.5%',
      },
      estimatedMetrics: {
        bridgeFlows: '$20B', // 10% of volume
        stakingMetrics: blockchain === 'ethereum' ? '$12.5B' : '$0',
        miningValidation: blockchain === 'bitcoin' ? '$58.5B' : '$0',
      },
      note: 'Refresh the dashboard to see Cash Flow spike alerts'
    });

  } catch (error) {
    console.error('Error creating Cash Flow spike data:', error);
    return NextResponse.json(
      { error: 'Failed to create Cash Flow spike data' },
      { status: 500 }
    );
  }
}