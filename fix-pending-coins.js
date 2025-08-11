const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixPendingCoins() {
  try {
    console.log('🔄 Fixing PENDING coins status...')
    
    // Get all coins with PENDING status
    const pendingCoins = await prisma.cryptocurrency.findMany({
      where: {
        dataCollection: {
          status: 'PENDING'
        }
      },
      include: {
        dataCollection: true
      }
    })
    
    console.log(`Found ${pendingCoins.length} coins with PENDING status:`)
    pendingCoins.forEach(coin => {
      console.log(`- ${coin.symbol} (${coin.name}): ${coin.dataCollection.status}`)
    })
    
    if (pendingCoins.length === 0) {
      console.log('✅ No coins with PENDING status found!')
      return
    }
    
    // Update all PENDING coins to IDLE
    const updatePromises = pendingCoins.map(coin => 
      prisma.coinDataCollection.update({
        where: { cryptoId: coin.id },
        data: { 
          status: 'IDLE',
          nextCollection: new Date(Date.now() + 5 * 60 * 1000), // Start collection in 5 minutes
          errorCount: 0,
          lastError: null
        }
      })
    )
    
    await Promise.all(updatePromises)
    
    console.log(`✅ Updated ${pendingCoins.length} coins from PENDING to IDLE`)
    
    // Verify the update
    const updatedCoins = await prisma.cryptocurrency.findMany({
      where: {
        dataCollection: {
          status: 'IDLE'
        }
      },
      include: {
        dataCollection: true
      }
    })
    
    console.log('Updated coins:')
    updatedCoins.forEach(coin => {
      console.log(`- ${coin.symbol}: ${coin.dataCollection.status} (next: ${coin.dataCollection.nextCollection})`)
    })
    
  } catch (error) {
    console.error('❌ Error fixing PENDING coins:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the fix
fixPendingCoins()
  .then(() => {
    console.log('🎉 PENDING coins fix completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error)
    process.exit(1)
  })