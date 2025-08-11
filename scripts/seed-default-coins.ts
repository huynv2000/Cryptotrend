import { db } from '../src/lib/db'

const defaultCoins = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    coinGeckoId: 'bitcoin',
    isDefault: true,
    isActive: true
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    coinGeckoId: 'ethereum',
    isDefault: true,
    isActive: true
  },
  {
    symbol: 'BNB',
    name: 'Binance Coin',
    coinGeckoId: 'binancecoin',
    isDefault: true,
    isActive: true
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    coinGeckoId: 'solana',
    isDefault: true,
    isActive: true
  }
]

async function seedDefaultCoins() {
  console.log('Seeding default coins...')
  
  try {
    for (const coin of defaultCoins) {
      // Check if coin already exists
      const existingCoin = await db.cryptocurrency.findFirst({
        where: {
          OR: [
            { symbol: coin.symbol },
            { coinGeckoId: coin.coinGeckoId }
          ]
        }
      })
      
      if (!existingCoin) {
        // Create the coin
        const newCoin = await db.cryptocurrency.create({
          data: {
            symbol: coin.symbol,
            name: coin.name,
            coinGeckoId: coin.coinGeckoId,
            isDefault: coin.isDefault,
            isActive: coin.isActive
          }
        })
        
        // Create data collection record
        await db.coinDataCollection.create({
          data: {
            cryptoId: newCoin.id,
            status: 'PENDING',
            nextCollection: new Date(Date.now() + 5 * 60 * 1000) // Start collection in 5 minutes
          }
        })
        
        console.log(`Created default coin: ${coin.symbol}`)
      } else {
        console.log(`Coin ${coin.symbol} already exists, skipping...`)
      }
    }
    
    console.log('Default coins seeding completed!')
  } catch (error) {
    console.error('Error seeding default coins:', error)
  } finally {
    await db.$disconnect()
  }
}

// Run the seeding
seedDefaultCoins()