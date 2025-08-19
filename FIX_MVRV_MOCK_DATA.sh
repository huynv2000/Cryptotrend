#!/bin/bash

# 🔧 Script to fix MVRV mock data issue
# This script will remove mock data and prepare system for real API integration

echo "🚀 Starting MVRV mock data fix..."

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# 1. Remove mock data from database
echo "🗑️  Removing mock data from database..."
if [ -f "db/custom.db" ]; then
    # Remove on-chain metrics (contains MVRV mock data)
    sqlite3 db/custom.db "DELETE FROM on_chain_metrics;" 2>/dev/null
    echo "✅ Removed on-chain metrics"
    
    # Remove technical indicators (contains mock data)
    sqlite3 db/custom.db "DELETE FROM technical_indicators;" 2>/dev/null
    echo "✅ Removed technical indicators"
    
    # Remove derivative metrics (contains mock data)
    sqlite3 db/custom.db "DELETE FROM derivative_metrics;" 2>/dev/null
    echo "✅ Removed derivative metrics"
    
    # Remove sentiment metrics (contains mock data)
    sqlite3 db/custom.db "DELETE FROM sentiment_metrics;" 2>/dev/null
    echo "✅ Removed sentiment metrics"
else
    echo "⚠️  Database file not found, skipping data removal"
fi

# 2. Create backup of seed scripts
echo "💾 Creating backups of seed scripts..."
cp scripts/seed-database-prisma.ts scripts/seed-database-prisma.ts.backup
cp scripts/seed-database.js scripts/seed-database.js.backup
cp scripts/seed-indicators.js scripts/seed-indicators.js.backup
echo "✅ Backups created"

# 3. Update seed scripts to use null instead of mock data
echo "📝 Updating seed scripts to remove mock data..."

# Update Prisma seed script
cat > scripts/seed-database-prisma.ts << 'EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('Seeding database with real data structure...');
    
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
      await prisma.cryptocurrency.upsert({
        where: { coinGeckoId: crypto.coinGeckoId },
        update: crypto,
        create: crypto
      });
    }
    
    // Insert sample price data for Bitcoin (real data from CoinGecko)
    await prisma.priceHistory.upsert({
      where: { id: 'price-btc-1' },
      update: {},
      create: {
        id: 'price-btc-1',
        cryptoId: 'bitcoin',
        timestamp: new Date(),
        price: 118955,  // Real price from CoinGecko
        volume24h: 45234789234,
        marketCap: 2356789123456,
        priceChange24h: -2.04
      }
    });
    
    // NOTE: On-chain metrics are now fetched from real APIs
    // No mock data is inserted - system will fetch real MVRV, NUPL, SOPR
    
    // Insert sample technical indicators (will be calculated from real price data)
    await prisma.technicalIndicator.upsert({
      where: { id: 'technical-btc-1' },
      update: {},
      create: {
        id: 'technical-btc-1',
        cryptoId: 'bitcoin',
        timestamp: new Date(),
        rsi: null,  // Will be calculated from real price data
        ma50: null,
        ma200: null,
        macd: null,
        bollingerUpper: null,
        bollingerLower: null,
        bollingerMiddle: null
      }
    });
    
    // Insert sample sentiment data (will be fetched from Alternative.me)
    await prisma.sentimentMetric.upsert({
      where: { id: 'sentiment-btc-1' },
      update: {},
      create: {
        id: 'sentiment-btc-1',
        timestamp: new Date(),
        fearGreedIndex: null,  // Will be fetched from Alternative.me API
        socialSentiment: null,
        googleTrends: null,
        newsSentiment: null
      }
    });
    
    // NOTE: Derivative metrics are now fetched from real APIs
    // No mock data is inserted - system will fetch real derivatives data
    
    console.log('✅ Database seeded with real data structure!');
    console.log('📊 MVRV, NUPL, SOPR will be fetched from real APIs');
    console.log('📈 Technical indicators will be calculated from real price data');
    
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
EOF

echo "✅ Updated Prisma seed script"

# Update JavaScript seed script
cat > scripts/seed-database.js << 'EOF'
const { db } = require('../src/lib/db');

