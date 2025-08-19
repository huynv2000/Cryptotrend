import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing database connectivity...')
    
    // Test database connection with the fixed query
    const result = await db.$queryRaw`SELECT 1 as test`
    
    // Convert BigInt to Number for serialization
    const serializedResult = JSON.parse(JSON.stringify(result, (key, value) => 
      typeof value === 'bigint' ? Number(value) : value
    ))
    
    // Test cryptocurrency count
    const cryptoCount = await db.cryptocurrency.count()
    
    // Test price history count
    const priceCount = await db.priceHistory.count()
    
    return NextResponse.json({
      success: true,
      message: 'Database connectivity test successful',
      timestamp: new Date().toISOString(),
      details: {
        connectionTest: serializedResult,
        cryptocurrencyCount: cryptoCount,
        priceHistoryCount: priceCount
      }
    })
    
  } catch (error) {
    console.error('❌ Database test failed:', error)
    
    return NextResponse.json({
      success: false,
      message: 'Database connectivity test failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}