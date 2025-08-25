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

    // Get current data to establish baseline
    const currentOnChain = await db.onChainMetric.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    const currentPrice = await db.priceHistory.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    if (!currentOnChain || !currentPrice) {
      return NextResponse.json(
        { error: 'No current data found for blockchain' },
        { status: 404 }
      );
    }

    // Create aggressive spike data (5x-10x increases)
    const now = new Date();
    
    // Create spike data with massive increases
    const spikeData = {
      cryptoId: crypto.id,
      timestamp: now,
      activeAddresses: Math.floor((currentOnChain.activeAddresses || 500000) * 8),  // 8x increase
      newAddresses: Math.floor((currentOnChain.newAddresses || 70000) * 6),         // 6x increase
      transactionVolume: Math.floor((currentOnChain.transactionVolume || 30000000000) * 10), // 10x increase
      mvrv: 3.5,  // Very high MVRV
      nupl: 0.9,  // Very high NUPL
      sopr: 2.0,  // Very high SOPR
      exchangeInflow: Math.floor((currentOnChain.exchangeInflow || 10000000000) * 5),
      exchangeOutflow: Math.floor((currentOnChain.exchangeOutflow || 10000000000) * 3),
      supplyDistribution: '{}',
      whaleHoldingsPercentage: 85,
      retailHoldingsPercentage: 10,
      exchangeHoldingsPercentage: 5,
    };

    // Create spike price data
    const spikePriceData = {
      cryptoId: crypto.id,
      timestamp: now,
      price: (currentPrice.price || 45000) * 1.5,  // 50% price increase
      volume24h: (currentPrice.volume24h || 50000000000) * 8,  // 8x volume increase
      marketCap: (currentPrice.price || 45000) * 19000000 * 1.5,
      priceChange24h: 25.5,  // 25.5% increase
    };

    // Insert spike data
    await db.onChainMetric.create({
      data: spikeData
    });

    await db.priceHistory.create({
      data: spikePriceData
    });

    return NextResponse.json({
      message: 'Aggressive spike data created successfully',
      blockchain,
      currentValues: {
        activeAddresses: spikeData.activeAddresses,
        newAddresses: spikeData.newAddresses,
        dailyTransactions: spikeData.transactionVolume,
        transactionVolume: spikePriceData.volume24h,
        price: spikePriceData.price,
        priceChange: spikePriceData.priceChange24h,
      },
      increases: {
        activeAddresses: '8x increase',
        newAddresses: '6x increase',
        dailyTransactions: '10x increase',
        transactionVolume: '8x increase',
        price: '50% increase',
      },
      note: 'Refresh the dashboard to see spike alerts'
    });

  } catch (error) {
    console.error('Error creating aggressive spike data:', error);
    return NextResponse.json(
      { error: 'Failed to create aggressive spike data' },
      { status: 500 }
    );
  }
}