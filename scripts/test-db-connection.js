const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful:', result);
    
    // Test if we can query the cryptocurrency table
    const cryptoCount = await prisma.cryptocurrency.count();
    console.log(`✅ Found ${cryptoCount} cryptocurrencies in database`);
    
    // Test if we can query the price history table
    const priceCount = await prisma.priceHistory.count();
    console.log(`✅ Found ${priceCount} price records in database`);
    
    await prisma.$disconnect();
    console.log('🎉 All database tests passed!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testConnection();