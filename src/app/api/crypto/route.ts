import { NextRequest, NextResponse } from 'next/server'
import { CryptoDataService } from '@/lib/crypto-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const coinId = searchParams.get('coinId') || 'bitcoin'
    const action = searchParams.get('action')

    const cryptoService = CryptoDataService.getInstance()

    switch (action) {
      case 'complete':
        const completeData = await cryptoService.getCompleteCryptoData(coinId)
        return NextResponse.json(completeData)

      case 'top':
        const limit = parseInt(searchParams.get('limit') || '50')
        const topCryptos = await cryptoService.getTopCryptocurrencies(limit)
        return NextResponse.json(topCryptos)

      case 'price':
        const priceData = await cryptoService.getCompleteCryptoData(coinId)
        return NextResponse.json(priceData.price)

      case 'onchain':
        const onChainData = await cryptoService.getCompleteCryptoData(coinId)
        return NextResponse.json(onChainData.onChain)

      case 'technical':
        const technicalData = await cryptoService.getCompleteCryptoData(coinId)
        return NextResponse.json(technicalData.technical)

      case 'derivatives':
        const derivativesData = await cryptoService.getCompleteCryptoData(coinId)
        return NextResponse.json(derivativesData.derivatives)

      case 'sentiment':
        const sentimentData = await cryptoService.getCompleteCryptoData(coinId)
        return NextResponse.json(sentimentData.sentiment)

      case 'social-sentiment':
        const socialData = await cryptoService.getCompleteCryptoData(coinId)
        return NextResponse.json(socialData.sentiment.social)

      case 'news-sentiment':
        const newsData = await cryptoService.getCompleteCryptoData(coinId)
        return NextResponse.json(newsData.sentiment.news)

      case 'google-trends':
        const trendsData = await cryptoService.getCompleteCryptoData(coinId)
        return NextResponse.json(trendsData.sentiment.googleTrends)

      case 'enhanced':
        // Get enhanced data with all new metrics
        const enhancedData = await cryptoService.getCompleteCryptoData(coinId)
        return NextResponse.json(enhancedData)

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in crypto API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}