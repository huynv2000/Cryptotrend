/**
 * Timeframe Data Verification Script
 * Verifies that the dashboard has different growth patterns for 7D, 30D, and 90D periods
 * 
 * @author Financial Systems Expert
 * @version 1.0
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyTimeframeData() {
  try {
    console.log('🔍 Verifying timeframe data patterns...');
    
    const cryptocurrencies = ['bitcoin', 'ethereum', 'binancecoin', 'solana'];
    
    for (const cryptoId of cryptocurrencies) {
      console.log(`\n📊 Analyzing ${cryptoId.toUpperCase()}...`);
      
      // Get cryptocurrency info
      const crypto = await prisma.cryptocurrency.findFirst({
        where: { coinGeckoId: cryptoId }
      });
      
      if (!crypto) {
        console.log(`❌ Cryptocurrency ${cryptoId} not found`);
        continue;
      }
      
      // Get price data for different timeframes
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      
      // Get 7D data
      const priceData7D = await prisma.priceHistory.findMany({
        where: {
          cryptoId: crypto.id,
          timestamp: {
            gte: sevenDaysAgo
          }
        },
        orderBy: { timestamp: 'asc' }
      });
      
      // Get 30D data
      const priceData30D = await prisma.priceHistory.findMany({
        where: {
          cryptoId: crypto.id,
          timestamp: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: { timestamp: 'asc' }
      });
      
      // Get 90D data
      const priceData90D = await prisma.priceHistory.findMany({
        where: {
          cryptoId: crypto.id,
          timestamp: {
            gte: ninetyDaysAgo
          }
        },
        orderBy: { timestamp: 'asc' }
      });
      
      // Calculate growth patterns
      const calculateGrowth = (data) => {
        if (data.length < 2) return 0;
        const firstPrice = data[0].price;
        const lastPrice = data[data.length - 1].price;
        return ((lastPrice - firstPrice) / firstPrice) * 100;
      };
      
      const growth7D = calculateGrowth(priceData7D);
      const growth30D = calculateGrowth(priceData30D);
      const growth90D = calculateGrowth(priceData90D);
      
      console.log(`   📈 7D Growth: ${growth7D.toFixed(2)}%`);
      console.log(`   📈 30D Growth: ${growth30D.toFixed(2)}%`);
      console.log(`   📈 90D Growth: ${growth90D.toFixed(2)}%`);
      
      // Verify different growth patterns
      const growthPatternsDifferent = 
        Math.abs(growth7D - growth30D) > 5 || 
        Math.abs(growth30D - growth90D) > 5 ||
        Math.abs(growth7D - growth90D) > 5;
      
      if (growthPatternsDifferent) {
        console.log(`   ✅ Different growth patterns detected`);
      } else {
        console.log(`   ⚠️  Similar growth patterns - may need more variation`);
      }
      
      // Check volume data
      const volumeData7D = await prisma.volumeHistory.findMany({
        where: {
          cryptoId: crypto.id,
          timestamp: {
            gte: sevenDaysAgo
          }
        },
        orderBy: { timestamp: 'asc' }
      });
      
      const volumeData30D = await prisma.volumeHistory.findMany({
        where: {
          cryptoId: crypto.id,
          timestamp: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: { timestamp: 'asc' }
      });
      
      const avgVolume7D = volumeData7D.reduce((sum, d) => sum + d.dailyVolume, 0) / volumeData7D.length;
      const avgVolume30D = volumeData30D.reduce((sum, d) => sum + d.dailyVolume, 0) / volumeData30D.length;
      
      console.log(`   📊 Avg Volume 7D: $${(avgVolume7D / 1000000000).toFixed(2)}B`);
      console.log(`   📊 Avg Volume 30D: $${(avgVolume30D / 1000000000).toFixed(2)}B`);
      
      // Check on-chain metrics
      const onChainData = await prisma.onChainMetric.findMany({
        where: {
          cryptoId: crypto.id,
          timestamp: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: { timestamp: 'asc' }
      });
      
      if (onChainData.length > 0) {
        const avgActiveAddresses = onChainData.reduce((sum, d) => sum + (d.activeAddresses || 0), 0) / onChainData.length;
        console.log(`   👥 Avg Active Addresses: ${avgActiveAddresses.toFixed(0)}`);
      }
      
      // Check TVL metrics
      const tvlData = await prisma.tVLMetric.findMany({
        where: {
          cryptoId: crypto.id,
          timestamp: {
            gte: thirtyDaysAgo
          }
        },
        orderBy: { timestamp: 'asc' }
      });
      
      if (tvlData.length > 0) {
        const latestTVL = tvlData[tvlData.length - 1];
        console.log(`   💰 Latest TVL: $${(latestTVL.totalTVL / 1000000000).toFixed(2)}B`);
      }
      
      console.log(`   📝 Data points: ${priceData90D.length} price, ${volumeData30D.length} volume`);
    }
    
    console.log('\n🎉 Timeframe data verification completed!');
    
    // Test dashboard API for different timeframes
    console.log('\n🌐 Testing dashboard API endpoints...');
    
    const testDashboardAPI = async (coinId) => {
      try {
        const response = await fetch(`http://localhost:3000/api/dashboard?coinId=${coinId}`);
        if (response.ok) {
          const data = await response.json();
          console.log(`   ✅ ${coinId}: Dashboard API working`);
          console.log(`      💰 Price: $${data.price?.usd?.toFixed(2)}`);
          console.log(`      📊 Market Cap: $${(data.price?.usd_market_cap / 1000000000).toFixed(2)}B`);
          console.log(`      👥 Active Addresses: ${data.onChain?.activeAddresses?.toLocaleString()}`);
        } else {
          console.log(`   ❌ ${coinId}: Dashboard API failed`);
        }
      } catch (error) {
        console.log(`   ❌ ${coinId}: Dashboard API error - ${error.message}`);
      }
    };
    
    await Promise.all(cryptocurrencies.map(testDashboardAPI));
    
  } catch (error) {
    console.error('❌ Error verifying timeframe data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyTimeframeData()
  .then(() => {
    console.log('✅ Timeframe data verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Timeframe data verification failed:', error);
    process.exit(1);
  });