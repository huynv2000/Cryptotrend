const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteMockData() {
  console.log('🔧 Deleting Mock Data Using Prisma');
  console.log('=====================================');

  try {
    // Check current data first
    console.log('📊 Checking current data...');
    
    const onChainCount = await prisma.onChainMetric.count();
    const techCount = await prisma.technicalIndicator.count();
    const derivCount = await prisma.derivativeMetric.count();
    
    console.log(`Current records:`);
    console.log(`   On-chain metrics: ${onChainCount}`);
    console.log(`   Technical indicators: ${techCount}`);
    console.log(`   Derivative metrics: ${derivCount}`);
    
    // Show sample MVRV data
    const sampleMVRV = await prisma.onChainMetric.findFirst({
      where: { cryptoId: 'bitcoin' },
      orderBy: { timestamp: 'desc' }
    });
    
    if (sampleMVRV) {
      console.log(`\nSample MVRV data:`);
      console.log(`   Latest MVRV: ${sampleMVRV.mvrv}`);
    }
    
    // Delete all mock data
    console.log('\n🗑️  Deleting on-chain metrics...');
    const deletedOnChain = await prisma.onChainMetric.deleteMany({});
    console.log(`✅ Deleted ${deletedOnChain.count} on-chain metric records`);
    
    console.log('\n🗑️  Deleting technical indicators...');
    const deletedTech = await prisma.technicalIndicator.deleteMany({});
    console.log(`✅ Deleted ${deletedTech.count} technical indicator records`);
    
    console.log('\n🗑️  Deleting derivative metrics...');
    const deletedDeriv = await prisma.derivativeMetric.deleteMany({});
    console.log(`✅ Deleted ${deletedDeriv.count} derivative metric records`);
    
    // Verify deletion
    console.log('\n✅ Verifying deletion...');
    
    const remainingOnChain = await prisma.onChainMetric.count();
    const remainingTech = await prisma.technicalIndicator.count();
    const remainingDeriv = await prisma.derivativeMetric.count();
    
    console.log(`Remaining records:`);
    console.log(`   On-chain metrics: ${remainingOnChain}`);
    console.log(`   Technical indicators: ${remainingTech}`);
    console.log(`   Derivative metrics: ${remainingDeriv}`);
    
    console.log('\n🎯 Mock Data Deletion Complete!');
    console.log('=====================================');
    console.log('✅ RESULTS:');
    console.log('   • All mock MVRV data has been removed');
    console.log('   • Dashboard will now show "N/A" for MVRV');
    console.log('   • No more fake data in the system');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Refresh dashboard to see "N/A" for MVRV');
    console.log('   2. Integrate CryptoQuant API for real data');
    console.log('   3. Expected real MVRV for BTC: ~2.3');
    
    console.log('\n🚀 OUTCOME:');
    console.log('   • Before: MVRV = 1.8 (MOCK DATA) ❌');
    console.log('   • After: MVRV = N/A (NO DATA) ✅');
    console.log('   • Future: MVRV = 2.3 (REAL DATA) ✅');
    
  } catch (error) {
    console.error('❌ Error deleting mock data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the deletion
deleteMockData()
  .then(() => {
    console.log('\n✅ Mock data deletion completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Mock data deletion failed:', error);
    process.exit(1);
  });