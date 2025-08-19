const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Mock DeFi data for testing
const mockDeFiData = {
  totalTVL: 150000000000, // $150B
  totalStablecoinMarketCap: 180000000000, // $180B
  totalDEXVolume24h: 5000000000, // $5B
  totalProtocolFees24h: 15000000, // $15M
  avgYieldRate: 5.5, // 5.5%
  totalBridgeVolume24h: 100000000, // $100M
  topChains: [
    { gecko_id: 'ethereum', name: 'Ethereum', tokenSymbol: 'ETH', tvl: 80000000000, change_1d: 2.5, change_7d: 5.2, change_30d: 12.8 },
    { gecko_id: 'binance-smart-chain', name: 'Binance Smart Chain', tokenSymbol: 'BNB', tvl: 35000000000, change_1d: 1.8, change_7d: 3.1, change_30d: 8.5 },
    { gecko_id: 'tron', name: 'Tron', tokenSymbol: 'TRX', tvl: 12000000000, change_1d: -0.5, change_7d: 2.1, change_30d: 15.2 },
    { gecko_id: 'arbitrum', name: 'Arbitrum', tokenSymbol: 'ARB', tvl: 9500000000, change_1d: 3.2, change_7d: 7.8, change_30d: 22.1 },
    { gecko_id: 'polygon', name: 'Polygon', tokenSymbol: 'MATIC', tvl: 8500000000, change_1d: 1.1, change_7d: -1.2, change_30d: 5.8 }
  ],
  topProtocols: [
    { name: 'Lido', slug: 'lido', tvl: 28000000000, change_1d: 1.5, change_7d: 4.2, change_30d: 8.9, category: 'Liquid Staking', chains: ['ethereum'] },
    { name: 'MakerDAO', slug: 'makerdao', tvl: 12500000000, change_1d: 0.8, change_7d: 2.1, change_30d: 6.7, category: 'Lending', chains: ['ethereum'] },
    { name: 'Aave', slug: 'aave', tvl: 11200000000, change_1d: 2.1, change_7d: 5.3, change_30d: 12.4, category: 'Lending', chains: ['ethereum', 'polygon'] },
    { name: 'Uniswap', slug: 'uniswap', tvl: 9800000000, change_1d: 3.2, change_7d: 6.8, change_30d: 18.2, category: 'DEX', chains: ['ethereum', 'arbitrum', 'polygon'] },
    { name: 'Curve Finance', slug: 'curve-finance', tvl: 8500000000, change_1d: 1.9, change_7d: 3.7, change_30d: 9.1, category: 'DEX', chains: ['ethereum', 'arbitrum'] }
  ],
  topStablecoins: [
    { id: 'tether', name: 'Tether', symbol: 'USDT', price: 1.0, marketCap: 120000000000, circulatingSupply: 120000000000, pegType: 'Fiat-backed', chains: ['ethereum', 'tron', 'solana'] },
    { id: 'usd-coin', name: 'USD Coin', symbol: 'USDC', price: 1.0, marketCap: 35000000000, circulatingSupply: 35000000000, pegType: 'Fiat-backed', chains: ['ethereum', 'solana', 'polygon'] },
    { id: 'binance-usd', name: 'Binance USD', symbol: 'BUSD', price: 1.0, marketCap: 8000000000, circulatingSupply: 8000000000, pegType: 'Fiat-backed', chains: ['binance-smart-chain'] },
    { id: 'dai', name: 'Dai', symbol: 'DAI', price: 1.0, marketCap: 5500000000, circulatingSupply: 5500000000, pegType: 'Crypto-collateralized', chains: ['ethereum'] },
    { id: 'true-usd', name: 'TrueUSD', symbol: 'TUSD', price: 1.0, marketCap: 3200000000, circulatingSupply: 3200000000, pegType: 'Fiat-backed', chains: ['ethereum', 'binance-smart-chain'] }
  ]
};

async function seedDeFiData() {
  try {
    console.log('🌱 Seeding DeFi data...');
    
    // Clear existing DeFi data
    await prisma.deFiMetric.deleteMany();
    console.log('🗑️  Cleared existing DeFi data');
    
    // Insert new DeFi data
    const defiMetrics = await prisma.deFiMetric.create({
      data: {
        totalTVL: mockDeFiData.totalTVL,
        totalStablecoinMarketCap: mockDeFiData.totalStablecoinMarketCap,
        totalDEXVolume24h: mockDeFiData.totalDEXVolume24h,
        totalProtocolFees24h: mockDeFiData.totalProtocolFees24h,
        avgYieldRate: mockDeFiData.avgYieldRate,
        totalBridgeVolume24h: mockDeFiData.totalBridgeVolume24h,
        topChains: JSON.stringify(mockDeFiData.topChains),
        topProtocols: JSON.stringify(mockDeFiData.topProtocols),
        topStablecoins: JSON.stringify(mockDeFiData.topStablecoins),
        timestamp: new Date()
      }
    });
    
    console.log('✅ DeFi data seeded successfully!');
    console.log(`📊 Total TVL: $${(mockDeFiData.totalTVL / 1e9).toFixed(2)}B`);
    console.log(`💰 Stablecoins Market Cap: $${(mockDeFiData.totalStablecoinMarketCap / 1e9).toFixed(2)}B`);
    console.log(`🔄 DEX Volume 24h: $${(mockDeFiData.totalDEXVolume24h / 1e6).toFixed(2)}M`);
    console.log(`🏆 Top chains: ${mockDeFiData.topChains.length}`);
    console.log(`🚀 Top protocols: ${mockDeFiData.topProtocols.length}`);
    console.log(`💵 Top stablecoins: ${mockDeFiData.topStablecoins.length}`);
    
  } catch (error) {
    console.error('❌ Error seeding DeFi data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDeFiData().catch(console.error);