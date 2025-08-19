const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDirectDB() {
  try {
    console.log('🧪 Testing direct database connection...');
    
    // Test the exact same query that was failing
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query result:', result);
    
    // Test with $executeRaw (this should fail)
    try {
      const executeResult = await prisma.$executeRaw`SELECT 1 as test`;
      console.log('❌ $executeRaw should have failed but got:', executeResult);
    } catch (executeError) {
      console.log('✅ $executeRaw correctly failed:', executeError.message);
    }
    
    // Test cryptocurrency count
    const cryptoCount = await prisma.cryptocurrency.count();
    console.log(`✅ Found ${cryptoCount} cryptocurrencies`);
    
    await prisma.$disconnect();
    console.log('🎉 Direct database test completed successfully!');
    
  } catch (error) {
    console.error('❌ Direct database test failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testDirectDB();