import { db } from '../src/lib/db';

interface TVLHistoryPoint {
  date: string;
  tvl: number;
  dominance?: number;
}

async function populateTVLHistory() {
  try {
    console.log('Starting TVL history population...');

    // Get all cryptocurrencies
    const cryptos = await db.cryptocurrency.findMany({
      where: { isActive: true }
    });

    console.log(`Found ${cryptos.length} cryptocurrencies`);

    for (const crypto of cryptos) {
      console.log(`Processing ${crypto.symbol} (${crypto.coinGeckoId})...`);

      // Get existing TVL metric
      const existingTVL = await db.tVLMetric.findFirst({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' }
      });

      if (!existingTVL) {
        console.log(`No TVL data found for ${crypto.symbol}, skipping...`);
        continue;
      }

      // Generate sample historical data for the last 30 days
      const historicalData: TVLHistoryPoint[] = [];
      const baseTVL = existingTVL.chainTVL || 1000000000; // Use existing TVL as base

      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Add some realistic variation to the TVL values
        const variation = 0.95 + Math.random() * 0.1; // ±5% variation
        const trend = i < 15 ? 1 + (i * 0.002) : 1 - ((i - 15) * 0.001); // Slight trend
        const tvl = Math.round(baseTVL * variation * trend);
        
        // Calculate dominance (sample data)
        const dominance = 40 + Math.random() * 20; // 40-60% range
        
        historicalData.push({
          date: (date.toISOString().split('T')[0] as string), // Format as YYYY-MM-DD
          tvl,
          dominance
        });
      }

      // Update the TVL metric with historical data
      await db.tVLMetric.update({
        where: { id: existingTVL.id },
        data: {
          tvlHistory: JSON.stringify(historicalData),
          lastUpdated: new Date()
        }
      });

      console.log(`✅ Populated ${historicalData.length} days of TVL history for ${crypto.symbol}`);
    }

    console.log('🎉 TVL history population completed successfully!');

  } catch (error) {
    console.error('❌ Error populating TVL history:', error);
  } finally {
    await db.$disconnect();
  }
}

// Run the population
populateTVLHistory();