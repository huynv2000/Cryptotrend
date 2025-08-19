const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    console.log('=== DATABASE DATA CHECK ===\n');
    
    // Check cryptocurrencies
    const cryptos = await prisma.cryptocurrency.findMany();
    console.log(`📊 Cryptocurrencies found: ${cryptos.length}`);
    cryptos.forEach(crypto => {
      console.log(`   - ${crypto.symbol} (${crypto.name}) - ID: ${crypto.id}`);
    });
    
    console.log('\n');
    
    // Check on-chain metrics
    const onChainCount = await prisma.onChainMetric.count();
    console.log(`⛓️ On-chain metrics records: ${onChainCount}`);
    
    if (onChainCount > 0) {
      const onChainData = await prisma.onChainMetric.findMany({
        include: { crypto: true },
        take: 5
      });
      console.log('   Latest on-chain records:');
      onChainData.forEach(record => {
        console.log(`   - ${record.crypto.symbol}: Active Addresses=${record.activeAddresses || 'NULL'}, MVRV=${record.mvrv || 'NULL'}`);
      });
    }
    
    console.log('\n');
    
    // Check price history
    const priceCount = await prisma.priceHistory.count();
    console.log(`💰 Price history records: ${priceCount}`);
    
    if (priceCount > 0) {
      const priceData = await prisma.priceHistory.findMany({
        include: { crypto: true },
        take: 5,
        orderBy: { timestamp: 'desc' }
      });
      console.log('   Latest price records:');
      priceData.forEach(record => {
        console.log(`   - ${record.crypto.symbol}: $${record.price?.toLocaleString() || 'NULL'}`);
      });
    }
    
    console.log('\n');
    
    // Check derivative metrics
    const derivativeCount = await prisma.derivativeMetric.count();
    console.log(`📊 Derivative metrics records: ${derivativeCount}`);
    
    // Check technical indicators
    const technicalCount = await prisma.technicalIndicator.count();
    console.log(`📈 Technical indicators records: ${technicalCount}`);
    
    console.log('\n=== ANALYSIS COMPLETE ===');
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();