import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/cryptocurrencies/[id]/collect-data - Trigger manual data collection
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First try to find by symbol (case insensitive)
    let cryptocurrency = await db.cryptocurrency.findFirst({
      where: { symbol: params.id.toUpperCase() },
      include: { dataCollection: true }
    })
    
    // If not found by symbol, try to find by ID
    if (!cryptocurrency) {
      cryptocurrency = await db.cryptocurrency.findUnique({
        where: { id: params.id },
        include: { dataCollection: true }
      })
    }
    
    if (!cryptocurrency) {
      return NextResponse.json(
        { error: 'Cryptocurrency not found' },
        { status: 404 }
      )
    }
    
    // Update collection status
    await db.coinDataCollection.update({
      where: { cryptoId: cryptocurrency.id },
      data: { 
        status: 'COLLECTING',
        nextCollection: new Date()
      }
    })
    
    // Import and trigger data collection
    const { triggerDataCollection } = await import('@/app/api/cryptocurrencies/route')
    triggerDataCollection(cryptocurrency.id).catch(console.error)
    
    return NextResponse.json({
      message: 'Data collection triggered successfully',
      coin: cryptocurrency.symbol
    })
    
  } catch (error) {
    console.error('Error triggering data collection:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}