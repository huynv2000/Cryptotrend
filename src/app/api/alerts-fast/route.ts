import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { AlertSystem } from '@/lib/alert-system'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coinId = searchParams.get('coinId') || 'bitcoin'
    const action = searchParams.get('action')
    const limit = parseInt(searchParams.get('limit') || '50')

    const alertSystem = AlertSystem.getInstance()

    switch (action) {
      case 'process-data':
        // Get cryptocurrency data
        const cryptocurrency = await db.cryptocurrency.findFirst({
          where: { coinGeckoId: coinId }
        })

        if (!cryptocurrency) {
          return NextResponse.json(
            { error: 'Cryptocurrency not found' },
            { status: 404 }
          )
        }

        // Get latest data from database
        const latestPrice = await db.priceHistory.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        })

        const latestOnChain = await db.onChainMetric.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        })

        const latestDerivative = await db.derivativeMetric.findFirst({
          where: { cryptoId: cryptocurrency.id },
          orderBy: { timestamp: 'desc' }
        })

        const latestSentiment = await db.sentimentMetric.findFirst({
          orderBy: { timestamp: 'desc' }
        })

        // Construct market data from database
        const marketData = {
          exchangeInflow: latestOnChain?.exchangeInflow || 0,
          exchangeOutflow: latestOnChain?.exchangeOutflow || 0,
          fundingRate: latestDerivative?.fundingRate || 0,
          fearGreedIndex: latestSentiment?.fearGreedIndex || 50,
          openInterest: latestDerivative?.openInterest || 0,
          liquidationVolume: latestDerivative?.liquidationVolume || 0,
          transactionVolume: latestOnChain?.transactionVolume || 0,
          price: latestPrice?.price || 0,
          priceChange24h: latestPrice?.priceChange24h || 0,
          previousData: {
            exchangeInflow: (latestOnChain?.exchangeInflow || 0) * 0.8, // mock previous data
            exchangeOutflow: (latestOnChain?.exchangeOutflow || 0) * 1.2,
            transactionVolume: (latestOnChain?.transactionVolume || 0) * 0.9
          }
        }

        const alerts = await alertSystem.processMarketData(coinId, marketData)
        
        // Update historical data
        if (latestDerivative?.openInterest) {
          alertSystem.updateHistoricalData(coinId, 'openInterest', latestDerivative.openInterest)
        }

        return NextResponse.json({
          alerts,
          marketData,
          timestamp: new Date().toISOString(),
          dataSource: 'database'
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
    console.error('Error in alerts fast API:', error)
    
    // Return fallback data if database fails
    const fallbackAlerts = [
      {
        id: 'fallback_alert_1',
        type: 'INFO' as const,
        category: 'SYSTEM',
        title: 'System Status',
        message: 'System operating with fallback data',
        severity: 'LOW' as const,
        timestamp: new Date(),
        coinId: coinId,
        actionRequired: false,
        recommendedAction: 'Monitor system status'
      }
    ]

    return NextResponse.json({
      alerts: fallbackAlerts,
      marketData: {
        exchangeInflow: 0,
        exchangeOutflow: 0,
        fundingRate: 0,
        fearGreedIndex: 50,
        openInterest: 0,
        liquidationVolume: 0,
        transactionVolume: 0,
        price: 0,
        priceChange24h: 0,
        previousData: {
          exchangeInflow: 0,
          exchangeOutflow: 0,
          transactionVolume: 0
        }
      },
      timestamp: new Date().toISOString(),
      dataSource: 'fallback'
    })
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
    console.error('Error in alerts fast API POST:', error)
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
    console.error('Error in alerts fast API DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}