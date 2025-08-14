const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== Database Data Check ===\n');
    
    // Check cryptocurrencies
    const cryptos = await prisma.cryptocurrency.findMany();
    console.log(`📊 Cryptocurrencies: ${cryptos.length} records`);
    cryptos.forEach(crypto => {
      console.log(`  - ${crypto.symbol} (${crypto.name}) - ID: ${crypto.coinGeckoId} - Active: ${crypto.isActive}`);
    });
    
    // Check price history
    const priceHistory = await prisma.priceHistory.findMany();
    console.log(`\n💰 Price History: ${priceHistory.length} records`);
    if (priceHistory.length > 0) {
      const latest = priceHistory[priceHistory.length - 1];
      console.log(`  - Latest: ${latest.price} USD at ${latest.timestamp}`);
    }
    
    // Check on-chain metrics
    const onChain = await prisma.onChainMetric.findMany();
    console.log(`\n⛓️ On-chain Metrics: ${onChain.length} records`);
    if (onChain.length > 0) {
      const latest = onChain[onChain.length - 1];
      console.log(`  - Latest MVRV: ${latest.mvrv}, NUPL: ${latest.nupl} at ${latest.timestamp}`);
    }
    
    // Check technical indicators
    const technical = await prisma.technicalIndicator.findMany();
    console.log(`\n📈 Technical Indicators: ${technical.length} records`);
    if (technical.length > 0) {
      const latest = technical[technical.length - 1];
      console.log(`  - Latest RSI: ${latest.rsi}, MACD: ${latest.macd} at ${latest.timestamp}`);
    }
    
    // Check sentiment metrics
    const sentiment = await prisma.sentimentMetric.findMany();
    console.log(`\n😊 Sentiment Metrics: ${sentiment.length} records`);
    if (sentiment.length > 0) {
      const latest = sentiment[sentiment.length - 1];
      console.log(`  - Latest Fear & Greed: ${latest.fearGreedIndex} at ${latest.timestamp}`);
    }
    
    // Check derivative metrics
    const derivatives = await prisma.derivativeMetric.findMany();
    console.log(`\n📊 Derivative Metrics: ${derivatives.length} records`);
    if (derivatives.length > 0) {
      const latest = derivatives[derivatives.length - 1];
      console.log(`  - Latest Funding Rate: ${latest.fundingRate} at ${latest.timestamp}`);
    }
    
    console.log('\n=== Data Summary ===');
    console.log(`Total records: ${cryptos.length + priceHistory.length + onChain.length + technical.length + sentiment.length + derivatives.length}`);
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();