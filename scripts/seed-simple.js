/**
 * Simple Database Seeder
 * Uses Prisma client directly
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🚀 Starting simple database seeding...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Insert a simple test record
    const crypto = await prisma.cryptocurrency.upsert({
      where: { id: 'bitcoin' },
      update: {},
      create: {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        coinGeckoId: 'bitcoin',
        rank: 1,
        isActive: true,
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log('✅ Inserted Bitcoin cryptocurrency');
    
    // Insert price history
    const price = await prisma.priceHistory.create({
      data: {
        id: 'price-btc-test',
        cryptoId: 'bitcoin',
        timestamp: new Date(),
        price: 45000,
        volume24h: 25000000000,
        marketCap: 850000000000,
        priceChange24h: 2.5
      }
    });
    
    console.log('✅ Inserted price history');
    
    console.log('🎉 Simple seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();