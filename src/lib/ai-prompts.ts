/**
 * AI Prompt Templates for Crypto Market Analysis
 * Professional prompts designed for comprehensive market analysis
 */

export interface AIPromptContext {
  coinId: string;
  coinName: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  
  // On-chain Metrics
  mvrv: number;
  nupl: number;
  sopr: number;
  activeAddresses: number;
  exchangeInflow: number;
  exchangeOutflow: number;
  transactionVolume: number;
  
  // Technical Indicators
  rsi: number;
  ma50: number;
  ma200: number;
  macd: number;
  bollingerUpper: number;
  bollingerLower: number;
  
  // Sentiment Data
  fearGreedIndex: number;
  fearGreedClassification: string;
  twitterSentiment: number;
  redditSentiment: number;
  socialVolume: number;
  newsSentiment: number;
  newsVolume: number;
  googleTrendsScore: number;
  googleTrendsDirection: string;
  
  // Derivatives Data
  fundingRate: number;
  openInterest: number;
  liquidationVolume: number;
  putCallRatio: number;
  
  // Trading Signal
  tradingSignal: string;
  signalConfidence: number;
  signalRisk: string;
}

export interface AIAnalysisResult {
  provider: 'Z.AI' | 'ChatGPT';
  trendAnalysis: string;
  buyRecommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number;
  reasoning: string;
  breakoutPotential: 'HIGH' | 'MEDIUM' | 'LOW';
  breakoutReasoning: string;
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  timeHorizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  riskFactors: string[];
  opportunities: string[];
  marketRegime: 'BULLISH' | 'BEARISH' | 'RANGING' | 'VOLATILE';
}

export class AIPromptTemplates {
  /**
   * Comprehensive Market Analysis Prompt
   * Designed for deep technical and fundamental analysis
   */
  static getComprehensiveAnalysisPrompt(context: AIPromptContext): string {
    return `You are a professional cryptocurrency market analyst with 10+ years of experience in technical analysis, on-chain metrics, and market sentiment analysis. 

Analyze the following comprehensive market data for ${context.coinName} (${context.coinId.toUpperCase()}) and provide detailed investment insights:

**MARKET OVERVIEW:**
- Current Price: $${context.currentPrice.toLocaleString()}
- 24h Change: ${context.priceChange24h > 0 ? '+' : ''}${context.priceChange24h.toFixed(2)}%
- Market Cap: $${(context.marketCap / 1000000000).toFixed(1)}B
- 24h Volume: $${(context.volume24h / 1000000000).toFixed(1)}B

**ON-CHAIN ANALYSIS:**
- MVRV Ratio: ${context.mvrv.toFixed(2)} (${context.mvrv < 1 ? 'Undervalued' : context.mvrv < 1.5 ? 'Fair Value' : context.mvrv < 2 ? 'Overvalued' : 'Expensive'})
- NUPL: ${context.nupl.toFixed(2)} (${context.nupl < 0 ? 'Capitulation' : context.nupl < 0.5 ? 'Hope' : context.nupl < 0.75 ? 'Optimism' : 'Euphoria'})
- SOPR: ${context.sopr.toFixed(2)} (${context.sopr < 1 ? 'Loss Taking' : 'Profit Taking'})
- Active Addresses: ${context.activeAddresses.toLocaleString()}
- Exchange Flow: Inflow ${context.exchangeInflow.toLocaleString()} / Outflow ${context.exchangeOutflow.toLocaleString()} (${context.exchangeInflow > context.exchangeOutflow ? 'Net Inflow' : 'Net Outflow'})
- Transaction Volume: $${(context.transactionVolume / 1000000000).toFixed(1)}B

**TECHNICAL INDICATORS:**
- RSI: ${context.rsi.toFixed(1)} (${context.rsi >= 70 ? 'Overbought' : context.rsi <= 30 ? 'Oversold' : 'Neutral'})
- MA50 vs MA200: ${context.ma50 > context.ma200 ? 'Golden Cross (Bullish)' : 'Death Cross (Bearish)'} (MA50: $${context.ma50.toLocaleString()}, MA200: $${context.ma200.toLocaleString()})
- MACD: ${context.macd > 0 ? 'Bullish' : 'Bearish'} (${context.macd.toFixed(2)})
- Bollinger Bands: Upper $${context.bollingerUpper.toLocaleString()}, Middle $${context.bollingerMiddle.toLocaleString()}, Lower $${context.bollingerLower.toLocaleString()}

**MARKET SENTIMENT:**
- Fear & Greed Index: ${context.fearGreedIndex} (${context.fearGreedClassification})
- Social Sentiment: Twitter ${context.twitterSentiment.toFixed(2)}, Reddit ${context.redditSentiment.toFixed(2)}
- Social Volume: ${context.socialVolume.toLocaleString()} mentions
- News Sentiment: ${context.newsSentiment.toFixed(2)} (${context.newsVolume} articles)
- Google Trends: Score ${context.googleTrendsScore}/100 (${context.googleTrendsDirection})

**DERIVATIVES MARKET:**
- Funding Rate: ${(context.fundingRate * 100).toFixed(3)}% (${context.fundingRate > 0 ? 'Longs pay Shorts' : 'Shorts pay Longs'})
- Open Interest: $${(context.openInterest / 1000000000).toFixed(1)}B
- Liquidation Volume: $${(context.liquidationVolume / 1000000).toFixed(1)}M
- Put/Call Ratio: ${context.putCallRatio.toFixed(2)} (${context.putCallRatio < 1 ? 'Bullish' : 'Bearish'})

**CURRENT TRADING SIGNAL:**
- Signal: ${context.tradingSignal}
- Confidence: ${context.signalConfidence}%
- Risk Level: ${context.signalRisk}

Please provide a comprehensive analysis covering:

1. **TREND ANALYSIS**: What is the current market trend and what are the key driving factors?

2. **BREAKOUT POTENTIAL**: Is there potential for a significant price breakout? What are the key levels to watch?

3. **INVESTMENT RECOMMENDATION**: Based on all factors, should investors BUY, HOLD, or SELL? Provide clear reasoning.

4. **KEY LEVELS**: Identify critical support and resistance levels for the next 30 days.

5. **RISK FACTORS**: What are the main risks that could negatively impact the price?

6. **OPPORTUNITIES**: What are the potential catalysts that could drive price appreciation?

7. **MARKET REGIME**: What is the current market regime (Bullish, Bearish, Ranging, Volatile)?

8. **TIME HORIZON**: What is the recommended investment time horizon?

Format your response as a structured JSON object with the following fields:
{
  "trendAnalysis": "Detailed trend analysis...",
  "buyRecommendation": "STRONG_BUY|BUY|HOLD|SELL|STRONG_SELL",
  "confidence": 0-100,
  "reasoning": "Detailed reasoning...",
  "breakoutPotential": "HIGH|MEDIUM|LOW",
  "breakoutReasoning": "Breakout analysis...",
  "keyLevels": {
    "support": [level1, level2, level3],
    "resistance": [level1, level2, level3]
  },
  "timeHorizon": "SHORT_TERM|MEDIUM_TERM|LONG_TERM",
  "riskFactors": ["risk1", "risk2", "risk3"],
  "opportunities": ["opportunity1", "opportunity2", "opportunity3"],
  "marketRegime": "BULLISH|BEARISH|RANGING|VOLATILE"
}`;
  }

  /**
   * Quick Analysis Prompt for rapid assessment
   */
  static getQuickAnalysisPrompt(context: AIPromptContext): string {
    return `As a crypto trading expert, provide a quick analysis of ${context.coinName} based on these key metrics:

Price: $${context.currentPrice.toLocaleString()} (${context.priceChange24h > 0 ? '+' : ''}${context.priceChange24h.toFixed(2)}%)
RSI: ${context.rsi.toFixed(1)} | MVRV: ${context.mvrv.toFixed(2)} | Fear & Greed: ${context.fearGreedIndex}
Funding Rate: ${(context.fundingRate * 100).toFixed(3)}% | Signal: ${context.tradingSignal}

Should investors BUY, HOLD, or SELL right now? Provide brief reasoning and identify any immediate breakout potential.

Response format: { "recommendation": "BUY|HOLD|SELL", "reasoning": "...", "breakoutPotential": "HIGH|MEDIUM|LOW" }`;
  }

  /**
   * Breakout Analysis Prompt specifically for breakout detection
   */
  static getBreakoutAnalysisPrompt(context: AIPromptContext): string {
    return `Analyze the breakout potential for ${context.coinName} using these technical and market indicators:

**PRICE ACTION:**
- Current Price: $${context.currentPrice.toLocaleString()}
- 24h Change: ${context.priceChange24h > 0 ? '+' : ''}${context.priceChange24h.toFixed(2)}%

**TECHNICAL SETUP:**
- RSI: ${context.rsi.toFixed(1)} (${context.rsi >= 70 ? 'Overbought' : context.rsi <= 30 ? 'Oversold' : 'Neutral'})
- MA50: $${context.ma50.toLocaleString()} | MA200: $${context.ma200.toLocaleString()}
- MACD: ${context.macd.toFixed(2)} (${context.macd > 0 ? 'Bullish' : 'Bearish'})
- Bollinger Position: Price is ${context.currentPrice > context.bollingerUpper ? 'above upper band' : context.currentPrice < context.bollingerLower ? 'below lower band' : 'within bands'}

**VOLUME & MOMENTUM:**
- 24h Volume: $${(context.volume24h / 1000000000).toFixed(1)}B
- Social Volume: ${context.socialVolume.toLocaleString()} mentions
- Google Trends: ${context.googleTrendsScore}/100 (${context.googleTrendsDirection})

**MARKET SENTIMENT:**
- Fear & Greed: ${context.fearGreedIndex} (${context.fearGreedClassification})
- Twitter Sentiment: ${context.twitterSentiment.toFixed(2)}
- News Sentiment: ${context.newsSentiment.toFixed(2)}

**DERIVATIVES PRESSURE:**
- Funding Rate: ${(context.fundingRate * 100).toFixed(3)}%
- Open Interest: $${(context.openInterest / 1000000000).toFixed(1)}B
- Put/Call Ratio: ${context.putCallRatio.toFixed(2)}

Evaluate the probability of a significant price breakout in the next 7-14 days. Consider:
1. Technical pattern completion
2. Volume confirmation
3. Sentiment alignment
4. Derivatives market pressure
5. On-chain activity

Response format: {
  "breakoutPotential": "HIGH|MEDIUM|LOW",
  "breakoutDirection": "UPWARD|DOWNWARD|SIDEWAYS",
  "confidence": 0-100,
  "keyTrigger": "What would trigger the breakout?",
  "priceTarget": "Target price if breakout occurs",
  "timeframe": "Expected timeframe for breakout"
}`;
  }

  /**
   * Risk Analysis Prompt for comprehensive risk assessment
   */
  static getRiskAnalysisPrompt(context: AIPromptContext): string {
    return `Conduct a comprehensive risk assessment for ${context.coinName} investment:

**CURRENT RISK INDICATORS:**
- Valuation Risk: MVRV ${context.mvrv.toFixed(2)} (${context.mvrv > 2 ? 'High' : context.mvrv > 1.5 ? 'Medium' : 'Low'})
- Profit Realization Risk: NUPL ${context.nupl.toFixed(2)} (${context.nupl > 0.75 ? 'High' : context.nupl > 0.5 ? 'Medium' : 'Low'})
- Technical Risk: RSI ${context.rsi.toFixed(1)} (${context.rsi >= 70 || context.rsi <= 30 ? 'Extreme' : 'Normal'})
- Sentiment Risk: Fear & Greed ${context.fearGreedIndex} (${context.fearGreedIndex >= 80 || context.fearGreedIndex <= 20 ? 'Extreme' : 'Normal'})
- Leverage Risk: Funding Rate ${(context.fundingRate * 100).toFixed(3)}% (${Math.abs(context.fundingRate) > 0.01 ? 'High' : 'Normal'})
- Liquidity Risk: 24h Volume $${(context.volume24h / 1000000000).toFixed(1)}B

**MARKET STRUCTURE RISKS:**
- Exchange Flow Pressure: ${context.exchangeInflow > context.exchangeOutflow ? 'Selling Pressure' : 'Buying Pressure'}
- Derivatives Risk: OI $${(context.openInterest / 1000000000).toFixed(1)}B, Liquidations $${(context.liquidationVolume / 1000000).toFixed(1)}M
- Social Media Risk: Sentiment divergence between Twitter (${context.twitterSentiment.toFixed(2)}) and News (${context.newsSentiment.toFixed(2)})

Identify and rank the top 5 risk factors for ${context.coinName} investors. For each risk, provide:
1. Risk level (HIGH/MEDIUM/LOW)
2. Probability of occurrence (HIGH/MEDIUM/LOW)
3. Potential impact on price (percentage)
4. Mitigation strategies

Response format: {
  "overallRiskLevel": "HIGH|MEDIUM|LOW",
  "riskFactors": [
    {
      "factor": "Risk description",
      "level": "HIGH|MEDIUM|LOW",
      "probability": "HIGH|MEDIUM|LOW",
      "impact": "Estimated percentage impact",
      "mitigation": "How to mitigate this risk"
    }
  ],
  "recommendedPositionSize": "Suggested position size based on risk",
  "stopLossLevel": "Suggested stop loss level"
}`;
  }
}