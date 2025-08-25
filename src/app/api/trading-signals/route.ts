import { NextRequest, NextResponse } from 'next/server'
import { CryptoDataService } from '@/lib/crypto-service'
import { TradingSignalService } from '@/lib/trading-signals'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coinId = searchParams.get('coinId') || 'bitcoin'
    const action = searchParams.get('action')

    const cryptoService = CryptoDataService.getInstance()
    const tradingSignalService = TradingSignalService.getInstance()

    switch (action) {
      case 'signal':
        // Get complete market data and generate trading signal
        const completeData = await cryptoService.getCompleteCryptoData(coinId)
        
        const marketData = {
          mvrv: completeData.onChain?.mvrv || 0,
          fearGreedIndex: completeData.sentiment?.fearGreedIndex || 0,
          fundingRate: completeData.derivatives?.fundingRate || 0,
          sopr: completeData.onChain?.sopr || 0,
          rsi: completeData.technical?.rsi || 0,
          nupl: completeData.onChain?.nupl || 0,
          transactionVolume: completeData.onChain?.transactionVolume || 0,
          previousTransactionVolume: (completeData.onChain?.transactionVolume || 0) * 0.95, // mock previous data
          openInterest: completeData.derivatives?.openInterest || 0,
          socialSentiment: completeData.sentiment?.social?.twitterSentiment || 0,
          newsSentiment: completeData.sentiment?.news?.newsSentiment || 0
        }

        const signal = tradingSignalService.generateSignal(marketData)
        const analysis = tradingSignalService.getSignalAnalysis(signal)

        return NextResponse.json({
          signal,
          analysis,
          marketData,
          timestamp: new Date().toISOString()
        })

      case 'thresholds':
        // Get current signal thresholds
        const thresholds = tradingSignalService.getThresholds()
        return NextResponse.json({ thresholds })

      case 'update-thresholds':
        // Update signal thresholds (would need POST request in production)
        return NextResponse.json({ 
          error: 'Use POST request to update thresholds' 
        }, { status: 405 })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in trading signals API:', error)
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

    const tradingSignalService = TradingSignalService.getInstance()

    switch (action) {
      case 'update-thresholds':
        // Update signal thresholds
        tradingSignalService.updateThresholds(body.thresholds || {})
        return NextResponse.json({ 
          success: true, 
          message: 'Thresholds updated successfully',
          thresholds: tradingSignalService.getThresholds()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in trading signals API POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}