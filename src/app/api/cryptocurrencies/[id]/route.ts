import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface UpdateCoinRequest {
  isActive?: boolean
}

// GET /api/cryptocurrencies/[id] - Lấy thông tin chi tiết của một coin
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First try to find by symbol (case insensitive)
    let cryptocurrency = await db.cryptocurrency.findFirst({
      where: { symbol: params.id.toUpperCase() },
      include: {
        dataCollection: true,
        addedByUser: {
          select: { id: true, name: true, email: true }
        },
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 30
        },
        onChainMetrics: {
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        technicalIndicators: {
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        derivativeMetrics: {
          orderBy: { timestamp: 'desc' },
          take: 10
        },
        analysisHistory: {
          orderBy: { timestamp: 'desc' },
          take: 5
        }
      }
    })
    
    // If not found by symbol, try to find by ID
    if (!cryptocurrency) {
      cryptocurrency = await db.cryptocurrency.findUnique({
        where: { id: params.id },
        include: {
          dataCollection: true,
          addedByUser: {
            select: { id: true, name: true, email: true }
          },
          priceHistory: {
            orderBy: { timestamp: 'desc' },
            take: 30
          },
          onChainMetrics: {
            orderBy: { timestamp: 'desc' },
            take: 10
          },
          technicalIndicators: {
            orderBy: { timestamp: 'desc' },
            take: 10
          },
          derivativeMetrics: {
            orderBy: { timestamp: 'desc' },
            take: 10
          },
          analysisHistory: {
            orderBy: { timestamp: 'desc' },
            take: 5
          }
        }
      })
    }
    
    if (!cryptocurrency) {
      return NextResponse.json(
        { error: 'Cryptocurrency not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(cryptocurrency)
  } catch (error) {
    console.error('Error fetching cryptocurrency:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// PUT /api/cryptocurrencies/[id] - Cập nhật thông tin coin
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: UpdateCoinRequest = await request.json()
    const { isActive } = body
    
    // First try to find by symbol (case insensitive)
    let existingCoin = await db.cryptocurrency.findFirst({
      where: { symbol: params.id.toUpperCase() }
    })
    
    // If not found by symbol, try to find by ID
    if (!existingCoin) {
      existingCoin = await db.cryptocurrency.findUnique({
        where: { id: params.id }
      })
    }
    
    if (!existingCoin) {
      return NextResponse.json(
        { error: 'Cryptocurrency not found' },
        { status: 404 }
      )
    }
    
    // Don't allow updating default coins
    if (existingCoin.isDefault) {
      return NextResponse.json(
        { error: 'Cannot modify default coins' },
        { status: 403 }
      )
    }
    
    const updatedCoin = await db.cryptocurrency.update({
      where: { id: existingCoin.id },
      data: {
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date()
      },
      include: {
        dataCollection: true,
        addedByUser: {
          select: { id: true, name: true, email: true }
        }
      }
    })
    
    return NextResponse.json({
      message: 'Cryptocurrency updated successfully',
      coin: updatedCoin
    })
    
  } catch (error) {
    console.error('Error updating cryptocurrency:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// DELETE /api/cryptocurrencies/[id] - Xóa coin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // First try to find by symbol (case insensitive)
    let existingCoin = await db.cryptocurrency.findFirst({
      where: { symbol: params.id.toUpperCase() }
    })
    
    // If not found by symbol, try to find by ID
    if (!existingCoin) {
      existingCoin = await db.cryptocurrency.findUnique({
        where: { id: params.id }
      })
    }
    
    if (!existingCoin) {
      return NextResponse.json(
        { error: 'Cryptocurrency not found' },
        { status: 404 }
      )
    }
    
    // Don't allow deleting default coins
    if (existingCoin.isDefault) {
      return NextResponse.json(
        { error: 'Cannot delete default coins' },
        { status: 403 }
      )
    }
    
    // Delete related data first (cascade will handle most, but we need to handle dataCollection)
    await db.coinDataCollection.delete({
      where: { cryptoId: existingCoin.id }
    })
    
    // Delete the cryptocurrency (cascade will delete related records)
    await db.cryptocurrency.delete({
      where: { id: existingCoin.id }
    })
    
    return NextResponse.json({
      message: 'Cryptocurrency deleted successfully'
    })
    
  } catch (error) {
    console.error('Error deleting cryptocurrency:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

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