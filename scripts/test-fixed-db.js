const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFixedDatabase() {
  console.log('🧪 Testing fixed database connectivity...');
  
  try {
    // Test the fixed query method
    console.log('Testing $queryRaw (fixed method)...');
    const result1 = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ $queryRaw successful:', result1);
    
    // Test the old broken method to confirm it fails
    console.log('Testing $executeRaw (broken method)...');
    try {
      const result2 = await prisma.$executeRaw`SELECT 1 as test`;
      console.log('❌ $executeRaw should have failed but returned:', result2);
    } catch (executeError) {
      console.log('✅ $executeRaw correctly failed:', executeError.message);
    }
    
    // Test actual database queries
    console.log('Testing actual cryptocurrency query...');
    const cryptoCount = await prisma.cryptocurrency.count();
    console.log(`✅ Found ${cryptoCount} cryptocurrencies`);
    
    console.log('Testing actual price history query...');
    const priceCount = await prisma.priceHistory.count();
    console.log(`✅ Found ${priceCount} price records`);
    
    await prisma.$disconnect();
    console.log('🎉 All database tests passed - fix is working!');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testFixedDatabase();