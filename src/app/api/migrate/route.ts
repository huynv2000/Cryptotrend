import { NextRequest, NextResponse } from 'next/server'
import { DataMigrationService } from '@/lib/data-migration'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'all'
    
    console.log(`🔄 Running migration: ${type}`)
    
    if (type === 'all' || type === 'volume-prices') {
      await DataMigrationService.updateVolumeHistoryWithPrices()
    }
    
    return NextResponse.json({ 
      message: 'Migration completed successfully',
      type: type
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}