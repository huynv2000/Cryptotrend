import { NextRequest, NextResponse } from 'next/server'
import { AlertSystem } from '@/lib/alert-system'
import { CryptoDataService } from '@/lib/crypto-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coinId = searchParams.get('coinId') || 'bitcoin'
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '50')

    const alertSystem = AlertSystem.getInstance()
    const cryptoService = CryptoDataService.getInstance()

    switch (action) {
      case 'process-data':
        // Process market data and generate alerts
        const completeData = await cryptoService.getCompleteCryptoData(coinId)
        
        const marketData = {
          exchangeInflow: completeData.onChain.exchangeInflow,
          exchangeOutflow: completeData.onChain.exchangeOutflow,
          fundingRate: completeData.derivatives.fundingRate,
          fearGreedIndex: completeData.sentiment.fearGreedIndex,
          openInterest: completeData.derivatives.openInterest,
          liquidationVolume: completeData.derivatives.liquidationVolume,
          transactionVolume: completeData.onChain.transactionVolume,
          price: completeData.price.usd,
          priceChange24h: completeData.price.usd_24h_change,
          previousData: {
            exchangeInflow: completeData.onChain.exchangeInflow * 0.8, // mock previous data
            exchangeOutflow: completeData.onChain.exchangeOutflow * 1.2,
            transactionVolume: completeData.onChain.transactionVolume * 0.9
          }
        }

        const alerts = await alertSystem.processMarketData(coinId, marketData)
        
        // Update historical data
        if (completeData.derivatives.openInterest) {
          alertSystem.updateHistoricalData(coinId, 'openInterest', completeData.derivatives.openInterest)
        }

        return NextResponse.json({
          alerts,
          marketData,
          timestamp: new Date().toISOString()
        })

      case 'recent':
        // Get recent alerts
        const recentAlerts = alertSystem.getRecentAlerts(limit)
        return NextResponse.json({ alerts: recentAlerts })

      case 'coin-alerts':
        // Get alerts for specific coin
        const coinAlerts = alertSystem.getAlertsForCoin(coinId, limit)
        return NextResponse.json({ alerts: coinAlerts })

      case 'stats':
        // Get alert statistics
        const stats = alertSystem.getAlertStats()
        return NextResponse.json({ stats })

      case 'config':
        // Get alert configuration
        const config = alertSystem.getConfig()
        return NextResponse.json({ config })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in alerts API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body = await request.json()

    const alertSystem = AlertSystem.getInstance()

    switch (action) {
      case 'update-config':
        // Update alert configuration
        alertSystem.updateConfig(body.config || {})
        return NextResponse.json({ 
          success: true, 
          message: 'Configuration updated successfully',
          config: alertSystem.getConfig()
        })

      case 'clear-alerts':
        // Clear all alerts
        alertSystem.clearAlerts()
        return NextResponse.json({ 
          success: true, 
          message: 'All alerts cleared'
        })

      case 'enable':
        // Enable alert system
        alertSystem.updateConfig({ enabled: true })
        return NextResponse.json({ 
          success: true, 
          message: 'Alert system enabled',
          enabled: true
        })

      case 'disable':
        // Disable alert system
        alertSystem.updateConfig({ enabled: false })
        return NextResponse.json({ 
          success: true, 
          message: 'Alert system disabled',
          enabled: false
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in alerts API POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    const alertSystem = AlertSystem.getInstance()

    switch (action) {
      case 'clear-alerts':
        // Clear all alerts
        alertSystem.clearAlerts()
        return NextResponse.json({ 
          success: true, 
          message: 'All alerts cleared'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in alerts API DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}