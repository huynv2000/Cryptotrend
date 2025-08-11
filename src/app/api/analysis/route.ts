import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { CryptoDataService } from '@/lib/crypto-service'
import { CryptocurrencyService } from '@/lib/cryptocurrency-service'

interface AnalysisRequest {
  coinId?: string
  coinGeckoId?: string
  userId?: string
  analysisType: 'market_overview' | 'coin_specific' | 'portfolio_analysis' | 'risk_assessment'
}

interface AnalysisResult {
  signal: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL'
  confidence: number
  reasoning: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  keyMetrics: {
    mvrv: number
    nupl: number
    fearGreedIndex: number
    rsi: number
    fundingRate: number
  }
  timestamp: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json()
    const { coinId, coinGeckoId, analysisType = 'coin_specific' } = body

    // Determine which coin to analyze
    let targetCoinGeckoId: string
    
    if (coinGeckoId) {
      targetCoinGeckoId = coinGeckoId.toLowerCase()
    } else if (coinId) {
      // Get coin from database by ID
      const cryptocurrency = await CryptocurrencyService.getCryptocurrencyById(coinId)
      if (!cryptocurrency) {
        return NextResponse.json(
          { error: 'Cryptocurrency not found' },
          { status: 404 }
        )
      }
      targetCoinGeckoId = cryptocurrency.coinGeckoId
    } else {
      // Default to bitcoin if no coin specified
      targetCoinGeckoId = 'bitcoin'
    }

    // Fetch crypto data
    const cryptoService = CryptoDataService.getInstance()
    const cryptoData = await cryptoService.getCompleteCryptoData(targetCoinGeckoId)

    // Initialize Z.AI
    const zai = await ZAI.create()

    // Create analysis prompt based on crypto data
    const analysisPrompt = createAnalysisPrompt(cryptoData, analysisType, targetCoinGeckoId)

