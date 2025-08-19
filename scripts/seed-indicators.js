const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with indicator data...');

  // Get all cryptocurrencies
  const cryptocurrencies = await prisma.cryptocurrency.findMany();
  
  if (cryptocurrencies.length === 0) {
    console.log('❌ No cryptocurrencies found. Please seed the database first.');
    return;
  }

  console.log(`📊 Found ${cryptocurrencies.length} cryptocurrencies`);

  // Seed on-chain metrics for each cryptocurrency
  for (const crypto of cryptocurrencies) {
    console.log(`🔗 Seeding on-chain metrics for ${crypto.symbol}...`);
    
    const onChainData = {
      cryptoId: crypto.id,
      timestamp: new Date(),
      mvrv: 1.5 + Math.random() * 0.5,
      nupl: 0.5 + Math.random() * 0.3,
      sopr: 1.0 + Math.random() * 0.1,
      activeAddresses: Math.floor(100000 + Math.random() * 900000),
      exchangeInflow: Math.floor(5000 + Math.random() * 15000),
      exchangeOutflow: Math.floor(5000 + Math.random() * 15000),
      transactionVolume: Math.floor(10000000000 + Math.random() * 20000000000),
      whaleHoldingsPercentage: 35 + Math.random() * 20,
      retailHoldingsPercentage: 35 + Math.random() * 20,
      exchangeHoldingsPercentage: 8 + Math.random() * 8,
    };

    await prisma.onChainMetric.create({
      data: onChainData
    });
  }

  // Seed technical indicators for each cryptocurrency
  for (const crypto of cryptocurrencies) {
    console.log(`📈 Seeding technical indicators for ${crypto.symbol}...`);
    
    const basePrice = crypto.symbol === 'BTC' ? 116627 : 
                     crypto.symbol === 'ETH' ? 3895.84 :
                     crypto.symbol === 'BNB' ? 786.25 :
                     crypto.symbol === 'SOL' ? 175.62 : 500;
    
    const technicalData = {
      cryptoId: crypto.id,
      timestamp: new Date(),
      rsi: 45 + Math.random() * 30,
      ma50: basePrice * (0.95 + Math.random() * 0.1),
      ma200: basePrice * (0.9 + Math.random() * 0.2),
      macd: (Math.random() - 0.5) * basePrice * 0.02,
      bollingerUpper: basePrice * (1.05 + Math.random() * 0.05),
      bollingerLower: basePrice * (0.95 - Math.random() * 0.05),
      bollingerMiddle: basePrice
    };

    await prisma.technicalIndicator.create({
      data: technicalData
    });
  }

  // Seed derivative metrics for each cryptocurrency
  for (const crypto of cryptocurrencies) {
    console.log(`📊 Seeding derivative metrics for ${crypto.symbol}...`);
    
    const derivativeData = {
      cryptoId: crypto.id,
      timestamp: new Date(),
      openInterest: Math.floor(1000000000 + Math.random() * 9000000000),
      fundingRate: (Math.random() - 0.5) * 0.02,
      liquidationVolume: Math.floor(10000000 + Math.random() * 40000000),
      putCallRatio: 0.8 + Math.random() * 0.4
    };

    await prisma.derivativeMetric.create({
      data: derivativeData
    });
  }

  // Seed sentiment metrics
  console.log('😊 Seeding sentiment metrics...');
  await prisma.sentimentMetric.create({
    data: {
      timestamp: new Date(),
      fearGreedIndex: 45 + Math.random() * 20,
      socialSentiment: 0.5 + Math.random() * 0.3,
      googleTrends: 50 + Math.random() * 30,
      newsSentiment: 0.5 + Math.random() * 0.3
    }
  });

  console.log('✅ Database seeded successfully with indicator data!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });