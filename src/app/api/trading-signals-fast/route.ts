import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TradingSignalService } from '@/lib/trading-signals'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coinId = searchParams.get('coinId') || 'bitcoin'
    const action = searchParams.get('action')

    const tradingSignalService = TradingSignalService.getInstance()

    switch (action) {
      case 'signal':
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

        const latestTechnical = await db.technicalIndicator.findFirst({
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
          mvrv: latestOnChain?.mvrv || 1.5,
          fearGreedIndex: latestSentiment?.fearGreedIndex || 50,
          fundingRate: latestDerivative?.fundingRate || 0,
          sopr: latestOnChain?.sopr || 1,
          rsi: latestTechnical?.rsi || 50,
          nupl: latestOnChain?.nupl || 0.5,
          transactionVolume: latestOnChain?.transactionVolume || 1000000000,
          previousTransactionVolume: (latestOnChain?.transactionVolume || 1000000000) * 0.95,
          openInterest: latestDerivative?.openInterest || 1000000000,
          socialSentiment: latestSentiment?.socialSentiment || 0.5,
          newsSentiment: latestSentiment?.newsSentiment || 0.5,
          price: latestPrice?.price || 50000,
          priceChange24h: latestPrice?.priceChange24h || 0,
          volume24h: latestPrice?.volume24h || 1000000000,
          marketCap: latestPrice?.marketCap || 1000000000000
        }

        const signal = tradingSignalService.generateSignal(marketData)
        const analysis = tradingSignalService.getSignalAnalysis(signal)

        return NextResponse.json({
          signal,
          analysis,
          marketData,
          timestamp: new Date().toISOString(),
          dataSource: 'database'
        })

      case 'thresholds':
        // Get current signal thresholds
        const thresholds = tradingSignalService.getThresholds()
        return NextResponse.json({ thresholds })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in trading signals fast API:', error)
    
    // Return fallback data if database fails
    const fallbackSignal = {
      signal: 'HOLD',
      confidence: 0.5,
      reasoning: 'Fallback trading signal',
      riskLevel: 'MEDIUM' as const,
      conditions: {
        mvrv: 1.5,
        fearGreed: 50,
        fundingRate: 0,
        sopr: 1,
        rsi: 50,
        nupl: 0.5,
        volumeTrend: 'stable' as const,
        extremeDetected: false
      },
      triggers: ['Fallback data']
    }

    return NextResponse.json({
      signal: fallbackSignal,
      analysis: {
        recommendation: 'HOLD - Chờ đợi tín hiệu rõ ràng hơn',
        timeframe: 'Ngắn hạn',
        riskFactors: ['Dữ liệu fallback'],
        entryPoints: 'Chờ tín hiệu xác nhận',
        exitPoints: 'Chốt lời khi có tín hiệu',
        stopLoss: 'Quản lý rủi ro chặt chẽ',
        takeProfit: 'Lợi nhuận vừa phải',
        confidence: 0.5
      },
      marketData: {
        mvrv: 1.5,
        fearGreedIndex: 50,
        fundingRate: 0,
        sopr: 1,
        rsi: 50,
        nupl: 0.5,
        transactionVolume: 1000000000,
        previousTransactionVolume: 950000000,
        openInterest: 1000000000,
        socialSentiment: 0.5,
        newsSentiment: 0.5
      },
      timestamp: new Date().toISOString(),
      dataSource: 'fallback'
    })
  }
}