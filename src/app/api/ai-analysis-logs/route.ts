import { NextRequest, NextResponse } from 'next/server'
import { aiLogger } from '@/lib/ai-logger'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const coinId = searchParams.get('coinId')
    const operation = searchParams.get('operation')
    const count = parseInt(searchParams.get('count') || '50')

    switch (action) {
      case 'recent':
        const recentLogs = aiLogger.getRecentLogs(count)
        return NextResponse.json({
          success: true,
          data: recentLogs
        })

      case 'coin':
        if (!coinId) {
          return NextResponse.json({
            success: false,
            error: 'Coin ID is required for coin-specific logs'
          }, { status: 400 })
        }
        const coinLogs = aiLogger.getLogsForCoin(coinId, count)
        return NextResponse.json({
          success: true,
          data: coinLogs
        })

      case 'operation':
        if (!operation) {
          return NextResponse.json({
            success: false,
            error: 'Operation type is required for operation-specific logs'
          }, { status: 400 })
        }
        const operationLogs = aiLogger.getLogsByOperation(operation, count)
        return NextResponse.json({
          success: true,
          data: operationLogs
        })

      case 'stats':
        const stats = aiLogger.getStats()
        return NextResponse.json({
          success: true,
          data: stats
        })

      case 'export':
        const exportData = aiLogger.exportLogs()
        return NextResponse.json({
          success: true,
          data: exportData
        })

      case 'summary':
        aiLogger.printSummary()
        return NextResponse.json({
          success: true,
          message: 'Summary printed to console'
        })

      case 'clear':
        aiLogger.clearLogs()
        return NextResponse.json({
          success: true,
          message: 'Logs cleared successfully'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: recent, coin, operation, stats, export, summary, clear'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in AI analysis logs API:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}