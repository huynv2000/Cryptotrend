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

    // Get current price data for market cap calculations
    const currentPrice = await db.priceHistory.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    if (!currentPrice) {
      return NextResponse.json(
        { error: 'No price data found' },
        { status: 404 }
      );
    }

    const now = new Date();
    
    // Create TVL spike data with massive increases
    const tvlSpikeData = {
      cryptoId: crypto.id,
      timestamp: now,
      chainTVL: 50000000000, // $50B TVL (huge spike)
      tvlChange24h: 150.5, // 150.5% increase
      tvlChange7d: 220.3, // 220.3% increase
      tvlChange30d: 350.8, // 350.8% increase
      dominance: 25.5, // 25.5% dominance (spike)
      marketCapTVLRatio: 0.85, // 85% ratio (very high)
    };

    // Insert TVL spike data
    await db.tVLMetric.create({
      data: tvlSpikeData
    });

    return NextResponse.json({
      message: 'TVL spike data created successfully',
      blockchain,
      tvlData: {
        chainTVL: '$50B',
        tvlChange24h: '+150.5%',
        tvlChange7d: '+220.3%',
        tvlChange30d: '+350.8%',
        dominance: '25.5%',
        marketCapTVLRatio: '85%',
      },
      note: 'Refresh the dashboard to see TVL spike alerts'
    });

  } catch (error) {
    console.error('Error creating TVL spike data:', error);
    return NextResponse.json(
      { error: 'Failed to create TVL spike data' },
      { status: 500 }
    );
  }
}