    // Get AI analysis with retry mechanism
    let completion
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `You are an expert cryptocurrency analyst specializing in technical analysis, on-chain metrics, and market sentiment. 
              Provide trading recommendations based on the following data. Always consider risk management and provide confidence levels.
              
              IMPORTANT: Return your analysis in this exact JSON format:
              {
                "signal": "BUY|SELL|HOLD|STRONG_BUY|STRONG_SELL",
                "confidence": 0.0-1.0,
                "reasoning": "detailed explanation",
                "riskLevel": "LOW|MEDIUM|HIGH",
                "keyInsights": ["insight1", "insight2", "insight3"]
              }
              
              Do not include any other text or formatting outside of this JSON object.`
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
        break
      } catch (error) {
        retryCount++
        if (retryCount >= maxRetries) {
          throw error
        }
        console.log(`AI analysis failed, retrying (${retryCount}/${maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, 2000 * retryCount))
      }
    }

    const aiResponse = completion.choices[0]?.message?.content
    
    if (!aiResponse) {
      throw new Error('No response from AI')
    }

    // Parse AI response
    let analysisResult
    try {
      analysisResult = JSON.parse(aiResponse)
    } catch (parseError) {
      // Fallback to basic analysis if JSON parsing fails
      analysisResult = generateFallbackAnalysis(cryptoData)
    }

    // Format response
    const result: AnalysisResult = {
      signal: analysisResult.signal,
      confidence: analysisResult.confidence,
      reasoning: analysisResult.reasoning,
      riskLevel: analysisResult.riskLevel,
      keyMetrics: {
        mvrv: cryptoData.onChain.mvrv,
        nupl: cryptoData.onChain.nupl,
        fearGreedIndex: cryptoData.sentiment.fearGreedIndex,
        rsi: cryptoData.technical.rsi,
        fundingRate: cryptoData.derivatives.fundingRate
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in analysis API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

function createAnalysisPrompt(cryptoData: any, analysisType: string, coinGeckoId: string): string {
  const { onChain, technical, derivatives, sentiment } = cryptoData
  
  // Calculate risk indicators
  const rsiRisk = technical.rsi > 70 || technical.rsi < 30 ? 'HIGH' : technical.rsi > 60 || technical.rsi < 40 ? 'MEDIUM' : 'LOW'
  const mvrvRisk = onChain.mvrv > 2.5 || onChain.mvrv < 0.8 ? 'HIGH' : onChain.mvrv > 1.8 || onChain.mvrv < 1.2 ? 'MEDIUM' : 'LOW'
  const sentimentRisk = sentiment.fearGreedIndex > 75 || sentiment.fearGreedIndex < 25 ? 'HIGH' : sentiment.fearGreedIndex > 60 || sentiment.fearGreedIndex < 40 ? 'MEDIUM' : 'LOW'
  const fundingRisk = Math.abs(derivatives.fundingRate) > 0.02 ? 'HIGH' : Math.abs(derivatives.fundingRate) > 0.01 ? 'MEDIUM' : 'LOW'
  
  return `
CRYPTOCURRENCY MARKET ANALYSIS REQUEST
======================================

Analysis Type: ${analysisType.toUpperCase()}
Cryptocurrency: ${coinGeckoId.toUpperCase()}
Timestamp: ${new Date().toISOString()}

MARKET DATA OVERVIEW:
===================

ON-CHAIN METRICS:
- MVRV Ratio: ${onChain.mvrv?.toFixed(2) || 'N/A'} (${onChain.mvrv < 1 ? 'Undervalued' : onChain.mvrv > 2 ? 'Overvalued' : 'Fair value'})
- NUPL: ${onChain.nupl?.toFixed(2) || 'N/A'} (${onChain.nupl > 0.5 ? 'Greed zone' : onChain.nupl < 0 ? 'Fear zone' : 'Neutral'})
- SOPR: ${onChain.sopr?.toFixed(2) || 'N/A'} (${onChain.sopr > 1 ? 'Profit taking' : 'Loss realization'})
- Active Addresses: ${onChain.activeAddresses?.toLocaleString() || 'N/A'}
- Exchange Inflow: ${onChain.exchangeInflow?.toFixed(2) || 'N/A'} BTC
- Exchange Outflow: ${onChain.exchangeOutflow?.toFixed(2) || 'N/A'} BTC

TECHNICAL INDICATORS:
===================
- RSI: ${technical.rsi?.toFixed(2) || 'N/A'} (${technical.rsi > 70 ? 'Overbought' : technical.rsi < 30 ? 'Oversold' : 'Neutral'})
- MA50: $${technical.ma50?.toLocaleString() || 'N/A'}
- MA200: $${technical.ma200?.toLocaleString() || 'N/A'}
- MACD: ${technical.macd?.toFixed(2) || 'N/A'}
- Bollinger Bands: Upper $${technical.bollingerUpper?.toLocaleString() || 'N/A'}, Lower $${technical.bollingerLower?.toLocaleString() || 'N/A'}

DERIVATIVES MARKET:
==================
- Open Interest: $${(derivatives.openInterest / 1000000000)?.toFixed(1) || 'N/A'}B
- Funding Rate: ${(derivatives.fundingRate * 100)?.toFixed(3) || 'N/A'}%
- Liquidation Volume: $${(derivatives.liquidationVolume / 1000000)?.toFixed(1) || 'N/A'}M
- Put/Call Ratio: ${derivatives.putCallRatio?.toFixed(2) || 'N/A'}

MARKET SENTIMENT:
================
- Fear & Greed Index: ${sentiment.fearGreedIndex || 'N/A'} (${sentiment.fearGreedClassification || 'N/A'})

RISK ASSESSMENT:
================
- RSI Risk Level: ${rsiRisk}
- MVRV Risk Level: ${mvrvRisk}
- Sentiment Risk Level: ${sentimentRisk}
- Funding Rate Risk Level: ${fundingRisk}

ANALYSIS REQUIREMENTS:
=====================
Please provide a comprehensive trading analysis based on the above data. Consider:

1. VALUATION ANALYSIS:
   - Assess if the asset is overvalued or undervalued based on MVRV and NUPL
   - Consider long-term holder behavior and profit/loss levels

2. TECHNICAL ANALYSIS:
   - Evaluate momentum and trend strength using RSI and MACD
   - Analyze price position relative to moving averages
   - Consider volatility and Bollinger Bands positioning

3. MARKET SENTIMENT:
   - Interpret Fear & Greed index in context of current price action
   - Assess overall market psychology and potential extremes

4. DERIVATIVES MARKET:
   - Evaluate leverage and potential for liquidations
   - Consider funding rate implications for short-term price action
   - Analyze Put/Call ratio for market sentiment confirmation

5. RISK MANAGEMENT:
   - Identify key risk factors from the assessment above
   - Determine appropriate position sizing considerations
   - Suggest stop-loss and take-profit levels

6. TRADING RECOMMENDATION:
   - Provide clear signal: STRONG_BUY, BUY, HOLD, SELL, or STRONG_SELL
   - Assign confidence level (0.0-1.0) based on data consistency
   - Explain reasoning in detail
   - Assign overall risk level: LOW, MEDIUM, or HIGH
   - Provide 3 key insights that support your recommendation

RESPONSE FORMAT:
===============
Return your analysis in this exact JSON format:
{
  "signal": "STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL",
  "confidence": 0.0-1.0,
  "reasoning": "detailed explanation of your analysis",
  "riskLevel": "LOW|MEDIUM|HIGH",
  "keyInsights": ["insight1", "insight2", "insight3"]
}

Do not include any other text or formatting outside of this JSON object.
`
}

function generateFallbackAnalysis(cryptoData: any): any {
  const { onChain, technical, derivatives, sentiment } = cryptoData
  
  // Enhanced rule-based analysis with weighted scoring
  let buyScore = 0
  let sellScore = 0
  let riskScore = 0
  
  // Valuation scoring (weight: 30%)
  if (onChain.mvrv < 1.2) buyScore += 30
  if (onChain.mvrv < 1) buyScore += 20
  if (onChain.mvrv > 2) sellScore += 30
  if (onChain.mvrv > 2.5) sellScore += 20
  
  if (onChain.nupl < 0.3) buyScore += 20
  if (onChain.nupl < 0) buyScore += 15
  if (onChain.nupl > 0.7) sellScore += 20
  if (onChain.nupl > 0.8) sellScore += 15
  
  // Technical scoring (weight: 25%)
  if (technical.rsi < 45) buyScore += 25
  if (technical.rsi < 30) buyScore += 15
  if (technical.rsi > 65) sellScore += 25
  if (technical.rsi > 75) sellScore += 15
  
  if (technical.ma50 > technical.ma200) buyScore += 10
  else sellScore += 10
  
  // Sentiment scoring (weight: 25%)
  if (sentiment.fearGreedIndex < 45) buyScore += 25
  if (sentiment.fearGreedIndex < 30) buyScore += 15
  if (sentiment.fearGreedIndex > 65) sellScore += 25
  if (sentiment.fearGreedIndex > 75) sellScore += 15
  
  // Derivatives scoring (weight: 20%)
  if (derivatives.fundingRate < 0.005) buyScore += 10
  if (derivatives.fundingRate < 0) buyScore += 10
  if (derivatives.fundingRate > 0.015) sellScore += 15
  if (derivatives.fundingRate > 0.02) sellScore += 15
  
  if (derivatives.putCallRatio > 1.1) buyScore += 10
  if (derivatives.putCallRatio < 0.9) sellScore += 10
  
  // Risk assessment
  if (technical.rsi > 75 || technical.rsi < 25) riskScore += 30
  if (Math.abs(derivatives.fundingRate) > 0.02) riskScore += 25
  if (onChain.mvrv > 3 || onChain.mvrv < 0.5) riskScore += 20
  if (sentiment.fearGreedIndex > 85 || sentiment.fearGreedIndex < 15) riskScore += 25
  
  // Determine signal based on scores
  let signal = 'HOLD'
  let confidence = 0.5
  let reasoning = 'Market conditions are neutral with balanced indicators'
  let riskLevel = riskScore > 50 ? 'HIGH' : riskScore > 25 ? 'MEDIUM' : 'LOW'
  
  const totalScore = buyScore - sellScore
  
  if (totalScore > 60) {
    signal = 'STRONG_BUY'
    confidence = Math.min(0.9, 0.5 + (totalScore - 60) / 80)
    reasoning = 'Strong bullish signals across multiple indicators with high confidence'
  } else if (totalScore > 30) {
    signal = 'BUY'
    confidence = Math.min(0.8, 0.5 + (totalScore - 30) / 60)
    reasoning = 'Bullish indicators suggest buying opportunity with moderate confidence'
  } else if (totalScore < -60) {
    signal = 'STRONG_SELL'
    confidence = Math.min(0.9, 0.5 + (Math.abs(totalScore) - 60) / 80)
    reasoning = 'Strong bearish signals across multiple indicators with high confidence'
  } else if (totalScore < -30) {
    signal = 'SELL'
    confidence = Math.min(0.8, 0.5 + (Math.abs(totalScore) - 30) / 60)
    reasoning = 'Bearish indicators suggest selling opportunity with moderate confidence'
  }
  
  // Adjust confidence based on risk level
  if (riskLevel === 'HIGH') confidence = Math.max(0.3, confidence - 0.2)
  else if (riskLevel === 'MEDIUM') confidence = Math.max(0.4, confidence - 0.1)
  
  // Generate key insights
  const keyInsights: string[] = []
  
  if (onChain.mvrv < 1) {
    keyInsights.push('Asset appears significantly undervalued based on MVRV ratio')
  } else if (onChain.mvrv > 2) {
    keyInsights.push('Asset appears overvalued based on MVRV ratio')
  }
  
  if (sentiment.fearGreedIndex < 30) {
    keyInsights.push('Market sentiment shows extreme fear - potential buying opportunity')
  } else if (sentiment.fearGreedIndex > 70) {
    keyInsights.push('Market sentiment shows greed - caution advised')
  }
  
  if (technical.rsi < 30) {
    keyInsights.push('Technical indicators suggest oversold conditions')
  } else if (technical.rsi > 70) {
    keyInsights.push('Technical indicators suggest overbought conditions')
  }
  
  if (Math.abs(derivatives.fundingRate) > 0.02) {
    keyInsights.push('High funding rates indicate elevated leverage and liquidation risk')
  }
  
  // Ensure we have exactly 3 insights
  while (keyInsights.length < 3) {
    keyInsights.push('Market conditions require careful monitoring')
  }
  
  return {
    signal,
    confidence: Math.round(confidence * 100) / 100,
    reasoning,
    riskLevel,
    keyInsights: keyInsights.slice(0, 3)
  }
}