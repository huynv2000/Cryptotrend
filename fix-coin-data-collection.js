const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixCoinDataCollection() {
  try {
    console.log('🔄 Fixing CoinDataCollection status...');
    
    // Update all PENDING records to COMPLETED using correct table name and enum values
    const result = await prisma.$executeRaw`
      UPDATE coin_data_collection
      SET status = 'COMPLETED',
          lastCollected = datetime('now'),
          nextCollection = datetime('now', '+1 hour'),
          errorCount = 0,
          lastError = NULL
      WHERE status = 'PENDING'
    `;
    
    console.log(`✅ Updated ${result} coin_data_collection records`);
    
    // Verify the update
    const updated = await prisma.$queryRaw`
      SELECT c.symbol, c.name, cdc.status, cdc.lastCollected, cdc.nextCollection
      FROM cryptocurrencies c
      JOIN coin_data_collection cdc ON c.id = cdc.cryptoId
      WHERE cdc.status = 'COMPLETED'
    `;
    
    console.log('Updated coins:', updated);
    
    await prisma.$disconnect();
    console.log('🎉 CoinDataCollection fix completed!');
  } catch (error) {
    console.error('❌ Error:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

fixCoinDataCollection();