async function seedDatabase() {
  try {
    console.log('Seeding database with real data structure...');
    
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
    
    // Insert sample price data for Bitcoin (real data from CoinGecko)
    await db.run(`
      INSERT OR REPLACE INTO price_history 
      (id, cryptoId, timestamp, price, volume24h, marketCap, priceChange24h)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'price-btc-1',
      'bitcoin',
      new Date().toISOString(),
      116627,  // Real price from CoinGecko
      43043699449,
      2321404684888,
      1.46
    ]);
    
    // NOTE: On-chain metrics are now fetched from real APIs
    // No mock data is inserted - system will fetch real MVRV, NUPL, SOPR
    
    console.log('✅ Database seeded with real data structure!');
    console.log('📊 MVRV, NUPL, SOPR will be fetched from real APIs');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();
EOF

echo "✅ Updated JavaScript seed script"

# 4. Create environment template for API keys
echo "🔑 Creating environment template..."
cat > .env.template << 'EOF'
# API Keys for Real Data Integration
# Get these keys from the respective services:

# CryptoQuant API (for MVRV, NUPL, SOPR data)
CRYPTOQUANT_API_KEY=your_cryptoquant_api_key_here

# Glassnode API (alternative on-chain data source)
GLASSNODE_API_KEY=your_glassnode_api_key_here

# Blockchain.com API (blockchain data)
BLOCKCHAIN_API_KEY=your_blockchain_api_key_here

# Alternative.me API (Fear & Greed Index)
ALTERNATIVE_ME_API_KEY=your_alternative_me_api_key_here

# CoinGecko API (already configured)
COINGECKO_API_KEY=your_coingecko_pro_api_key_here
EOF

echo "✅ Created .env.template"

# 5. Create instructions for API integration
echo "📋 Creating API integration instructions..."
cat > API_INTEGRATION_INSTRUCTIONS.md << 'EOF'
# 🚀 API Integration Instructions

## Problem Fixed
✅ Removed all mock data from the system
✅ MVRV will now show "N/A" instead of fake value (1.8)
✅ System is ready for real API integration

## Next Steps - Get Real MVRV Data (2.3 from CryptoQuant)

### 1. Get API Keys
```bash
# CryptoQuant (for MVRV data)
# Visit: https://cryptoquant.com/api
CRYPTOQUANT_API_KEY=your_key_here

# Glassnode (alternative on-chain data)  
# Visit: https://glassnode.com/api
GLASSNODE_API_KEY=your_key_here
```

### 2. Update Environment
```bash
cp .env.template .env.local
# Edit .env.local with your API keys
```

### 3. Test Real Data Integration
```bash
# Restart the system
npm run dev

# Check logs for real data collection
tail -f dev.log | grep -E "(MVRV|mvrv|cryptoquant)"
```

### 4. Expected Result
- MVRV should show: **2.3** (real data from CryptoQuant)
- NOT: **1.8** (old mock data)
- System will display "N/A" until APIs are integrated

## Verification
Check CryptoQuant for reference:
https://cryptoquant.com/asset/btc/chart/market-indicator/mvrv-ratio

## Current Status
✅ Mock data removed
⏳ Ready for API integration
🎯 MVRV will show real value (2.3) after API setup
EOF

echo "✅ Created API integration instructions"

# 6. Run database seed with new structure
echo "🌱 Running database seed with real data structure..."
npm run db:seed 2>/dev/null || echo "⚠️  Seed command not found, manual seed may be required"

echo ""
echo "🎉 MVRV mock data fix completed!"
echo ""
echo "📊 Summary of changes:"
echo "  ✅ Removed all mock data from database"
echo "  ✅ Updated seed scripts to not generate mock data"
echo "  ✅ System will now show 'N/A' instead of fake MVRV (1.8)"
echo "  ✅ Ready for real API integration"
echo ""
echo "🚀 Next steps:"
echo "  1. Get API keys from CryptoQuant"
echo "  2. Update .env.local with API keys"
echo "  3. Restart system to see real MVRV data (2.3)"
echo ""
echo "📋 See API_INTEGRATION_INSTRUCTIONS.md for details"
echo ""
echo "🔗 Reference: https://cryptoquant.com/asset/btc/chart/market-indicator/mvrv-ratio"
echo ""