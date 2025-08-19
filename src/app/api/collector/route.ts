import { NextRequest, NextResponse } from 'next/server'
import { dataCollector } from '@/lib/data-collector'
import { rateLimiter } from '@/lib/rate-limiter'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'status':
        return NextResponse.json({
          isRunning: dataCollector['isRunning'],
          stats: dataCollector.getStatistics(),
          config: dataCollector.getConfiguration(),
          rateLimiter: {
            stats: rateLimiter.getStatistics(),
            queueStatus: rateLimiter.getQueueStatus()
          }
        })

      case 'stats':
        return NextResponse.json({
          stats: dataCollector.getStatistics(),
          rateLimiter: {
            stats: rateLimiter.getStatistics(),
            queueStatus: rateLimiter.getQueueStatus()
          }
        })

      case 'config':
        return NextResponse.json(dataCollector.getConfiguration())

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in collector API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, config } = body

    switch (action) {
      case 'start':
        await dataCollector.startScheduledCollection(config)
        return NextResponse.json({ 
          message: 'Data collector started successfully',
          config: dataCollector.getConfiguration()
        })

      case 'stop':
        dataCollector.stopScheduledCollection()
        return NextResponse.json({ 
          message: 'Data collector stopped successfully'
        })

      case 'update':
        if (config) {
          dataCollector.updateConfiguration(config)
          return NextResponse.json({ 
            message: 'Configuration updated successfully',
            config: dataCollector.getConfiguration()
          })
        } else {
          return NextResponse.json(
            { error: 'Configuration is required for update action' },
            { status: 400 }
          )
        }

      case 'restart':
        dataCollector.stopScheduledCollection()
        await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
        await dataCollector.startScheduledCollection(config)
        return NextResponse.json({ 
          message: 'Data collector restarted successfully',
          config: dataCollector.getConfiguration()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in collector API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}