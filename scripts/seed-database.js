const { db } = require('../src/lib/db');

async function seedDatabase() {
  try {
    console.log('Seeding database...');
    
    // Insert default cryptocurrencies
    const cryptocurrencies = [
      {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        coinGeckoId: 'bitcoin',
        rank: 1,
        isActive: true,
        isDefault: true
      },
      {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        coinGeckoId: 'ethereum',
        rank: 2,
        isActive: true,
        isDefault: true
      },
      {
        id: 'binancecoin',
        symbol: 'BNB',
        name: 'BNB',
        coinGeckoId: 'binancecoin',
        rank: 3,
        isActive: true,
        isDefault: true
      },
      {
        id: 'solana',
        symbol: 'SOL',
        name: 'Solana',
        coinGeckoId: 'solana',
        rank: 4,
        isActive: true,
        isDefault: true
      }
    ];
    
    for (const crypto of cryptocurrencies) {
      await db.run(`
        INSERT OR REPLACE INTO cryptocurrencies 
        (id, symbol, name, coinGeckoId, rank, isActive, isDefault, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `, [crypto.id, crypto.symbol, crypto.name, crypto.coinGeckoId, crypto.rank, crypto.isActive, crypto.isDefault]);
    }
    
    // Insert sample price data for Bitcoin
    await db.run(`
      INSERT OR REPLACE INTO price_history 
      (id, cryptoId, timestamp, price, volume24h, marketCap, priceChange24h)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'price-btc-1',
      'bitcoin',
      new Date().toISOString(),
      116627,
      43043699449,
      2321404684888,
      1.46
    ]);
    
    // Insert sample on-chain metrics for Bitcoin
    await db.run(`
      INSERT OR REPLACE INTO on_chain_metrics 
      (id, cryptoId, timestamp, mvrv, nupl, sopr, activeAddresses, exchangeInflow, exchangeOutflow, transactionVolume, whaleHoldingsPercentage, retailHoldingsPercentage, exchangeHoldingsPercentage)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'onchain-btc-1',
      'bitcoin',
      new Date().toISOString(),
      1.8,
      0.65,
      1.02,
      950000,
      15000,
      12000,
      25000000000,
      42.3,
      38.7,
      12.5
    ]);
    
    // Insert sample technical indicators for Bitcoin
    await db.run(`
      INSERT OR REPLACE INTO technical_indicators 
      (id, cryptoId, timestamp, rsi, ma50, ma200, macd, bollingerUpper, bollingerLower, bollingerMiddle)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      'technical-btc-1',
      'bitcoin',
      new Date().toISOString(),
      58.5,
      112000,
      108000,
      145.5,
      122000,
      111000,
      116627
    ]);
    
    // Insert sample sentiment data for Bitcoin
    await db.run(`
      INSERT OR REPLACE INTO sentiment_metrics 
      (id, timestamp, fearGreedIndex, socialSentiment, googleTrends, newsSentiment)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'sentiment-btc-1',
      new Date().toISOString(),
      67,
      0.68,
      78,
      0.62
    ]);
    
    // Insert sample derivatives data for Bitcoin
    await db.run(`
      INSERT OR REPLACE INTO derivative_metrics 
      (id, cryptoId, timestamp, openInterest, fundingRate, liquidationVolume, putCallRatio)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'derivatives-btc-1',
      'bitcoin',
      new Date().toISOString(),
      18500000000,
      0.0125,
      45000000,
      0.85
    ]);
    
    console.log('Database seeded successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();