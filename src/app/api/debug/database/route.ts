import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const table = searchParams.get('table') || 'all'
    
    const result: any = {}
    
    // Check all tables
    if (table === 'all' || table === 'cryptocurrencies') {
      const cryptos = await db.cryptocurrency.findMany({
        take: 10,
        orderBy: { rank: 'asc' }
      })
      result.cryptocurrencies = cryptos
    }
    
    if (table === 'all' || table === 'priceHistory') {
      const priceHistory = await db.priceHistory.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' }
      })
      result.priceHistory = priceHistory
    }
    
    if (table === 'all' || table === 'volumeHistory') {
      const volumeHistory = await db.volumeHistory.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' }
      })
      result.volumeHistory = volumeHistory
    }
    
    if (table === 'all' || table === 'technicalIndicators') {
      const technicalIndicators = await db.technicalIndicator.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' }
      })
      result.technicalIndicators = technicalIndicators
    }
    
    if (table === 'all' || table === 'onChainMetrics') {
      const onChainMetrics = await db.onChainMetric.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' }
      })
      result.onChainMetrics = onChainMetrics
    }
    
    // Count records in each table
    const counts = await Promise.all([
      db.cryptocurrency.count(),
      db.priceHistory.count(),
      db.volumeHistory.count(),
      db.technicalIndicator.count(),
      db.onChainMetric.count(),
      db.sentimentMetric.count(),
      db.derivativeMetric.count()
    ])
    
    result.counts = {
      cryptocurrencies: counts[0],
      priceHistory: counts[1],
      volumeHistory: counts[2],
      technicalIndicators: counts[3],
      onChainMetrics: counts[4],
      sentimentMetrics: counts[5],
      derivativeMetrics: counts[6]
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Database debug error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}