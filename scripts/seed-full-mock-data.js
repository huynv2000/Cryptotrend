/**
 * Comprehensive Mock Data Seeder for Blockchain Dashboard
 * Uses Prisma client properly
 * 
 * @author Financial Systems Expert
 * @version 2.0
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Utility functions
function generateRealisticPrice(basePrice, volatility = 0.02) {
  const change = (Math.random() - 0.5) * 2 * volatility;
  return basePrice * (1 + change);
}

function generateRealisticVolume(baseVolume, volatility = 0.15) {
  const change = (Math.random() - 0.5) * 2 * volatility;
  return Math.max(0, baseVolume * (1 + change));
}

// Cryptocurrency configurations
const cryptocurrencies = [
  {
    id: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    coinGeckoId: 'bitcoin',
    rank: 1,
    basePrice: 45000,
    baseVolume: 25000000000,
    baseActiveAddresses: 950000,
    baseTransactions: 650000,
    baseTVL: 850000000000
  },
  {
    id: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    coinGeckoId: 'ethereum',
    rank: 2,
    basePrice: 2800,
    baseVolume: 15000000000,
    baseActiveAddresses: 450000,
    baseTransactions: 1200000,
    baseTVL: 450000000000
  },
  {
    id: 'binancecoin',
    symbol: 'BNB',
    name: 'BNB',
    coinGeckoId: 'binancecoin',
    rank: 3,
    basePrice: 320,
    baseVolume: 800000000,
    baseActiveAddresses: 120000,
    baseTransactions: 350000,
    baseTVL: 120000000000
  },
  {
    id: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    coinGeckoId: 'solana',
    rank: 4,
    basePrice: 95,
    baseVolume: 600000000,
    baseActiveAddresses: 85000,
    baseTransactions: 850000,
    baseTVL: 55000000000
  }
];

const daysBack = 90; // Generate 90 days of historical data for comprehensive analysis

async function main() {
  try {
    console.log('🚀 Starting comprehensive mock data seeding...');
    
    await prisma.$connect();
    console.log('✅ Connected to database');
    
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    try {
      await prisma.$executeRaw`DELETE FROM analysis_history`;
      await prisma.$executeRaw`DELETE FROM analysis`;
      await prisma.$executeRaw`DELETE FROM alerts`;
      await prisma.$executeRaw`DELETE FROM portfolio`;
      await prisma.$executeRaw`DELETE FROM watchlist`;
      await prisma.$executeRaw`DELETE FROM price_history`;
      await prisma.$executeRaw`DELETE FROM volume_history`;
      await prisma.$executeRaw`DELETE FROM on_chain_metrics`;
      await prisma.$executeRaw`DELETE FROM technical_indicators`;
      await prisma.$executeRaw`DELETE FROM derivative_metrics`;
      await prisma.$executeRaw`DELETE FROM sentiment_metrics`;
      await prisma.$executeRaw`DELETE FROM tvl_metrics`;
      await prisma.$executeRaw`DELETE FROM advanced_tvl_metrics`;
      await prisma.$executeRaw`DELETE FROM enhanced_tvl_metrics`;
      await prisma.$executeRaw`DELETE FROM staking_metrics`;
      await prisma.$executeRaw`DELETE FROM coin_data_collection`;
      console.log('✅ Cleared existing data');
    } catch (error) {
      console.log('ℹ️  Some tables may not exist or are already empty');
    }
    
    // Insert cryptocurrencies
    console.log('💰 Inserting cryptocurrencies...');
    for (const crypto of cryptocurrencies) {
      await prisma.cryptocurrency.upsert({
        where: { id: crypto.id },
        update: {},
        create: {
          id: crypto.id,
          symbol: crypto.symbol,
          name: crypto.name,
          coinGeckoId: crypto.coinGeckoId,
          rank: crypto.rank,
          isActive: true,
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }
    console.log('✅ Inserted cryptocurrencies');
    
    // Generate historical data for each cryptocurrency
    for (const crypto of cryptocurrencies) {
      console.log(`📊 Generating data for ${crypto.name} (${crypto.symbol})...`);
      
      for (let day = daysBack; day >= 0; day--) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        date.setHours(0, 0, 0, 0);
        
        // Generate realistic price progression with different patterns for different timeframes
        let priceTrend;
        if (day >= 60) { // Last 30 days - strong growth
          priceTrend = Math.sin((day - 60) / 5) * 0.15 + 0.2 + (Math.random() - 0.5) * 0.05;
        } else if (day >= 30) { // Middle 30 days - moderate growth
          priceTrend = Math.sin((day - 30) / 8) * 0.08 + 0.1 + (Math.random() - 0.5) * 0.04;
        } else { // First 30 days - volatile with slight decline
          priceTrend = Math.sin(day / 6) * 0.12 - 0.05 + (Math.random() - 0.5) * 0.06;
        }
        
        const price = crypto.basePrice * (1 + priceTrend);
        const realisticPrice = generateRealisticPrice(price, 0.03);
        
        // Generate volume with different patterns
        let volumeMultiplier;
        if (day >= 60) { // Last 30 days - high volume
          volumeMultiplier = 1.3 + priceTrend * 2 + (Math.random() - 0.5) * 0.3;
        } else if (day >= 30) { // Middle 30 days - medium volume
          volumeMultiplier = 1.1 + priceTrend * 1.5 + (Math.random() - 0.5) * 0.25;
        } else { // First 30 days - lower volume
          volumeMultiplier = 0.8 + priceTrend + (Math.random() - 0.5) * 0.2;
        }
        
        const volume = crypto.baseVolume * volumeMultiplier;
        const realisticVolume = generateRealisticVolume(volume, 0.2);
        
        // Generate on-chain metrics with timeframe-based patterns
        let addressMultiplier, transactionMultiplier, tvlMultiplier;
        if (day >= 60) { // Last 30 days - growth phase
          addressMultiplier = 1.1 + (Math.random() - 0.5) * 0.1;
          transactionMultiplier = 1.2 + (Math.random() - 0.5) * 0.15;
          tvlMultiplier = 1.25 + priceTrend * 1.5 + (Math.random() - 0.5) * 0.1;
        } else if (day >= 30) { // Middle 30 days - stable growth
          addressMultiplier = 1.05 + (Math.random() - 0.5) * 0.08;
          transactionMultiplier = 1.1 + (Math.random() - 0.5) * 0.1;
          tvlMultiplier = 1.1 + priceTrend * 1.2 + (Math.random() - 0.5) * 0.08;
        } else { // First 30 days - consolidation
          addressMultiplier = 0.95 + (Math.random() - 0.5) * 0.12;
          transactionMultiplier = 0.9 + (Math.random() - 0.5) * 0.15;
          tvlMultiplier = 0.9 + priceTrend + (Math.random() - 0.5) * 0.12;
        }
        
        const activeAddresses = Math.floor(crypto.baseActiveAddresses * addressMultiplier);
        const transactions = Math.floor(crypto.baseTransactions * transactionMultiplier);
        const tvl = crypto.baseTVL * tvlMultiplier;
        
        // Insert volume history
        await prisma.volumeHistory.upsert({
          where: { 
            cryptoId_timestamp: {
              cryptoId: crypto.id,
              timestamp: date
            }
          },
          update: {},
          create: {
            cryptoId: crypto.id,
            timestamp: date,
            dailyVolume: realisticVolume,
            price: realisticPrice,
            volumeChange24h: (Math.random() - 0.5) * 20,
            volumeAvg30d: realisticVolume * (0.9 + Math.random() * 0.2),
            volumeVsAvg: (Math.random() - 0.5) * 40
          }
        });
        
        // Insert price history
        await prisma.priceHistory.upsert({
          where: { 
            cryptoId_timestamp: {
              cryptoId: crypto.id,
              timestamp: date
            }
          },
          update: {},
          create: {
            cryptoId: crypto.id,
            timestamp: date,
            price: realisticPrice,
            volume24h: realisticVolume,
            marketCap: realisticPrice * 19000000,
            priceChange24h: (Math.random() - 0.5) * 10
          }
        });
        
        // Insert on-chain metrics
        await prisma.onChainMetric.upsert({
          where: { 
            cryptoId_timestamp: {
              cryptoId: crypto.id,
              timestamp: date
            }
          },
          update: {},
          create: {
            id: `onchain-${crypto.id}-${day}`,
            cryptoId: crypto.id,
            timestamp: date,
            mvrv: 1.5 + Math.random() * 2,
            nupl: (Math.random() - 0.5) * 0.8,
            sopr: 0.8 + Math.random() * 0.4,
            activeAddresses: activeAddresses,
            newAddresses: Math.floor(activeAddresses * 0.05 + Math.random() * activeAddresses * 0.1),
            exchangeInflow: realisticVolume * 0.02 + Math.random() * realisticVolume * 0.01,
            exchangeOutflow: realisticVolume * 0.015 + Math.random() * realisticVolume * 0.008,
            transactionVolume: realisticVolume * 0.8 + Math.random() * realisticVolume * 0.4,
            whaleHoldingsPercentage: 35 + Math.random() * 20,
            retailHoldingsPercentage: 45 + Math.random() * 15,
            exchangeHoldingsPercentage: 8 + Math.random() * 7
          }
        });
        
        // Insert technical indicators
        await prisma.technicalIndicator.upsert({
          where: { 
            cryptoId_timestamp: {
              cryptoId: crypto.id,
              timestamp: date
            }
          },
          update: {},
          create: {
            id: `technical-${crypto.id}-${day}`,
            cryptoId: crypto.id,
            timestamp: date,
            rsi: 30 + Math.random() * 40,
            ma50: realisticPrice * (0.95 + Math.random() * 0.1),
            ma200: realisticPrice * (0.85 + Math.random() * 0.3),
            macd: (Math.random() - 0.5) * 1000,
            bollingerUpper: realisticPrice * 1.05,
            bollingerLower: realisticPrice * 0.95,
            bollingerMiddle: realisticPrice
          }
        });
        
        // Insert TVL metrics
        await prisma.tVLMetric.upsert({
          where: { 
            cryptoId_timestamp: {
              cryptoId: crypto.id,
              timestamp: date
            }
          },
          update: {},
          create: {
            id: `tvl-${crypto.id}-${day}`,
            cryptoId: crypto.id,
            timestamp: date,
            totalTVL: tvl,
            chainTVL: tvl,
            tvlChange24h: (Math.random() - 0.4) * 8,
            tvlChange7d: (Math.random() - 0.3) * 15,
            tvlChange30d: (Math.random() - 0.2) * 25,
            dominance: crypto.rank === 1 ? 45 + Math.random() * 10 : 
                     crypto.rank === 2 ? 25 + Math.random() * 8 : 
                     crypto.rank === 3 ? 8 + Math.random() * 4 : 
                     3 + Math.random() * 2,
            marketCapTVLRatio: 0.6 + Math.random() * 0.4,
            confidence: 0.85 + Math.random() * 0.1
          }
        });
        
        // Insert advanced TVL metrics
        await prisma.advancedTVLMetric.upsert({
          where: { 
            cryptoId_timestamp: {
              cryptoId: crypto.id,
              timestamp: date
            }
          },
          update: {},
          create: {
            id: `advanced-tvl-${crypto.id}-${day}`,
            cryptoId: crypto.id,
            timestamp: date,
            tvlVelocity: 0.8 + Math.random() * 0.4,
            volumeToTVLRatio: 0.05 + Math.random() * 0.1,
            turnoverRate: 2 + Math.random() * 8,
            avgHoldingPeriod: 30 + Math.random() * 60,
            liquidityEfficiency: 60 + Math.random() * 30,
            feeToTVLRatio: 0.5 + Math.random() * 2,
            revenueToTVLRatio: 1 + Math.random() * 3,
            roi: (Math.random() - 0.3) * 20,
            capitalEfficiency: 65 + Math.random() * 25,
            protocolYield: 2 + Math.random() * 8,
            economicOutput: tvl * 0.03,
            combinedScore: 65 + Math.random() * 25,
            marketHealth: Math.random() > 0.7 ? 'excellent' : Math.random() > 0.4 ? 'good' : 'fair'
          }
        });
        
        // Insert enhanced TVL metrics
        await prisma.enhancedTVLMetric.upsert({
          where: { 
            cryptoId_timestamp: {
              cryptoId: crypto.id,
              timestamp: date
            }
          },
          update: {},
          create: {
            id: `enhanced-tvl-${crypto.id}-${day}`,
            cryptoId: crypto.id,
            timestamp: date,
            concentrationRisk: 15 + Math.random() * 25,
            herfindahlIndex: 0.15 + Math.random() * 0.25,
            topProtocolDominance: 25 + Math.random() * 20,
            top3ProtocolDominance: 45 + Math.random() * 15,
            top5ProtocolDominance: 60 + Math.random() * 20,
            protocolDiversity: 65 + Math.random() * 25,
            concentrationLevel: Math.random() > 0.6 ? 'MEDIUM' : Math.random() > 0.3 ? 'LOW' : 'HIGH',
            sustainabilityScore: 65 + Math.random() * 25,
            sustainabilityLevel: Math.random() > 0.7 ? 'GOOD' : Math.random() > 0.4 ? 'EXCELLENT' : 'FAIR',
            overallTVLHealth: 70 + Math.random() * 20
          }
        });
        
        // Insert staking metrics for applicable cryptos
        if (crypto.id === 'ethereum' || crypto.id === 'solana') {
          await prisma.stakingMetric.upsert({
            where: { 
              cryptoId_timestamp: {
                cryptoId: crypto.id,
                timestamp: date
              }
            },
            update: {},
            create: {
              id: `staking-${crypto.id}-${day}`,
              cryptoId: crypto.id,
              timestamp: date,
              totalStaked: tvl * 0.7,
              stakingRate: 70 + Math.random() * 15,
              stakingAPR: 3.5 + Math.random() * 2,
              stakingAPY: 3.8 + Math.random() * 2.2,
              rewards24h: tvl * 0.00008,
              totalValidators: crypto.id === 'ethereum' ? 800000 + Math.random() * 50000 : 
                               crypto.id === 'solana' ? 2500 + Math.random() * 500 : 0,
              activeValidators: crypto.id === 'ethereum' ? 750000 + Math.random() * 40000 : 
                               crypto.id === 'solana' ? 2300 + Math.random() * 400 : 0,
              minimumStake: crypto.id === 'ethereum' ? 32 : crypto.id === 'solana' ? 0.5 : 0,
              averageStake: crypto.id === 'ethereum' ? 45 + Math.random() * 15 : 
                            crypto.id === 'solana' ? 3500 + Math.random() * 1000 : 0
            }
          });
        }
        
        // Insert derivative metrics
        await prisma.derivativeMetric.upsert({
          where: { 
            cryptoId_timestamp: {
              cryptoId: crypto.id,
              timestamp: date
            }
          },
          update: {},
          create: {
            id: `derivative-${crypto.id}-${day}`,
            cryptoId: crypto.id,
            timestamp: date,
            openInterest: realisticVolume * 2.5 + Math.random() * realisticVolume,
            fundingRate: (Math.random() - 0.5) * 0.02,
            liquidationVolume: realisticVolume * 0.1 + Math.random() * realisticVolume * 0.05,
            putCallRatio: 0.8 + Math.random() * 0.4
          }
        });
        
        // Insert sentiment metrics (only for Bitcoin to avoid duplicates)
        if (crypto.id === 'bitcoin') {
          await prisma.sentimentMetric.upsert({
            where: { timestamp: date },
            update: {},
            create: {
              id: `sentiment-${day}`,
              timestamp: date,
              fearGreedIndex: 40 + Math.random() * 40,
              socialSentiment: 0.4 + Math.random() * 0.4,
              googleTrends: 50 + Math.random() * 40,
              newsSentiment: 0.45 + Math.random() * 0.35
            }
          });
        }
        
        // Insert AI analysis history
        const signals = ['BUY', 'SELL', 'HOLD', 'STRONG_BUY', 'STRONG_SELL'];
        const signal = signals[Math.floor(Math.random() * signals.length)];
        
        await prisma.analysisHistory.upsert({
          where: { id: `analysis-${crypto.id}-${day}` },
          update: {},
          create: {
            id: `analysis-${crypto.id}-${day}`,
            cryptoId: crypto.id,
            coinId: crypto.coinGeckoId,
            signal: signal,
            confidence: 60 + Math.random() * 30,
            reasoning: `Market analysis shows ${signal.toLowerCase()} signal based on technical indicators and on-chain metrics`,
            riskLevel: Math.random() > 0.6 ? 'MEDIUM' : Math.random() > 0.3 ? 'LOW' : 'HIGH',
            aiModel: 'EnhancedAI-v2.0',
            analysisType: 'AI_ENHANCED',
            analysisData: {
              technicalScore: 50 + Math.random() * 40,
              onChainScore: 45 + Math.random() * 35,
              marketScore: 55 + Math.random() * 30,
              overallScore: 50 + Math.random() * 35
            },
            timestamp: date
          }
        });
      }
      
      console.log(`✅ Generated ${daysBack} days of data for ${crypto.name}`);
    }
    
    // Create data collection status
    console.log('📡 Creating data collection status...');
    for (const crypto of cryptocurrencies) {
      await prisma.coinDataCollection.upsert({
        where: { cryptoId: crypto.id },
        update: {},
        create: {
          id: `collection-${crypto.id}`,
          cryptoId: crypto.id,
          status: 'COMPLETED',
          lastCollected: new Date(),
          nextCollection: new Date(Date.now() + 5 * 60 * 1000),
          errorCount: 0,
          metadata: {
            lastSync: new Date().toISOString(),
            dataPoints: daysBack,
            quality: 'high',
            source: 'mock_data_seeder'
          }
        }
      });
    }
    
    console.log('🎉 Comprehensive mock data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Cryptocurrencies: ${cryptocurrencies.length}`);
    console.log(`   - Historical days: ${daysBack}`);
    console.log(`   - Total records: ~${cryptocurrencies.length * daysBack * 10}`);
    
  } catch (error) {
    console.error('❌ Error seeding comprehensive data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => {
    console.log('✅ Database seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  });