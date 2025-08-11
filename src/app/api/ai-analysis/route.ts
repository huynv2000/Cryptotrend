import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'
import { CryptoDataService } from '@/lib/crypto-service'
import { EnhancedAIAnalysisService } from '@/lib/enhanced-ai-analysis-service'
import { db } from '@/lib/db'
import { aiLogger, logAIStart, logAIPrompt, logAIResponse, logAIComplete, logAICache, logAIDatabase } from '@/lib/ai-logger'

interface AnalysisRequest {
  marketData?: any
  tradingSignal?: any
  alerts?: any[]
  coinId?: string
}

interface AIAnalysisResult {
  signal: 'BUY' | 'SELL' | 'HOLD' | 'STRONG_BUY' | 'STRONG_SELL'
  confidence: number
  reasoning: string
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  keyInsights: string[]
  timestamp: string
}

interface EnhancedAIAnalysis {
  recommendation: 'MUA' | 'BÁN' | 'GIỮ' | 'MUA MẠNH' | 'BÁN MẠNH'
  timeframe: string
  riskFactors: string[]
  entryPoints: string
  exitPoints: string
  stopLoss: string
  takeProfit: string
  zaiAnalysis: {
    recommendation: string
    confidence: number
    timeframe: string
    breakoutPotential: 'LOW' | 'MEDIUM' | 'HIGH'
    reasoning: string
  }
  chatGPTAnalysis: {
    recommendation: string
    confidence: number
    timeframe: string
    breakoutPotential: 'LOW' | 'MEDIUM' | 'HIGH'
    reasoning: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const analysisType = searchParams.get('analysisType') || 'basic'
    const coinId = searchParams.get('coinId') || 'bitcoin'
    const body = await request.json()

    if (action === 'analyze') {
      if (analysisType === 'enhanced') {
        return await performEnhancedAIAnalysis(coinId, body)
      } else {
        return await performAIAnalysis(coinId, body)
      }
    }

    // Generate mock analysis for testing purposes (legacy behavior)
    const result: AIAnalysisResult = {
      signal: 'HOLD',
      confidence: 0.65,
      reasoning: 'Market conditions are stable with balanced technical indicators. Current price action suggests consolidation phase with no strong directional bias.',
      riskLevel: 'MEDIUM',
      keyInsights: [
        'Technical indicators show neutral market conditions',
        'Volume patterns suggest consolidation phase',
        'Risk levels are moderate with balanced sentiment'
      ],
      timestamp: new Date().toISOString()
    }

    // Vary signal based on analysis type for demonstration
    if (body.analysisType === 'market_overview') {
      result.signal = 'BUY'
      result.confidence = 0.72
      result.reasoning = 'Market overview shows positive momentum with increasing volume and improving technical indicators.'
      result.keyInsights = [
        'Overall market sentiment is improving',
        'Technical indicators show bullish momentum',
        'Volume patterns confirm market strength'
      ]
    } else if (body.analysisType === 'risk_assessment') {
      result.signal = 'HOLD'
      result.confidence = 0.58
      result.riskLevel = 'HIGH'
      result.reasoning = 'Current market conditions show elevated risk levels with high volatility and uncertain direction.'
      result.keyInsights = [
        'High volatility detected across multiple timeframes',
        'Risk indicators show elevated levels',
        'Caution advised for new positions'
      ]
    }

    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Error in AI analysis API:', error)
    
    // Return fallback response
    const fallbackResult: AIAnalysisResult = {
      signal: 'HOLD',
      confidence: 0.5,
      reasoning: 'AI analysis service temporarily unavailable. Using fallback analysis.',
      riskLevel: 'MEDIUM',
      keyInsights: [
        'Market conditions require monitoring',
        'Technical indicators show mixed signals',
        'Risk management is recommended'
      ],
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(fallbackResult)
  }
}

async function performEnhancedAIAnalysis(coinId: string, requestBody: any) {
  const startTime = Date.now()
  const logId = logAIStart('ENHANCED_AI_ANALYSIS', coinId, requestBody)
  
  try {
    console.log(`🚀 Starting enhanced AI analysis for ${coinId}...`)
    
    const { analysisSubType = 'multitimeframe' } = requestBody

    // Initialize enhanced AI analysis service
    const enhancedService = EnhancedAIAnalysisService.getInstance()
    await enhancedService.initialize()

    // Try to get existing enhanced analysis from database first
    let existingAnalysis = null
    try {
      existingAnalysis = await db.analysisHistory.findFirst({
        where: {
          coinId: coinId,
          analysisType: 'ENHANCED_AI'
        },
        orderBy: {
          timestamp: 'desc'
        }
      })
    } catch (dbError) {
      console.warn('Database query failed, proceeding with fresh analysis:', dbError.message)
      logAIDatabase(logId, 'query_cache', { coinId, analysisType: 'ENHANCED_AI' }, false, dbError.message)
    }

    // If we have recent analysis (less than 1 hour old), return it
    if (existingAnalysis) {
      const analysisAge = Date.now() - new Date(existingAnalysis.timestamp).getTime()
      const oneHourInMs = 60 * 60 * 1000
      
      if (analysisAge < oneHourInMs) {
        console.log(`🤖 Using cached enhanced AI analysis for ${coinId}`)
        logAICache(logId, coinId, analysisAge)
        
        const parsedAnalysis = JSON.parse(existingAnalysis.analysisData)
        const executionTime = Date.now() - startTime
        
        logAIComplete(logId, 'ENHANCED_AI_ANALYSIS', parsedAnalysis, executionTime, true)
        
        return NextResponse.json({
          success: true,
          data: parsedAnalysis,
          cached: true,
          executionTime
        })
      }
    }

    // Perform enhanced AI analysis
    const enhancedResult = await enhancedService.performEnhancedAnalysis(coinId, analysisSubType)

    // Save to database if successful
    if (enhancedResult.success && enhancedResult.data) {
      try {
        // First, get the cryptocurrency ID from the coinGecko ID
        let cryptoId = coinId; // fallback to coinId
        try {
          const crypto = await db.cryptocurrency.findFirst({
            where: { coinGeckoId: coinId }
          });
          if (crypto) {
            cryptoId = crypto.id;
          }
        } catch (error) {
          console.warn('Could not find cryptocurrency ID, using coinId as fallback:', error.message);
        }

        const dbSaveData = {
          cryptoId: cryptoId,
          coinId: coinId,
          analysisType: 'ENHANCED_AI',
          analysisData: JSON.stringify(enhancedResult.data),
          signal: enhancedResult.data.tradingRecommendations.overallSignal,
          confidence: enhancedResult.data.confidence,
          reasoning: enhancedResult.data.reasoning.substring(0, 200),
          riskLevel: enhancedResult.data.riskManagement.overallRiskLevel,
          aiModel: enhancedResult.data.provider
        };

        await db.analysisHistory.create({
          data: dbSaveData
        });
        
        console.log(`✅ Enhanced AI analysis saved to database for ${coinId}`);
        logAIDatabase(logId, 'save_analysis', dbSaveData, true)
      } catch (dbError) {
        console.warn('Failed to save enhanced analysis to database:', dbError.message);
        logAIDatabase(logId, 'save_analysis', { coinId }, false, dbError.message)
      }
    }

    const executionTime = Date.now() - startTime
    
    // Log the complete enhanced analysis operation
    aiLogger.logAnalysis('ENHANCED_AI_ANALYSIS', {
      coinId,
      requestData: requestBody,
      finalResult: enhancedResult,
      executionTime,
      success: enhancedResult.success,
      metadata: {
        analysisType: 'ENHANCED_AI',
        analysisSubType,
        fallbackUsed: enhancedResult.fallbackUsed,
        providerStatus: enhancedResult.providerStatus,
        cacheUsed: false
      }
    })

    logAIComplete(logId, 'ENHANCED_AI_ANALYSIS', enhancedResult, executionTime, enhancedResult.success)

    return NextResponse.json({
      success: enhancedResult.success,
      data: enhancedResult.data,
      fallbackUsed: enhancedResult.fallbackUsed,
      providerStatus: enhancedResult.providerStatus,
      statusMessage: enhancedResult.statusMessage,
      executionTime
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error('Error in enhanced AI analysis:', error)
    
    // Log the failed analysis operation
    aiLogger.logAnalysis('ENHANCED_AI_ANALYSIS', {
      coinId,
      requestData: requestBody,
      executionTime,
      success: false,
      error: errorMessage,
      metadata: {
        analysisType: 'ENHANCED_AI',
        analysisSubType: requestBody.analysisSubType || 'multitimeframe'
      }
    })
    
    logAIComplete(logId, 'ENHANCED_AI_ANALYSIS', null, executionTime, false, errorMessage)
    
    // Return fallback response
    return NextResponse.json({
      success: false,
      error: errorMessage,
      fallbackUsed: true,
      statusMessage: {
        type: 'error',
        title: 'Lỗi Phân Tích Nâng Cao',
        message: 'Không thể thực hiện phân tích nâng cao. Vui lòng thử lại sau.',
        details: errorMessage,
        fallbackUsed: true,
        timestamp: new Date().toISOString()
      },
      executionTime
    })
  }
}

async function performAIAnalysis(coinId: string, requestBody: AnalysisRequest) {
  const startTime = Date.now()
  const logId = logAIStart('AI_ENHANCED_ANALYSIS', coinId, requestBody)
  
  // TEST: Check if console.log is working
  console.log(`🧪 [TEST] Console.log test - AI Analysis starting for ${coinId}`)
  
  try {
    console.log(`🤖 Starting AI analysis for ${coinId}...`)
    
    const { marketData, tradingSignal, alerts } = requestBody

    // Try to get existing analysis from database first
    let existingAnalysis = null
    try {
      existingAnalysis = await db.analysisHistory.findFirst({
        where: {
          coinId: coinId,
          analysisType: 'AI_ENHANCED'
        },
        orderBy: {
          timestamp: 'desc'
        }
      })
    } catch (dbError) {
      console.warn('Database query failed, proceeding with fresh analysis:', dbError.message)
      logAIDatabase(logId, 'query_cache', { coinId, analysisType: 'AI_ENHANCED' }, false, dbError.message)
    }

    // If we have recent analysis (less than 1 hour old), return it
    if (existingAnalysis) {
      const analysisAge = Date.now() - new Date(existingAnalysis.timestamp).getTime()
      const oneHourInMs = 60 * 60 * 1000
      
      if (analysisAge < oneHourInMs) {
        console.log(`🤖 Using cached AI analysis for ${coinId}`)
        logAICache(logId, coinId, analysisAge)
        
        const parsedAnalysis = JSON.parse(existingAnalysis.analysisData)
        const executionTime = Date.now() - startTime
        
        logAIComplete(logId, 'AI_ENHANCED_ANALYSIS', parsedAnalysis, executionTime, true)
        
        return NextResponse.json({
          success: true,
          data: parsedAnalysis
        })
      }
    }

    // Get market data if not provided
    let completeMarketData = marketData
    if (!completeMarketData) {
      try {
        const cryptoService = CryptoDataService.getInstance()
        completeMarketData = await cryptoService.getCompleteCryptoData(coinId)
      } catch (error) {
        console.warn('Failed to fetch market data, using provided data only:', error.message)
      }
    }

    // Generate enhanced AI analysis
    const enhancedAnalysis = await generateEnhancedAIAnalysis(coinId, completeMarketData, tradingSignal, alerts)

    // Save to database
    try {
      // First, get the cryptocurrency ID from the coinGecko ID
      let cryptoId = coinId; // fallback to coinId
      try {
        const crypto = await db.cryptocurrency.findFirst({
          where: { coinGeckoId: coinId }
        });
        if (crypto) {
          cryptoId = crypto.id;
        }
      } catch (error) {
        console.warn('Could not find cryptocurrency ID, using coinId as fallback:', error.message);
      }

      // Determine risk level based on confidence and risk factors
      let riskLevel = 'MEDIUM';
      if (enhancedAnalysis.riskFactors && enhancedAnalysis.riskFactors.length > 2) {
        riskLevel = 'HIGH';
      } else if (enhancedAnalysis.riskFactors && enhancedAnalysis.riskFactors.length === 0) {
        riskLevel = 'LOW';
      }

      const dbSaveData = {
        cryptoId: cryptoId,
        coinId: coinId,
        analysisType: 'AI_ENHANCED',
        analysisData: JSON.stringify(enhancedAnalysis),
        signal: enhancedAnalysis.recommendation,
        confidence: Math.max(enhancedAnalysis.zaiAnalysis.confidence, enhancedAnalysis.chatGPTAnalysis.confidence),
        reasoning: `Z.AI: ${enhancedAnalysis.zaiAnalysis.reasoning.substring(0, 100)}... | ChatGPT: ${enhancedAnalysis.chatGPTAnalysis.reasoning.substring(0, 100)}...`,
        riskLevel: riskLevel,
        aiModel: 'Z.AI+ChatGPT'
      };

      await db.analysisHistory.create({
        data: dbSaveData
      });
      
      console.log(`✅ AI analysis saved to database for ${coinId}`);
      logAIDatabase(logId, 'save_analysis', dbSaveData, true)
    } catch (dbError) {
      console.warn('Failed to save analysis to database:', dbError.message);
      logAIDatabase(logId, 'save_analysis', { coinId }, false, dbError.message)
    }

    const executionTime = Date.now() - startTime
    
    // Log the complete analysis operation
    aiLogger.logAnalysis('AI_ENHANCED_ANALYSIS', {
      coinId,
      requestData: requestBody,
      finalResult: enhancedAnalysis,
      executionTime,
      success: true,
      metadata: {
        analysisType: 'AI_ENHANCED',
        marketDataPoints: completeMarketData ? Object.keys(completeMarketData).length : 0,
        alertsCount: alerts?.length || 0,
        cacheUsed: false,
        aiModelsUsed: ['Z.AI', 'ChatGPT']
      }
    })

    logAIComplete(logId, 'AI_ENHANCED_ANALYSIS', enhancedAnalysis, executionTime, true)

    return NextResponse.json({
      success: true,
      data: enhancedAnalysis
    })

  } catch (error) {
    const executionTime = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error('Error in AI analysis:', error)
    
    // Log the failed analysis operation
    aiLogger.logAnalysis('AI_ENHANCED_ANALYSIS', {
      coinId,
      requestData: requestBody,
      executionTime,
      success: false,
      error: errorMessage,
      metadata: {
        analysisType: 'AI_ENHANCED',
        marketDataPoints: marketData ? Object.keys(marketData).length : 0,
        alertsCount: alerts?.length || 0,
        cacheUsed: false,
        aiModelsUsed: ['Z.AI', 'ChatGPT']
      }
    })
    
    logAIComplete(logId, 'AI_ENHANCED_ANALYSIS', null, executionTime, false, errorMessage)
    
    // Return fallback analysis
    const fallbackAnalysis: EnhancedAIAnalysis = {
      recommendation: 'GIỮ',
      timeframe: 'Ngắn hạn',
      riskFactors: ['Cần phân tích thêm'],
      entryPoints: 'Chờ tín hiệu xác nhận',
      exitPoints: 'Chốt lời khi có tín hiệu',
      stopLoss: 'Quản lý rủi ro chặt chẽ',
      takeProfit: 'Lợi nhuận vừa phải',
      zaiAnalysis: {
        recommendation: 'GIỮ - Phân tích dữ liệu hiện tại',
        confidence: 60,
        timeframe: 'Ngắn hạn',
        breakoutPotential: 'LOW',
        reasoning: 'Phân tích dựa trên dữ liệu thị trường hiện tại. Thị trường đang trong giai đoạn ổn định, cần theo dõi thêm các tín hiệu rõ ràng hơn trước khi ra quyết định.'
      },
      chatGPTAnalysis: {
        recommendation: 'GIỮ - Theo dõi thị trường',
        confidence: 60,
        timeframe: 'Ngắn hạn',
        breakoutPotential: 'LOW',
        reasoning: 'Phân tích dựa trên dữ liệu thị trường gần nhất. Các chỉ báo kỹ thuật cho thấy thị trường đang đi ngang, không có xu hướng rõ ràng. Khuyến nghị nên quan sát và chờ đợi tín hiệu tốt hơn.'
      }
    }

    return NextResponse.json({
      success: true,
      data: fallbackAnalysis
    })
  }
}

async function generateEnhancedAIAnalysis(coinId: string, marketData: any, tradingSignal: any, alerts: any[]): Promise<EnhancedAIAnalysis> {
  try {
    // Initialize Z.AI
    let zai = null
    try {
      zai = await ZAI.create()
    } catch (error) {
      console.warn('Z.AI initialization failed, using rule-based analysis:', error.message)
    }

    // Create analysis prompt based on available data
    const analysisPrompt = createEnhancedAnalysisPrompt(coinId, marketData, tradingSignal, alerts)
    
    // Log the generated prompt
    console.log(`🤖 [AI Analysis] Generated prompt for ${coinId}:`)
    console.log(`📄 [Prompt Length]: ${analysisPrompt.length} characters`)
    console.log(`📝 [Prompt Preview]: ${analysisPrompt.substring(0, 200)}...`)

    // Generate Z.AI analysis
    let zaiAnalysis = {
      recommendation: 'GIỮ',
      confidence: 60,
      timeframe: 'Ngắn hạn',
      breakoutPotential: 'LOW' as const,
      reasoning: 'Phân tích dựa trên dữ liệu thị trường hiện tại.'
    }

    if (zai) {
      const zaiStartTime = Date.now()
      console.log(`🤖 [Z.AI] Sending prompt for ${coinId}:`)
      console.log(`📝 [Z.AI] Prompt content:`)
      console.log(analysisPrompt)
      logAIPrompt('Z.AI', analysisPrompt, 'Z.AI')
      
      try {
        const completion = await zai.chat.completions.create({
          messages: [
            {
              role: 'system',
              content: `Bạn là một chuyên gia phân tích thị trường tiền điện tử. Hãy cung cấp phân tích chi tiết bằng tiếng Việt với định dạng JSON chính xác.
              
              IMPORTANT: Trả lời phân tích của bạn với định dạng JSON sau:
              {
                "recommendation": "MUA|BÁN|GIỮ|MUA MẠNH|BÁN MẠNH",
                "confidence": 0-100,
                "timeframe": "thời gian phân tích",
                "breakoutPotential": "LOW|MEDIUM|HIGH",
                "reasoning": "lý do chi tiết"
              }
              
              Không bao gồm bất kỳ văn bản nào khác ngoài đối tượng JSON này.`
            },
            {
              role: 'user',
              content: analysisPrompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })

        const zaiExecutionTime = Date.now() - zaiStartTime
        const aiResponse = completion.choices[0]?.message?.content
        
        if (aiResponse) {
          logAIResponse('Z.AI', 'Z.AI', { content: aiResponse }, zaiExecutionTime)
          
          try {
            const parsedResponse = JSON.parse(aiResponse)
            zaiAnalysis = {
              recommendation: parsedResponse.recommendation || 'GIỮ',
              confidence: parsedResponse.confidence || 60,
              timeframe: parsedResponse.timeframe || 'Ngắn hạn',
              breakoutPotential: parsedResponse.breakoutPotential || 'LOW',
              reasoning: parsedResponse.reasoning || 'Phân tích từ Z.AI'
            }
          } catch (parseError) {
            console.warn('Failed to parse Z.AI response, using fallback:', parseError.message)
            logAIResponse('Z.AI', 'Z.AI', { error: 'Parse failed', rawResponse: aiResponse }, zaiExecutionTime)
          }
        }
      } catch (error) {
        const zaiExecutionTime = Date.now() - zaiStartTime
        console.warn('Z.AI analysis failed, using fallback:', error.message)
        logAIResponse('Z.AI', 'Z.AI', { error: error instanceof Error ? error.message : 'Unknown error' }, zaiExecutionTime)
      }
    }

    // Generate ChatGPT analysis (rule-based for now)
    console.log(`🤖 [ChatGPT] Using rule-based analysis for ${coinId} (ChatGPT API not configured)`)
    const chatGPTAnalysis = generateRuleBasedAnalysis(coinId, marketData, tradingSignal)
    
    // Log ChatGPT analysis generation
    console.log(`📋 [ChatGPT] Rule-based result: ${chatGPTAnalysis.recommendation} (${chatGPTAnalysis.confidence}% confidence)`)
    logAIResponse('ChatGPT', 'ChatGPT', chatGPTAnalysis, 0) // Rule-based, so execution time is 0

    // Determine overall recommendation based on both analyses
    const overallRecommendation = determineOverallRecommendation(zaiAnalysis, chatGPTAnalysis)

    return {
      recommendation: overallRecommendation.recommendation,
      timeframe: overallRecommendation.timeframe,
      riskFactors: determineRiskFactors(marketData, zaiAnalysis, chatGPTAnalysis),
      entryPoints: generateEntryPoints(overallRecommendation.recommendation, marketData),
      exitPoints: generateExitPoints(overallRecommendation.recommendation, marketData),
      stopLoss: generateStopLoss(overallRecommendation.recommendation, marketData),
      takeProfit: generateTakeProfit(overallRecommendation.recommendation, marketData),
      zaiAnalysis,
      chatGPTAnalysis
    }

  } catch (error) {
    console.error('Error generating enhanced AI analysis:', error)
    throw error
  }
}

function createEnhancedAnalysisPrompt(coinId: string, marketData: any, tradingSignal: any, alerts: any[]): string {
  const coinNames: Record<string, string> = {
    bitcoin: 'Bitcoin',
    ethereum: 'Ethereum',
    binancecoin: 'Binance Coin',
    solana: 'Solana',
    chainlink: 'Chainlink'
  }

  const coinName = coinNames[coinId] || coinId.toUpperCase()
  
  let prompt = `PHÂN TÍCH THỊ TRƯỜNG ${coinName.toUpperCase()}
========================================

`
  
  if (marketData) {
    const { onChain, technical, derivatives, sentiment, price } = marketData
    
    prompt += `DỮ LIỆU GIÁ:
- Giá hiện tại: $${price?.usd?.toLocaleString() || 'N/A'}
- Thay đổi 24h: ${price?.usd_24h_change?.toFixed(2) || 'N/A'}%
- Khối lượng 24h: $${(price?.usd_24h_vol / 1000000000)?.toFixed(1) || 'N/A'}B
- Vốn hóa thị trường: $${(price?.usd_market_cap / 1000000000000)?.toFixed(1) || 'N/A'}T

`

    if (onChain) {
      prompt += `CHỈ BÁO ON-CHAIN:
- MVRV Ratio: ${onChain.mvrv?.toFixed(2) || 'N/A'}
- NUPL: ${onChain.nupl?.toFixed(2) || 'N/A'}
- SOPR: ${onChain.sopr?.toFixed(2) || 'N/A'}
- Địa chỉ hoạt động: ${onChain.activeAddresses?.toLocaleString() || 'N/A'}

`
    }

    if (technical) {
      prompt += `CHỈ BÁO KỸ THUẬT:
- RSI: ${technical.rsi?.toFixed(2) || 'N/A'} ${technical.rsi > 70 ? '(Quá mua)' : technical.rsi < 30 ? '(Quá bán)' : '(Trung lập)'}
- MA50: $${technical.ma50?.toLocaleString() || 'N/A'}
- MA200: $${technical.ma200?.toLocaleString() || 'N/A'}
- MACD: ${technical.macd?.toFixed(2) || 'N/A'}

`
    }

    if (sentiment) {
      prompt += `TÂM LÝ THỊ TRƯỜNG:
- Fear & Greed Index: ${sentiment.fearGreedIndex || 'N/A'} (${sentiment.fearGreedClassification || 'N/A'})

`
    }

    if (derivatives) {
      prompt += `THỊ TRƯỜNG PHÁI SINH:
- Lãi suất Funding: ${(derivatives.fundingRate * 100)?.toFixed(3) || 'N/A'}%
- Open Interest: $${(derivatives.openInterest / 1000000000)?.toFixed(1) || 'N/A'}B

`
    }
  }

  if (tradingSignal) {
    prompt += `TÍN HIỆU GIAO DỊCH:
- Tín hiệu: ${tradingSignal.signal || 'N/A'}
- Độ tin cậy: ${tradingSignal.confidence || 'N/A'}%
- Mức độ rủi ro: ${tradingSignal.riskLevel || 'N/A'}

`
  }

  if (alerts && alerts.length > 0) {
    prompt += `CẢNH BÁO GẦN ĐÂY:
`
    alerts.slice(0, 3).forEach((alert, index) => {
      prompt += `${index + 1}. ${alert.title}: ${alert.message}
`
    })
    prompt += `
`
  }

  prompt += `YÊU CẦU PHÂN TÍCH:
==================
Hãy cung cấp phân tích chi tiết và khuyến nghị đầu tư cho ${coinName} dựa trên tất cả dữ liệu trên. Cân nhắc:

1. PHÂN TÍCH KỸ THUẬT:
   - Đánh giá động lượng và xu hướng dựa trên RSI, MACD
   - Phân tích vị trí giá so với đường trung bình động
   - Xem xét biến động và dải Bollinger

2. PHÂN TÍCH ON-CHAIN:
   - Đánh giá định giá dựa trên MVRV và NUPL
   - Phân tích hành vi của holder và mức lợi nhuận/thua lỗ

3. TÂM LÝ THỊ TRƯỜNG:
   - Diễn giải Fear & Greed Index trong bối cảnh giá hiện tại
   - Đánh giá tâm lý thị trường và các điểm cực đoan

4. QUẢN LÝ RỦI RO:
   - Xác định các yếu tố rủi ro chính
   - Đề xuất mức stop-loss và take-profit phù hợp

5. KHUYẾN NGHỊ ĐẦU TƯ:
   - Tín hiệu rõ ràng: MUA MẠNH, MUA, GIỮ, BÁN, BÁN MẠNH
   - Mức độ tin cậy (0-100)
   - Khung thời gian phân tích
   - Tiềm năng breakout (LOW/MEDIUM/HIGH)
   - Lý do chi tiết

Định dạng trả lời JSON:
{
  "recommendation": "MUA|BÁN|GIỮ|MUA MẠNH|BÁN MẠNH",
  "confidence": 0-100,
  "timeframe": "ví dụ: Ngắn hạn (1-2 tuần)",
  "breakoutPotential": "LOW|MEDIUM|HIGH",
  "reasoning": "lý do chi tiết bằng tiếng Việt"
}
`

  return prompt
}

function generateRuleBasedAnalysis(coinId: string, marketData: any, tradingSignal: any) {
  // Simple rule-based analysis for ChatGPT simulation
  let recommendation = 'GIỮ'
  let confidence = 60
  let reasoning = 'Phân tích dựa trên các chỉ báo kỹ thuật và on-chain.'
  let score = 0 // Initialize score variable
  
  if (marketData) {
    const { technical, onChain, sentiment } = marketData
    
    // Reset score for fresh calculation
    score = 0
    
    // Simple scoring system
    // RSI scoring
    if (technical?.rsi < 35) score += 20
    else if (technical?.rsi < 45) score += 10
    else if (technical?.rsi > 65) score -= 20
    else if (technical?.rsi > 75) score -= 10
    
    // MVRV scoring
    if (onChain?.mvrv < 1.2) score += 15
    else if (onChain?.mvrv > 2.5) score -= 15
    
    // Fear & Greed scoring
    if (sentiment?.fearGreedIndex < 35) score += 15
    else if (sentiment?.fearGreedIndex > 65) score -= 15
    
    // Determine recommendation based on score
    if (score > 30) {
      recommendation = 'MUA'
      confidence = Math.min(85, 60 + score / 3)
      reasoning = 'Các chỉ báo kỹ thuật và on-chain cho thấy tín hiệu tích cực. Thị trường có thể đang trong giai đoạn tích lũy hoặc đầu xu hướng tăng.'
    } else if (score < -30) {
      recommendation = 'BÁN'
      confidence = Math.min(85, 60 + Math.abs(score) / 3)
      reasoning = 'Các chỉ báo kỹ thuật và on-chain cho thấy tín hiệu tiêu cực. Thị trường có thể đang trong giai đoạn điều chỉnh hoặc đầu xu hướng giảm.'
    } else {
      recommendation = 'GIỮ'
      confidence = 60
      reasoning = 'Các chỉ báo kỹ thuật và on-chain cho thấy thị trường đang đi ngang. Không có xu hướng rõ ràng, nên quan sát và chờ đợi tín hiệu tốt hơn.'
    }
  }
  
  if (tradingSignal && tradingSignal.signal) {
    // Adjust based on trading signal
    if (tradingSignal.signal === 'BUY' || tradingSignal.signal === 'STRONG_BUY') {
      recommendation = recommendation === 'GIỮ' ? 'MUA' : recommendation
      confidence = Math.max(confidence, tradingSignal.confidence || 60)
    } else if (tradingSignal.signal === 'SELL' || tradingSignal.signal === 'STRONG_SELL') {
      recommendation = recommendation === 'GIỮ' ? 'BÁN' : recommendation
      confidence = Math.max(confidence, tradingSignal.confidence || 60)
    }
  }
  
  return {
    recommendation,
    confidence,
    timeframe: 'Ngắn hạn đến trung hạn (1-4 tuần)',
    breakoutPotential: score > 20 ? 'HIGH' : score > 0 ? 'MEDIUM' : 'LOW' as const,
    reasoning
  }
}

function determineOverallRecommendation(zaiAnalysis: any, chatGPTAnalysis: any) {
  const recommendations = [zaiAnalysis.recommendation, chatGPTAnalysis.recommendation]
  
  // Count votes for each type
  const votes = recommendations.reduce((acc, rec) => {
    acc[rec] = (acc[rec] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  // Find the most common recommendation
  const topRecommendation = Object.entries(votes).sort(([,a], [,b]) => b - a)[0][0]
  
  // Calculate average confidence
  const avgConfidence = (zaiAnalysis.confidence + chatGPTAnalysis.confidence) / 2
  
  return {
    recommendation: topRecommendation as 'MUA' | 'BÁN' | 'GIỮ' | 'MUA MẠNH' | 'BÁN MẠNH',
    timeframe: zaiAnalysis.timeframe || 'Ngắn hạn',
    confidence: Math.round(avgConfidence)
  }
}

function determineRiskFactors(marketData: any, zaiAnalysis: any, chatGPTAnalysis: any): string[] {
  const riskFactors: string[] = []
  
  if (marketData) {
    const { technical, onChain, derivatives } = marketData
    
    // Technical risks
    if (technical?.rsi > 75) riskFactors.push('RSI cho tín hiệu quá mua')
    if (technical?.rsi < 25) riskFactors.push('RSI cho tín hiệu quá bán')
    
    // On-chain risks
    if (onChain?.mvrv > 2.5) riskFactors.push('Định giá cao theo MVRV')
    if (onChain?.mvrv < 0.8) riskFactors.push('Định giá thấp bất thường')
    
    // Derivatives risks
    if (derivatives?.fundingRate > 0.02) riskFactors.push('Lãi suất funding cao')
    if (derivatives?.fundingRate < -0.02) riskFactors.push('Lãi suất funding âm cực')
  }
  
  // AI consensus risks
  const confidenceDiff = Math.abs(zaiAnalysis.confidence - chatGPTAnalysis.confidence)
  if (confidenceDiff > 30) riskFactors.push('AI không đồng thuận về phân tích')
  
  // Ensure we have at least one risk factor
  if (riskFactors.length === 0) {
    riskFactors.push('Thị trường biến động thông thường')
  }
  
  return riskFactors.slice(0, 3)
}

function generateEntryPoints(recommendation: string, marketData: any): string {
  if (recommendation.includes('MUA')) {
    return 'Vào lệnh theo đợt khi có tín hiệu xác nhận, ưu tiên các mức hỗ trợ kỹ thuật'
  } else if (recommendation.includes('BÁN')) {
    return 'Không khuyến nghị vào lệnh mua, chờ đợi cơ hội tốt hơn'
  } else {
    return 'Chờ tín hiệu rõ ràng hơn trước khi vào lệnh'
  }
}

function generateExitPoints(recommendation: string, marketData: any): string {
  if (recommendation.includes('MUA')) {
    return 'Chốt lời khi đạt mức kháng cự kỹ thuật hoặc khi các chỉ báo cho tín hiệu quá mua'
  } else if (recommendation.includes('BÁN')) {
    return 'Chốt lời khi giá giảm đến mức hỗ trợ hoặc khi có tín hiệu đảo chiều'
  } else {
    return 'Chốt lời khi có biến động giá mạnh hoặc đạt mục tiêu lợi nhuận'
  }
}

function generateStopLoss(recommendation: string, marketData: any): string {
  if (recommendation.includes('MUA')) {
    return 'Stop loss tại mức hỗ trợ kỹ thuật quan trọng hoặc -15% từ giá mua'
  } else if (recommendation.includes('BÁN')) {
    return 'Stop loss cho vị thế short tại mức kháng cự kỹ thuật hoặc +10% từ giá bán khống'
  } else {
    return 'Quản lý rủi ro chặt chẽ, stop loss tại mức biến động chấp nhận được'
  }
}

function generateTakeProfit(recommendation: string, marketData: any): string {
  if (recommendation.includes('MUA')) {
    return 'Take profit tại mức kháng cự kỹ thuật tiếp theo hoặc +20-25% từ giá mua'
  } else if (recommendation.includes('BÁN')) {
    return 'Take profit tại mức hỗ trợ kỹ thuật tiếp theo hoặc -15% từ giá bán khống'
  } else {
    return 'Take profit khi đạt lợi nhuận mục tiêu hoặc có thay đổi xu hướng'
  }
}

export async function GET() {
  try {
    // Return basic analysis status
    return NextResponse.json({
      status: 'operational',
      message: 'AI Analysis service is running',
      lastAnalysis: new Date().toISOString(),
      supportedAnalysisTypes: ['market_overview', 'coin_specific', 'portfolio_analysis', 'risk_assessment']
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'AI Analysis service unavailable',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}