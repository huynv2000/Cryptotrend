const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAndDeleteErrorCoins() {
  try {
    console.log('🔍 Checking for error coins in database...');
    
    // Get all coins with their data collection status
    const allCoins = await prisma.$queryRaw`
      SELECT 
        c.id,
        c.symbol,
        c.name,
        c.coinGeckoId,
        c.isActive,
        c.isDefault,
        cdc.status as collectionStatus,
        cdc.lastCollected,
        cdc.errorCount,
        cdc.lastError,
        c.createdAt
      FROM cryptocurrencies c
      LEFT JOIN coin_data_collection cdc ON c.id = cdc.cryptoId
      ORDER BY c.createdAt DESC
    `;
    
    console.log(`\n📊 Found ${allCoins.length} coins in database:`);
    console.log('='.repeat(80));
    
    // Display all coins
    allCoins.forEach((coin, index) => {
      const status = coin.collectionStatus || 'NO_DATA';
      const errorCount = coin.errorCount || 0;
      const isDefault = coin.isDefault ? 'YES' : 'NO';
      const isActive = coin.isActive ? 'YES' : 'NO';
      
      console.log(`${index + 1}. ${coin.symbol} (${coin.name})`);
      console.log(`   ID: ${coin.id}`);
      console.log(`   Status: ${status}`);
      console.log(`   Error Count: ${errorCount}`);
      console.log(`   Is Default: ${isDefault}`);
      console.log(`   Is Active: ${isActive}`);
      if (coin.lastError) {
        console.log(`   Last Error: ${coin.lastError}`);
      }
      console.log(`   Created: ${coin.createdAt}`);
      console.log('-'.repeat(40));
    });
    
    // Identify problematic coins
    const problematicCoins = allCoins.filter(coin => {
      const status = coin.collectionStatus;
      const errorCount = coin.errorCount || 0;
      const isDefault = coin.isDefault;
      
      // Criteria for problematic coins:
      // 1. Status is FAILED and errorCount > 0
      // 2. Status is PENDING for too long (older than 1 hour)
      // 3. Multiple consecutive failures
      // 4. NOT a default coin (we don't delete default coins)
      
      if (isDefault) return false;
      
      if (status === 'FAILED' && errorCount > 0) return true;
      
      if (status === 'PENDING') {
        const createdTime = new Date(coin.createdAt);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return createdTime < oneHourAgo;
      }
      
      return false;
    });
    
    console.log(`\n⚠️  Found ${problematicCoins.length} problematic coins:`);
    
    if (problematicCoins.length === 0) {
      console.log('✅ No problematic coins found!');
      await prisma.$disconnect();
      return;
    }
    
    problematicCoins.forEach((coin, index) => {
      console.log(`${index + 1}. ${coin.symbol} (${coin.name}) - Status: ${coin.collectionStatus}, Errors: ${coin.errorCount || 0}`);
    });
    
    console.log('\n🗑️  Preparing to delete problematic coins...');
    
    // Delete each problematic coin
    for (const coin of problematicCoins) {
      console.log(`\n🔄 Deleting coin: ${coin.symbol} (${coin.name})...`);
      
      try {
        // Delete related data collection record first
        await prisma.$executeRaw`DELETE FROM coin_data_collection WHERE cryptoId = ${coin.id}`;
        
        // Delete the cryptocurrency (cascade will handle related records)
        const deleteResult = await prisma.$executeRaw`DELETE FROM cryptocurrencies WHERE id = ${coin.id} AND isDefault = false`;
        
        console.log(`✅ Successfully deleted ${coin.symbol}`);
        
      } catch (error) {
        console.error(`❌ Failed to delete ${coin.symbol}:`, error.message);
      }
    }
    
    console.log('\n🎉 Cleanup completed!');
    
    // Verify cleanup
    console.log('\n🔍 Verifying cleanup results...');
    const remainingCoins = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM cryptocurrencies
    `;
    
    console.log(`📊 Remaining coins in database: ${remainingCoins[0].count}`);
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAndDeleteErrorCoins();