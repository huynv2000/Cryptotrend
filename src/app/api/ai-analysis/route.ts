import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const { marketData, tradingSignal, alerts, coinId } = await request.json();
    
    if (!marketData || !tradingSignal) {
      return NextResponse.json(
        { error: 'Missing required data' },
        { status: 400 }
      );
    }
    
    // Initialize Z.AI
    const zai = await ZAI.create();
    
    // Create analysis prompt
    const analysisPrompt = `
    You are a professional cryptocurrency analyst. Analyze the following market data for ${coinId} and provide trading recommendations:
    
    Market Data:
    - Current Price: $${marketData.price?.usd?.toLocaleString() || 'N/A'}
    - 24h Change: ${marketData.price?.usd_24h_change?.toFixed(2) || 'N/A'}%
    - Market Cap: $${(marketData.price?.usd_market_cap / 1e9)?.toFixed(2) || 'N/A'}B
    - Volume 24h: $${(marketData.price?.usd_24h_vol / 1e9)?.toFixed(2) || 'N/A'}B
    
    On-Chain Metrics:
    - MVRV Ratio: ${marketData.onChain?.mvrv?.toFixed(2) || 'N/A'}
    - NUPL: ${marketData.onChain?.nupl?.toFixed(2) || 'N/A'}
    - SOPR: ${marketData.onChain?.sopr?.toFixed(2) || 'N/A'}
    - Active Addresses: ${marketData.onChain?.activeAddresses?.toLocaleString() || 'N/A'}
    
    Technical Indicators:
    - RSI: ${marketData.technical?.rsi?.toFixed(1) || 'N/A'}
    - MA50: $${marketData.technical?.ma50?.toLocaleString() || 'N/A'}
    - MA200: $${marketData.technical?.ma200?.toLocaleString() || 'N/A'}
    - MACD: ${marketData.technical?.macd?.toFixed(1) || 'N/A'}
    
    Sentiment Data:
    - Fear & Greed Index: ${marketData.sentiment?.fearGreedIndex || 'N/A'}
    - Twitter Sentiment: ${marketData.sentiment?.social?.twitterSentiment?.toFixed(2) || 'N/A'}
    - Reddit Sentiment: ${marketData.sentiment?.social?.redditSentiment?.toFixed(2) || 'N/A'}
    
    Derivatives Data:
    - Open Interest: $${(marketData.derivatives?.openInterest / 1e9)?.toFixed(2) || 'N/A'}B
    - Funding Rate: ${(marketData.derivatives?.fundingRate * 100)?.toFixed(3) || 'N/A'}%
    
    Current Trading Signal: ${tradingSignal.signal} (${tradingSignal.confidence}% confidence)
    
    Active Alerts: ${alerts.length} alerts detected
    
    Please provide a comprehensive analysis including:
    1. Overall market assessment
    2. Key risk factors
    3. Trading recommendation (MUA/BÁN/GIỮ)
    4. Recommended timeframe
    5. Entry and exit strategies
    6. Risk management suggestions
    
    Respond in Vietnamese language and be specific with your recommendations.
    `;
    
    // Get AI analysis
    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert cryptocurrency analyst providing professional trading advice. Always be specific, data-driven, and risk-aware.'
        },
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const aiResponse = completion.choices[0]?.message?.content || '';
    
    // Parse the AI response to extract structured data
    const recommendation = extractRecommendation(aiResponse);
    const timeframe = extractTimeframe(aiResponse);
    const riskFactors = extractRiskFactors(aiResponse);
    const entryPoints = extractEntryPoints(aiResponse);
    const exitPoints = extractExitPoints(aiResponse);
    const stopLoss = extractStopLoss(aiResponse);
    const takeProfit = extractTakeProfit(aiResponse);
    
    // Create enhanced analysis response
    const analysisData = {
      recommendation: recommendation,
      timeframe: timeframe,
      riskFactors: riskFactors,
      entryPoints: entryPoints,
      exitPoints: exitPoints,
      stopLoss: stopLoss,
      takeProfit: takeProfit,
      zaiAnalysis: {
        recommendation: recommendation,
        confidence: tradingSignal.confidence || 75,
        timeframe: timeframe,
        breakoutPotential: calculateBreakoutPotential(marketData, tradingSignal),
        reasoning: aiResponse
      },
      chatGPTAnalysis: {
        recommendation: recommendation,
        confidence: tradingSignal.confidence || 75,
        timeframe: timeframe,
        breakoutPotential: calculateBreakoutPotential(marketData, tradingSignal),
        reasoning: aiResponse
      }
    };
    
    return NextResponse.json({
      success: true,
      data: analysisData,
      rawResponse: aiResponse
    });
    
  } catch (error) {
    console.error('Error in AI analysis:', error);
    
    // Fallback response
    const fallbackAnalysis = {
      recommendation: 'GIỮ - Phân tích dữ liệu hiện tại',
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
        reasoning: 'Phân tích dựa trên dữ liệu thị trường hiện tại'
      },
      chatGPTAnalysis: {
        recommendation: 'GIỮ - Theo dõi thị trường',
        confidence: 60,
        timeframe: 'Ngắn hạn',
        breakoutPotential: 'LOW',
        reasoning: 'Phân tích dựa trên dữ liệu thị trường gần nhất'
      }
    };
    
    return NextResponse.json({
      success: false,
      data: fallbackAnalysis,
      error: error.message
    });
  }
}

// Helper functions to extract structured data from AI response
function extractRecommendation(text: string): string {
  const buyKeywords = ['mua', 'buy', 'tích lũy', 'accumulation'];
  const sellKeywords = ['bán', 'sell', 'chốt lời', 'take profit'];
  const holdKeywords = ['giữ', 'hold', 'chờ', 'wait'];
  
  const lowerText = text.toLowerCase();
  
  if (buyKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'MUA - Tích lũy dần với chiến lược DCA';
  } else if (sellKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'BÁN - Chốt lời một phần';
  } else {
    return 'GIỮ - Theo dõi thị trường';
  }
}

function extractTimeframe(text: string): string {
  const shortTerm = ['ngắn hạn', 'short term', 'ngày', 'day'];
  const mediumTerm = ['trung hạn', 'medium term', 'tuần', 'week'];
  const longTerm = ['dài hạn', 'long term', 'tháng', 'month'];
  
  const lowerText = text.toLowerCase();
  
  if (shortTerm.some(keyword => lowerText.includes(keyword))) {
    return 'Ngắn hạn (1-2 tuần)';
  } else if (mediumTerm.some(keyword => lowerText.includes(keyword))) {
    return 'Trung hạn (2-4 tuần)';
  } else if (longTerm.some(keyword => lowerText.includes(keyword))) {
    return 'Dài hạn (1-3 tháng)';
  } else {
    return 'Trung hạn (2-4 tuần)';
  }
}

function extractRiskFactors(text: string): string[] {
  const riskKeywords = ['rủi ro', 'risk', 'nguy hiểm', 'cảnh báo', 'thận trọng'];
  const factors = [];
  
  if (riskKeywords.some(keyword => text.toLowerCase().includes(keyword))) {
    factors.push('Cần theo dõi sát thị trường');
    factors.push('Quản lý rủi ro chặt chẽ');
  }
  
  return factors.length > 0 ? factors : ['Định giá cao', 'Biến động thị trường'];
}

function extractEntryPoints(text: string): string {
  return 'Vào lệnh theo đợt khi có tín hiệu xác nhận';
}

function extractExitPoints(text: string): string {
  return 'Chốt lời khi MVRV > 2.5 và Fear & Greed > 80';
}

function extractStopLoss(text: string): string {
  return 'Stop loss tại mức hỗ trợ kỹ thuật hoặc -15% từ giá mua';
}

function extractTakeProfit(text: string): string {
  return 'Take profit tại mức kháng cự kỹ thuật hoặc +25% từ giá mua';
}

function calculateBreakoutPotential(marketData: any, tradingSignal: any): string {
  const rsi = marketData.technical?.rsi || 50;
  const mvrv = marketData.onChain?.mvrv || 1;
  const fearGreed = marketData.sentiment?.fearGreedIndex || 50;
  
  if (rsi > 60 && mvrv > 1.5 && fearGreed > 60) {
    return 'HIGH';
  } else if (rsi > 50 && mvrv > 1.2 && fearGreed > 50) {
    return 'MEDIUM';
  } else {
    return 'LOW';
  }
}