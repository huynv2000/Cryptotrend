import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('Seeding database...');
    
    // Insert default cryptocurrencies
    const cryptocurrencies = [
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        coinGeckoId: 'bitcoin',
        rank: 1,
        isActive: true,
        isDefault: true
      },
      {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        coinGeckoId: 'ethereum',
        rank: 2,
        isActive: true,
        isDefault: true
      },
      {
        id: 'binancecoin',
        symbol: 'BNB',
        name: 'BNB',
        coinGeckoId: 'binancecoin',
        rank: 3,
        isActive: true,
        isDefault: true
      },
      {
        id: 'solana',
        symbol: 'SOL',
        name: 'Solana',
        coinGeckoId: 'solana',
        rank: 4,
        isActive: true,
        isDefault: true
      }
    ];
    
    for (const crypto of cryptocurrencies) {
      await prisma.cryptocurrency.upsert({
        where: { coinGeckoId: crypto.coinGeckoId },
        update: crypto,
        create: crypto
      });
    }
    
    // Insert sample price data for Bitcoin
    await prisma.priceHistory.upsert({
      where: { id: 'price-btc-1' },
      update: {},
      create: {
        id: 'price-btc-1',
        cryptoId: 'bitcoin',
        timestamp: new Date(),
        price: 118955,
        volume24h: 45234789234,
        marketCap: 2356789123456,
        priceChange24h: -2.04
      }
    });
    
    // Insert sample on-chain metrics for Bitcoin
    await prisma.onChainMetric.upsert({
      where: { id: 'onchain-btc-1' },
      update: {},
      create: {
        id: 'onchain-btc-1',
        cryptoId: 'bitcoin',
        timestamp: new Date(),
        mvrv: 1.8,
        nupl: 0.65,
        sopr: 1.02,
        activeAddresses: 950000,
        exchangeInflow: 15000,
        exchangeOutflow: 12000,
        transactionVolume: 25000000000,
        whaleHoldingsPercentage: 42.3,
        retailHoldingsPercentage: 38.7,
        exchangeHoldingsPercentage: 12.5
      }
    });
    
    // Insert sample technical indicators for Bitcoin
    await prisma.technicalIndicator.upsert({
      where: { id: 'technical-btc-1' },
      update: {},
      create: {
        id: 'technical-btc-1',
        cryptoId: 'bitcoin',
        timestamp: new Date(),
        rsi: 58.5,
        ma50: 119500,
        ma200: 115000,
        macd: 145.5,
        bollingerUpper: 124000,
        bollingerLower: 113000,
        bollingerMiddle: 118955
      }
    });
    
    // Insert sample sentiment data
    await prisma.sentimentMetric.upsert({
      where: { id: 'sentiment-btc-1' },
      update: {},
      create: {
        id: 'sentiment-btc-1',
        timestamp: new Date(),
        fearGreedIndex: 67,
        socialSentiment: 0.68,
        googleTrends: 78,
        newsSentiment: 0.62
      }
    });
    
    // Insert sample derivatives data for Bitcoin
    await prisma.derivativeMetric.upsert({
      where: { id: 'derivatives-btc-1' },
      update: {},
      create: {
        id: 'derivatives-btc-1',
        cryptoId: 'bitcoin',
        timestamp: new Date(),
        openInterest: 18500000000,
        fundingRate: 0.0125,
        liquidationVolume: 45000000,
        putCallRatio: 0.85
      }
    });
    
    console.log('Database seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });