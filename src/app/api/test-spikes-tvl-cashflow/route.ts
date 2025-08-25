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

    const currentTVL = await db.tVLMetric.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    if (!currentOnChain || !currentPrice || !currentTVL) {
      return NextResponse.json(
        { error: 'Current data not found for creating test spikes' },
        { status: 404 }
      );
    }

    const now = new Date();

    // Create TVL spike data (5x-8x increases)
    const tvlSpikeData = {
      cryptoId: crypto.id,
      timestamp: now,
      chainTVL: (currentTVL.chainTVL || 1000000000) * 7, // 7x increase
      tvlChange24h: 150.5, // Massive 150% increase
      tvlChange7d: 280.3, // Massive 280% increase
      tvlChange30d: 450.7, // Massive 450% increase
      dominance: (currentTVL.dominance || 10) * 3, // 3x increase
      marketCapTVLRatio: (currentTVL.marketCapTVLRatio || 5) * 4, // 4x increase
    };

    // Create Cash Flow spike data
    const cashflowSpikeMultiplier = {
      bridgeFlows: 6,    // 6x increase
      exchangeFlows: 8,  // 8x increase
      stakingMetrics: 5, // 5x increase
      miningValidation: 10 // 10x increase (for Bitcoin)
    };

    const onChainSpikeData = {
      cryptoId: crypto.id,
      timestamp: now,
      activeAddresses: currentOnChain.activeAddresses,
      newAddresses: currentOnChain.newAddresses,
      transactionVolume: currentOnChain.transactionVolume,
      mvrv: currentOnChain.mvrv,
      nupl: currentOnChain.nupl,
      sopr: currentOnChain.sopr,
      exchangeInflow: (currentOnChain.exchangeInflow || 1000000000) * cashflowSpikeMultiplier.exchangeFlows,
      exchangeOutflow: (currentOnChain.exchangeOutflow || 1000000000) * cashflowSpikeMultiplier.exchangeFlows,
      supplyDistribution: currentOnChain.supplyDistribution,
      whaleHoldingsPercentage: currentOnChain.whaleHoldingsPercentage,
      retailHoldingsPercentage: currentOnChain.retailHoldingsPercentage,
      exchangeHoldingsPercentage: currentOnChain.exchangeHoldingsPercentage,
    };

    const priceSpikeData = {
      cryptoId: crypto.id,
      timestamp: now,
      price: currentPrice.price,
      volume24h: (currentPrice.volume24h || 10000000000) * cashflowSpikeMultiplier.bridgeFlows,
      marketCap: currentPrice.marketCap,
      priceChange24h: currentPrice.priceChange24h,
    };

    // Insert spike data
    await db.tVLMetric.create({
      data: tvlSpikeData
    });

    await db.onChainMetric.create({
      data: onChainSpikeData
    });

    await db.priceHistory.create({
      data: priceSpikeData
    });

    return NextResponse.json({
      message: 'TVL and Cash Flow spike data created successfully',
      blockchain,
      tvlSpikes: {
        chainTVL: '7x increase',
        tvlChange24h: '150.5% increase',
        tvlChange7d: '280.3% increase',
        tvlChange30d: '450.7% increase',
        dominance: '3x increase',
        marketCapTVLRatio: '4x increase',
      },
      cashflowSpikes: {
        bridgeFlows: '6x increase',
        exchangeFlows: '8x increase',
        stakingMetrics: '5x increase',
        miningValidation: '10x increase',
      },
      note: 'Refresh the dashboard to see spike alerts in TVL and Cash Flow sections'
    });

  } catch (error) {
    console.error('Error creating TVL and Cash Flow spike data:', error);
    return NextResponse.json(
      { error: 'Failed to create TVL and Cash Flow spike data' },
      { status: 500 }
    );
  }
}