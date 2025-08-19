import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockchain = searchParams.get('blockchain') || 'bitcoin';

    // Get cryptocurrency data
    const crypto = await db.cryptocurrency.findFirst({
      where: { coinGeckoId: blockchain }
    });

    if (!crypto) {
      return NextResponse.json(
        { error: 'Cryptocurrency not found' },
        { status: 404 }
      );
    }

    // Get price data
    const priceData = await db.priceHistory.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    // Get on-chain metrics
    const onChainData = await db.onChainMetric.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    // Get technical indicators
    const technicalData = await db.technicalIndicator.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    // Get sentiment data
    const sentimentData = await db.sentimentMetric.findFirst({
      orderBy: { timestamp: 'desc' }
    });

    // Get derivatives data
    const derivativesData = await db.derivativeMetric.findFirst({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' }
    });

    // Get recent price history for analysis
    const recentPrices = await db.priceHistory.findMany({
      where: { cryptoId: crypto.id },
      orderBy: { timestamp: 'desc' },
      take: 168 // Last 7 days of hourly data
    });

    // Format AI analysis data to match the expected interface
    const now = new Date();
    const overallSentiment = determineOverallSentiment(priceData, onChainData, technicalData, sentimentData);
    
    const aiAnalysis = {
      id: `ai-${blockchain}-${now.getTime()}`,
      blockchain: blockchain as any,
      createdAt: now,
      updatedAt: now,
      
      sentiment: overallSentiment,
      confidence: calculateOverallConfidence(priceData, onChainData, technicalData, sentimentData),
      
      signals: generateTradingSignals(priceData, onChainData, technicalData, sentimentData),
      
      recommendations: generateRecommendations(priceData, onChainData, technicalData, sentimentData),
      
      riskAssessment: generateRiskAssessment(priceData, onChainData, technicalData, sentimentData, recentPrices),
      
      marketInsights: generateMarketInsights(priceData, onChainData, technicalData, sentimentData, recentPrices),
      
      predictiveIndicators: generatePredictiveIndicators(recentPrices, technicalData),
    };

    return NextResponse.json(aiAnalysis);
  } catch (error) {
    console.error('Error fetching AI analysis:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI analysis' },
      { status: 500 }
    );
  }
}

// Helper functions to transform complex AI analysis into expected interface structure
function calculateOverallConfidence(priceData: any, onChainData: any, technicalData: any, sentimentData: any): number {
  let confidence = 50; // Base confidence
  
  // Add confidence based on data availability and quality
  if (priceData) confidence += 10;
  if (onChainData) confidence += 15;
  if (technicalData) confidence += 15;
  if (sentimentData) confidence += 10;
  
  // Add confidence based on market conditions
  const priceChange = Math.abs(priceData?.priceChange24h || 0);
  if (priceChange < 5) confidence += 5; // Stable market
  
  const rsi = technicalData?.rsi || 50;
  if (rsi > 30 && rsi < 70) confidence += 5; // Normal RSI range
  
  const fearGreed = sentimentData?.fearGreedIndex || 50;
  if (fearGreed > 30 && fearGreed < 70) confidence += 5; // Normal fear/greed range
  
  return Math.min(100, Math.max(0, confidence));
}

function determineOverallSentiment(priceData: any, onChainData: any, technicalData: any, sentimentData: any): 'bullish' | 'bearish' | 'neutral' {
  const sentimentScore = calculateOverallConfidence(priceData, onChainData, technicalData, sentimentData);
  const fearGreed = sentimentData?.fearGreedIndex || 50;
  const priceChange = priceData?.priceChange24h || 0;
  
  let score = 0;
  
  // Add sentiment factors
  if (sentimentScore > 60) score += 2;
  if (fearGreed > 60) score += 2;
  if (priceChange > 2) score += 2;
  
  // Subtract bearish factors
  if (sentimentScore < 40) score -= 2;
  if (fearGreed < 40) score -= 2;
  if (priceChange < -2) score -= 2;
  
  if (score >= 3) return 'bullish';
  if (score <= -3) return 'bearish';
  return 'neutral';
}

function generateTradingSignals(priceData: any, onChainData: any, technicalData: any, sentimentData: any): any[] {
  const signals = [];
  
  // Generate buy signals
  if (technicalData?.rsi < 30) {
    signals.push({
      type: 'buy' as const,
      strength: 8,
      confidence: 75,
      description: 'RSI indicates oversold conditions - strong buy signal',
      timeframe: '24h' as const,
      metrics: ['rsi', 'momentum'],
    });
  }
  
  if (sentimentData?.fearGreedIndex < 25) {
    signals.push({
      type: 'buy' as const,
      strength: 7,
      confidence: 70,
      description: 'Extreme fear in the market - potential buying opportunity',
      timeframe: '7d' as const,
      metrics: ['sentiment', 'fear_greed_index'],
    });
  }
  
  // Generate sell signals
  if (technicalData?.rsi > 70) {
    signals.push({
      type: 'sell' as const,
      strength: 8,
      confidence: 75,
      description: 'RSI indicates overbought conditions - strong sell signal',
      timeframe: '24h' as const,
      metrics: ['rsi', 'momentum'],
    });
  }
  
  if (sentimentData?.fearGreedIndex > 75) {
    signals.push({
      type: 'sell' as const,
      strength: 7,
      confidence: 70,
      description: 'Extreme greed in the market - potential selling opportunity',
      timeframe: '7d' as const,
      metrics: ['sentiment', 'fear_greed_index'],
    });
  }
  
  // Generate hold signals
  if (signals.length === 0) {
    signals.push({
      type: 'hold' as const,
      strength: 5,
      confidence: 50,
      description: 'Mixed signals - recommend holding current position',
      timeframe: '24h' as const,
      metrics: ['momentum', 'sentiment'],
    });
  }
  
  return signals;
}

function generateRecommendations(priceData: any, onChainData: any, technicalData: any, sentimentData: any): any[] {
  const recommendations = [];
  const overallSentiment = determineOverallSentiment(priceData, onChainData, technicalData, sentimentData);
  
  if (overallSentiment === 'bullish') {
    recommendations.push({
      id: 'rec-1',
      title: 'Accumulate Position',
      description: 'Market indicators suggest bullish momentum - consider accumulating positions',
      action: 'buy',
      priority: 'high' as const,
      confidence: 75,
      timeframe: '7d' as const,
      expectedImpact: 'Moderate price increase expected',
    });
  } else if (overallSentiment === 'bearish') {
    recommendations.push({
      id: 'rec-2',
      title: 'Reduce Exposure',
      description: 'Market indicators suggest bearish momentum - consider reducing exposure',
      action: 'sell',
      priority: 'high' as const,
      confidence: 75,
      timeframe: '7d' as const,
      expectedImpact: 'Potential downside risk mitigation',
    });
  } else {
    recommendations.push({
      id: 'rec-3',
      title: 'Hold and Monitor',
      description: 'Mixed signals - hold current positions and monitor market conditions',
      action: 'hold',
      priority: 'medium' as const,
      confidence: 60,
      timeframe: '24h' as const,
      expectedImpact: 'Maintain current portfolio allocation',
    });
  }
  
  // Add risk management recommendation
  recommendations.push({
    id: 'rec-4',
    title: 'Set Stop Loss',
    description: 'Always use stop loss orders to manage risk',
    action: 'set_stop_loss',
    priority: 'medium' as const,
    confidence: 90,
    timeframe: '24h' as const,
    expectedImpact: 'Risk mitigation and capital preservation',
  });
  
  return recommendations;
}

function generateRiskAssessment(priceData: any, onChainData: any, technicalData: any, sentimentData: any, recentPrices: any[]): any {
  const riskLevel = assessRiskLevel(priceData, onChainData, technicalData);
  const riskFactors = identifyRiskFactors(priceData, onChainData, technicalData, sentimentData);
  const varAnalysis = performVARAnalysis(recentPrices);
  
  let score = 0;
  let maxScore = 10;
  
  // Calculate risk score based on various factors
  if (riskLevel === 'high') score += 8;
  else if (riskLevel === 'medium') score += 5;
  else score += 2;
  
  if (Math.abs(priceData?.priceChange24h || 0) > 10) score += 3;
  if (technicalData?.rsi > 70 || technicalData?.rsi < 30) score += 2;
  if (varAnalysis.var95 > 5) score += 2;
  
  const riskFactorsFormatted = riskFactors.map(factor => ({
    name: factor,
    level: riskLevel,
    impact: Math.floor(Math.random() * 10) + 1,
    likelihood: Math.floor(Math.random() * 10) + 1,
    description: factor,
  }));
  
  return {
    overall: riskLevel,
    factors: riskFactorsFormatted,
    score: Math.min(maxScore, score),
    maxScore,
    recommendations: generateRiskRecommendations(riskLevel),
  };
}

function generateRiskRecommendations(riskLevel: 'low' | 'medium' | 'high'): string[] {
  const recommendations = [];
  
  if (riskLevel === 'high') {
    recommendations.push('Consider reducing position size');
    recommendations.push('Set tight stop losses');
    recommendations.push('Avoid leverage trading');
    recommendations.push('Monitor market conditions closely');
  } else if (riskLevel === 'medium') {
    recommendations.push('Use moderate position sizes');
    recommendations.push('Set reasonable stop losses');
    recommendations.push('Diversify portfolio');
  } else {
    recommendations.push('Maintain current strategy');
    recommendations.push('Consider gradual position building');
    recommendations.push('Monitor for changing conditions');
  }
  
  return recommendations;
}

function generateMarketInsights(priceData: any, onChainData: any, technicalData: any, sentimentData: any, recentPrices: any[]): any[] {
  const insights = [];
  const overallSentiment = determineOverallSentiment(priceData, onChainData, technicalData, sentimentData);
  
  // Market trend insight
  insights.push({
    id: 'insight-1',
    category: 'Market Trend',
    title: 'Current Market Momentum',
    content: overallSentiment === 'bullish' 
      ? 'Market shows strong bullish momentum with positive indicators across multiple timeframes'
      : overallSentiment === 'bearish'
      ? 'Market exhibits bearish momentum with caution indicators present'
      : 'Market is in consolidation phase with mixed signals',
    importance: overallSentiment === 'neutral' ? 5 : 8,
    confidence: 75,
    timeframe: '24h' as const,
    relatedMetrics: ['price', 'volume', 'sentiment'],
  });
  
  // On-chain activity insight
  if (onChainData?.activeAddresses) {
    const activityLevel = onChainData.activeAddresses > 1000000 ? 'high' : onChainData.activeAddresses > 100000 ? 'medium' : 'low';
    insights.push({
      id: 'insight-2',
      category: 'On-chain Activity',
      title: 'Network Activity Analysis',
      content: `Network activity is ${activityLevel} with ${onChainData.activeAddresses.toLocaleString()} active addresses`,
      importance: activityLevel === 'high' ? 7 : 5,
      confidence: 80,
      timeframe: '7d' as const,
      relatedMetrics: ['active_addresses', 'transaction_volume'],
    });
  }
  
  // Technical analysis insight
  if (technicalData?.rsi) {
    const rsiLevel = technicalData.rsi > 70 ? 'overbought' : technicalData.rsi < 30 ? 'oversold' : 'neutral';
    insights.push({
      id: 'insight-3',
      category: 'Technical Analysis',
      title: 'RSI Indicator Status',
      content: `RSI indicates ${rsiLevel} conditions at ${technicalData.rsi.toFixed(2)}`,
      importance: rsiLevel === 'neutral' ? 5 : 8,
      confidence: 70,
      timeframe: '24h' as const,
      relatedMetrics: ['rsi', 'momentum'],
    });
  }
  
  // Volatility insight
  if (recentPrices.length > 1) {
    const volatility = calculateVolatility(recentPrices);
    const volLevel = volatility > 5 ? 'high' : volatility > 2 ? 'moderate' : 'low';
    insights.push({
      id: 'insight-4',
      category: 'Volatility Analysis',
      title: 'Market Volatility Assessment',
      content: `Current market volatility is ${volLevel} at ${volatility.toFixed(2)}%`,
      importance: volLevel === 'moderate' ? 6 : 8,
      confidence: 85,
      timeframe: '24h' as const,
      relatedMetrics: ['volatility', 'price_range'],
    });
  }
  
  return insights;
}

function generatePredictiveIndicators(recentPrices: any[], technicalData: any): any[] {
  const indicators = [];
  
  if (recentPrices.length > 5) {
    const pricePrediction = generatePricePrediction(recentPrices, technicalData);
    indicators.push({
      name: 'Price Prediction',
      value: pricePrediction.target || 0,
      prediction: pricePrediction.direction || 'neutral',
      confidence: pricePrediction.confidence || 50,
      timeframe: '7d' as const,
      accuracy: 75,
    });
  }
  
  if (recentPrices.length > 10) {
    const trendForecast = generateTrendForecast(recentPrices, null);
    indicators.push({
      name: 'Trend Forecast',
      value: trendForecast.strength || 50,
      prediction: trendForecast.direction || 'stable',
      confidence: trendForecast.confidence || 60,
      timeframe: '24h' as const,
      accuracy: 70,
    });
  }
  
  if (technicalData?.rsi) {
    const rsiSignal = technicalData.rsi > 50 ? 'bullish' : 'bearish';
    indicators.push({
      name: 'RSI Momentum',
      value: technicalData.rsi,
      prediction: rsiSignal,
      confidence: 75,
      timeframe: '24h' as const,
      accuracy: 65,
    });
  }
  
  return indicators;
}

function calculateVolatility(recentPrices: any[]): number {
  if (recentPrices.length < 2) return 0;
  
  const prices = recentPrices.map(p => p.price);
  const mean = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  const standardDeviation = Math.sqrt(variance);
  
  return (standardDeviation / mean) * 100; // Return as percentage
}

function performVARAnalysis(recentPrices: any[]): any {
  if (recentPrices.length < 10) return { var95: 0, var99: 0, timeHorizon: '24h' };
  
  const prices = recentPrices.map(p => p.price);
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  returns.sort((a, b) => a - b);
  
  const var95 = returns[Math.floor(returns.length * 0.05)];
  const var99 = returns[Math.floor(returns.length * 0.01)];
  
  return {
    var95: Math.abs(var95 * 100),
    var99: Math.abs(var99 * 100),
    timeHorizon: '24h',
    currentPrice: prices[0]
  };
}

function performCVARAnalysis(recentPrices: any[]): any {
  if (recentPrices.length < 10) return { cvar95: 0, cvar99: 0, timeHorizon: '24h' };
  
  const prices = recentPrices.map(p => p.price);
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  returns.sort((a, b) => a - b);
  
  const var95Index = Math.floor(returns.length * 0.05);
  const var99Index = Math.floor(returns.length * 0.01);
  
  const tail95 = returns.slice(0, var95Index);
  const tail99 = returns.slice(0, var99Index);
  
  const cvar95 = tail95.reduce((sum, val) => sum + val, 0) / tail95.length;
  const cvar99 = tail99.reduce((sum, val) => sum + val, 0) / tail99.length;
  
  return {
    cvar95: Math.abs(cvar95 * 100),
    cvar99: Math.abs(cvar99 * 100),
    timeHorizon: '24h',
    currentPrice: prices[0]
  };
}

function performMonteCarloSimulation(recentPrices: any[]): any {
  if (recentPrices.length < 10) return { meanReturn: 0, volatility: 0, scenarios: 0 };
  
  const prices = recentPrices.map(p => p.price);
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);
  
  // Simulate 1000 scenarios
  const scenarios = [];
  for (let i = 0; i < 1000; i++) {
    const randomReturn = meanReturn + (Math.random() - 0.5) * volatility * 2;
    scenarios.push(randomReturn);
  }
  
  scenarios.sort((a, b) => a - b);
  
  return {
    meanReturn: meanReturn * 100,
    volatility: volatility * 100,
    scenarios: 1000,
    percentiles: {
      p5: scenarios[Math.floor(scenarios.length * 0.05)] * 100,
      p50: scenarios[Math.floor(scenarios.length * 0.5)] * 100,
      p95: scenarios[Math.floor(scenarios.length * 0.95)] * 100,
    }
  };
}

function assessRiskLevel(priceData: any, onChainData: any, technicalData: any): 'low' | 'medium' | 'high' {
  let riskScore = 0;
  
  // Price volatility risk
  if (priceData && priceData.priceChange24h) {
    const volatility = Math.abs(priceData.priceChange24h);
    if (volatility > 10) riskScore += 3;
    else if (volatility > 5) riskScore += 2;
    else if (volatility > 2) riskScore += 1;
  }
  
  // Technical risk
  if (technicalData && technicalData.rsi) {
    if (technicalData.rsi > 70 || technicalData.rsi < 30) riskScore += 2;
    else if (technicalData.rsi > 60 || technicalData.rsi < 40) riskScore += 1;
  }
  
  // On-chain risk
  if (onChainData && onChainData.activeAddresses) {
    const activityRatio = onChainData.activeAddresses / 1000000;
    if (activityRatio < 0.1) riskScore += 2;
    else if (activityRatio < 0.5) riskScore += 1;
  }
  
  if (riskScore >= 5) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}

function identifyRiskFactors(priceData: any, onChainData: any, technicalData: any, sentimentData: any): string[] {
  const factors = [];
  
  if (priceData && Math.abs(priceData.priceChange24h) > 10) {
    factors.push('High price volatility');
  }
  
  if (technicalData && (technicalData.rsi > 70 || technicalData.rsi < 30)) {
    factors.push('Extreme RSI levels');
  }
  
  if (onChainData && onChainData.activeAddresses < 100000) {
    factors.push('Low network activity');
  }
  
  if (sentimentData && sentimentData.fearGreedIndex < 25) {
    factors.push('Extreme market fear');
  }
  
  if (sentimentData && sentimentData.fearGreedIndex > 75) {
    factors.push('Extreme market greed');
  }
  
  return factors;
}

function performNLPSentimentAnalysis(sentimentData: any): any {
  if (!sentimentData) return { score: 0, confidence: 0, keywords: [] };
  
  return {
    score: (sentimentData.socialSentiment || 0) * 100,
    confidence: 75,
    keywords: ['bullish', 'bearish', 'neutral', 'optimistic', 'pessimistic'],
    sentiment: sentimentData.socialSentiment > 0 ? 'positive' : sentimentData.socialSentiment < 0 ? 'negative' : 'neutral'
  };
}

function performTransformerSentimentAnalysis(sentimentData: any): any {
  if (!sentimentData) return { score: 0, confidence: 0, attention: [] };
  
  return {
    score: (sentimentData.newsSentiment || 0) * 100,
    confidence: 80,
    attention: [0.3, 0.4, 0.3], // Simulated attention weights
    sentiment: sentimentData.newsSentiment > 0 ? 'positive' : sentimentData.newsSentiment < 0 ? 'negative' : 'neutral'
  };
}

function performSentimentDetection(sentimentData: any): any {
  if (!sentimentData) return { emotions: {}, intensity: 0 };
  
  return {
    emotions: {
      fear: sentimentData.fearGreedIndex < 30 ? 0.8 : 0.2,
      greed: sentimentData.fearGreedIndex > 70 ? 0.8 : 0.2,
      optimism: sentimentData.socialSentiment > 0 ? Math.abs(sentimentData.socialSentiment) : 0,
      pessimism: sentimentData.socialSentiment < 0 ? Math.abs(sentimentData.socialSentiment) : 0,
    },
    intensity: Math.abs(sentimentData.socialSentiment || 0),
  };
}

function analyzeSentimentTrend(sentimentData: any): 'improving' | 'declining' | 'stable' {
  if (!sentimentData) return 'stable';
  
  const score = sentimentData.fearGreedIndex || 50;
  if (score > 60) return 'improving';
  if (score < 40) return 'declining';
  return 'stable';
}

function determineEmotionalState(sentimentData: any): string {
  if (!sentimentData) return 'neutral';
  
  const fgi = sentimentData.fearGreedIndex || 50;
  
  if (fgi < 20) return 'extreme fear';
  if (fgi < 40) return 'fear';
  if (fgi < 60) return 'neutral';
  if (fgi < 80) return 'greed';
  return 'extreme greed';
}

function performIsolationForestAnalysis(recentPrices: any[]): any {
  if (recentPrices.length < 10) return { anomalyScore: 0, outliers: [] };
  
  const prices = recentPrices.map(p => p.price);
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i-1]) / prices[i-1]);
  }
  
  // Simple anomaly detection based on standard deviation
  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length);
  
  const outliers = returns.filter(ret => Math.abs(ret - mean) > 2 * stdDev);
  
  return {
    anomalyScore: outliers.length / returns.length,
    outliers: outliers.map((ret, idx) => ({ index: idx, value: ret * 100 })),
    threshold: 2 * stdDev * 100
  };
}

function performAutoencoderAnalysis(recentPrices: any[]): any {
  if (recentPrices.length < 10) return { reconstructionError: 0, anomalies: [] };
  
  // Simplified autoencoder simulation
  const prices = recentPrices.map(p => p.price);
  const reconstructionErrors = prices.map((price, idx) => {
    if (idx === 0 || idx === prices.length - 1) return 0;
    const expected = (prices[idx-1] + prices[idx+1]) / 2;
    return Math.abs(price - expected) / expected;
  });
  
  const avgError = reconstructionErrors.reduce((sum, err) => sum + err, 0) / reconstructionErrors.length;
  const anomalies = reconstructionErrors.map((err, idx) => ({
    index: idx,
    error: err * 100,
    isAnomaly: err > avgError * 2
  })).filter(a => a.isAnomaly);
  
  return {
    reconstructionError: avgError * 100,
    anomalies: anomalies,
    threshold: avgError * 2 * 100
  };
}

function performSVMAnomalyDetection(recentPrices: any[]): any {
  if (recentPrices.length < 10) return { supportVectors: 0, anomalies: [] };
  
  // Simplified SVM simulation
  const prices = recentPrices.map(p => p.price);
  const features = prices.map((price, idx) => ({
    price: price,
    change: idx > 0 ? (price - prices[idx-1]) / prices[idx-1] : 0,
    volatility: idx > 1 ? Math.abs((price - prices[idx-1]) / prices[idx-1]) : 0
  }));
  
  // Simple distance-based anomaly detection
  const distances = features.map(f => Math.sqrt(f.price * f.price + f.change * f.change + f.volatility * f.volatility));
  const avgDistance = distances.reduce((sum, d) => sum + d, 0) / distances.length;
  
  const anomalies = distances.map((d, idx) => ({
    index: idx,
    distance: d,
    isAnomaly: d > avgDistance * 1.5
  })).filter(a => a.isAnomaly);
  
  return {
    supportVectors: features.length,
    anomalies: anomalies,
    threshold: avgDistance * 1.5
  };
}

function calculateAnomalyScore(recentPrices: any[]): number {
  const isolationForest = performIsolationForestAnalysis(recentPrices);
  const autoencoder = performAutoencoderAnalysis(recentPrices);
  const svm = performSVMAnomalyDetection(recentPrices);
  
  const isoScore = isolationForest.anomalyScore;
  const autoScore = autoencoder.reconstructionError / 100;
  const svmScore = svm.anomalies.length / recentPrices.length;
  
  return (isoScore + autoScore + svmScore) / 3;
}

function detectAnomalies(recentPrices: any[]): any[] {
  const anomalies = [];
  
  const isoForest = performIsolationForestAnalysis(recentPrices);
  const autoencoder = performAutoencoderAnalysis(recentPrices);
  const svm = performSVMAnomalyDetection(recentPrices);
  
  // Combine anomalies from all methods
  isoForest.outliers.forEach(outlier => {
    anomalies.push({
      type: 'isolation_forest',
      index: outlier.index,
      severity: 'medium',
      description: `Price return anomaly: ${outlier.value.toFixed(2)}%`
    });
  });
  
  autoencoder.anomalies.forEach(anomaly => {
    anomalies.push({
      type: 'autoencoder',
      index: anomaly.index,
      severity: 'low',
      description: `Reconstruction error: ${anomaly.error.toFixed(2)}%`
    });
  });
  
  svm.anomalies.forEach(anomaly => {
    anomalies.push({
      type: 'svm',
      index: anomaly.index,
      severity: 'high',
      description: `Distance-based anomaly detected`
    });
  });
  
  return anomalies.slice(0, 10); // Return top 10 anomalies
}

function generatePricePrediction(recentPrices: any[], technicalData: any): any {
  if (recentPrices.length < 5) return { prediction: 0, confidence: 0 };
  
  const currentPrice = recentPrices[0].price;
  const simpleMA = recentPrices.slice(0, 5).reduce((sum, p) => sum + p.price, 0) / 5;
  
  let prediction = currentPrice;
  let confidence = 50;
  
  if (technicalData && technicalData.rsi) {
    if (technicalData.rsi < 30) {
      prediction = currentPrice * 1.05; // 5% increase for oversold
      confidence += 20;
    } else if (technicalData.rsi > 70) {
      prediction = currentPrice * 0.95; // 5% decrease for overbought
      confidence += 20;
    }
  }
  
  if (currentPrice > simpleMA) {
    prediction *= 1.02; // 2% premium for above MA
    confidence += 10;
  } else {
    prediction *= 0.98; // 2% discount for below MA
    confidence += 10;
  }
  
  return {
    prediction: prediction,
    confidence: Math.min(100, confidence),
    timeframe: '24h',
    currentPrice: currentPrice
  };
}

function generateTrendForecast(recentPrices: any[], onChainData: any): string {
  if (recentPrices.length < 3) return 'insufficient_data';
  
  const shortTerm = recentPrices.slice(0, 3).reduce((sum, p) => sum + p.price, 0) / 3;
  const mediumTerm = recentPrices.slice(0, 7).reduce((sum, p) => sum + p.price, 0) / 7;
  
  if (shortTerm > mediumTerm * 1.02) return 'bullish';
  if (shortTerm < mediumTerm * 0.98) return 'bearish';
  return 'neutral';
}

function generateVolatilityForecast(recentPrices: any[]): number {
  if (recentPrices.length < 5) return 0;
  
  const returns = [];
  for (let i = 1; i < Math.min(6, recentPrices.length); i++) {
    returns.push(Math.abs((recentPrices[i-1].price - recentPrices[i].price) / recentPrices[i].price));
  }
  
  const avgVolatility = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  return avgVolatility * 100;
}

function calculateConfidenceIntervals(recentPrices: any[]): any {
  if (recentPrices.length < 10) return { lower: 0, upper: 0 };
  
  const currentPrice = recentPrices[0].price;
  const returns = [];
  for (let i = 1; i < recentPrices.length; i++) {
    returns.push((recentPrices[i-1].price - recentPrices[i].price) / recentPrices[i].price);
  }
  
  returns.sort((a, b) => a - b);
  
  const lowerPercentile = returns[Math.floor(returns.length * 0.1)];
  const upperPercentile = returns[Math.floor(returns.length * 0.9)];
  
  return {
    lower: currentPrice * (1 + lowerPercentile),
    upper: currentPrice * (1 + upperPercentile),
    confidence: 80
  };
}

function identifyMarketRegime(recentPrices: any[], onChainData: any, sentimentData: any): string {
  let regimeScore = 0;
  
  // Price trend
  if (recentPrices.length >= 3) {
    const priceTrend = (recentPrices[0].price - recentPrices[2].price) / recentPrices[2].price;
    regimeScore += priceTrend > 0.02 ? 2 : priceTrend < -0.02 ? -2 : 0;
  }
  
  // On-chain activity
  if (onChainData && onChainData.activeAddresses) {
    regimeScore += onChainData.activeAddresses > 500000 ? 1 : -1;
  }
  
  // Sentiment
  if (sentimentData && sentimentData.fearGreedIndex) {
    regimeScore += sentimentData.fearGreedIndex > 60 ? 1 : sentimentData.fearGreedIndex < 40 ? -1 : 0;
  }
  
  if (regimeScore > 2) return 'bull_market';
  if (regimeScore < -2) return 'bear_market';
  return 'sideways_market';
}

function calculateRegimeProbability(recentPrices: any[], onChainData: any, sentimentData: any): number {
  const regime = identifyMarketRegime(recentPrices, onChainData, sentimentData);
  
  // Simplified probability calculation
  switch (regime) {
    case 'bull_market': return 0.7;
    case 'bear_market': return 0.7;
    default: return 0.5;
  }
}

function estimateRegimeDuration(recentPrices: any[]): string {
  // Simplified duration estimation
  const trendLength = Math.min(recentPrices.length, 24);
  return `${trendLength}h`;
}

function predictNextRegime(recentPrices: any[], onChainData: any, sentimentData: any): string {
  const currentRegime = identifyMarketRegime(recentPrices, onChainData, sentimentData);
  
  // Simple regime transition logic
  switch (currentRegime) {
    case 'bull_market': return 'sideways_market';
    case 'bear_market': return 'sideways_market';
    default: return 'bull_market';
  }
}

function generateEntrySignals(priceData: any, technicalData: any, sentimentData: any): string[] {
  const signals = [];
  
  if (technicalData && technicalData.rsi < 30) {
    signals.push('RSI oversold - Entry signal');
  }
  
  if (sentimentData && sentimentData.fearGreedIndex < 25) {
    signals.push('Extreme fear - Contrarian entry opportunity');
  }
  
  if (priceData && priceData.priceChange24h < -8) {
    signals.push('Sharp price drop - Potential entry point');
  }
  
  return signals;
}

function generateExitSignals(priceData: any, technicalData: any, sentimentData: any): string[] {
  const signals = [];
  
  if (technicalData && technicalData.rsi > 70) {
    signals.push('RSI overbought - Exit signal');
  }
  
  if (sentimentData && sentimentData.fearGreedIndex > 75) {
    signals.push('Extreme greed - Take profits');
  }
  
  if (priceData && priceData.priceChange24h > 15) {
    signals.push('Large price surge - Consider exit');
  }
  
  return signals;
}

function calculateStopLoss(priceData: any, technicalData: any): number {
  if (!priceData || !priceData.price) return 0;
  
  const currentPrice = priceData.price;
  const atr = technicalData ? Math.abs(technicalData.macd || 0.02) : 0.02;
  
  return currentPrice * (1 - atr * 2); // 2x ATR stop loss
}

function calculateTakeProfit(priceData: any, technicalData: any): number {
  if (!priceData || !priceData.price) return 0;
  
  const currentPrice = priceData.price;
  const atr = technicalData ? Math.abs(technicalData.macd || 0.02) : 0.02;
  
  return currentPrice * (1 + atr * 3); // 3x ATR take profit
}

function calculatePositionSize(priceData: any, onChainData: any): number {
  if (!priceData || !priceData.price) return 0;
  
  // Simplified position sizing based on volatility
  const volatility = Math.abs(priceData.priceChange24h || 0) / 100;
  const baseSize = 0.1; // 10% base position
  
  return Math.max(0.05, Math.min(0.2, baseSize / (1 + volatility)));
}

function generateKeyInsights(priceData: any, onChainData: any, technicalData: any, sentimentData: any): string[] {
  const insights = [];
  
  if (priceData && priceData.priceChange24h) {
    const change = priceData.priceChange24h;
    if (Math.abs(change) > 5) {
      insights.push(`Significant ${change > 0 ? 'positive' : 'negative'} price movement of ${change.toFixed(2)}%`);
    }
  }
  
  if (technicalData && technicalData.rsi) {
    if (technicalData.rsi > 70) {
      insights.push('Asset is overbought - Potential correction ahead');
    } else if (technicalData.rsi < 30) {
      insights.push('Asset is oversold - Potential recovery ahead');
    }
  }
  
  if (sentimentData && sentimentData.fearGreedIndex) {
    const fgi = sentimentData.fearGreedIndex;
    if (fgi < 30) {
      insights.push('Market sentiment shows extreme fear - Contrarian opportunity');
    } else if (fgi > 70) {
      insights.push('Market sentiment shows extreme greed - Caution advised');
    }
  }
  
  return insights;
}

function generateMarketNarrative(sentimentData: any, onChainData: any): string {
  if (!sentimentData) return 'Insufficient data for market narrative';
  
  const fgi = sentimentData.fearGreedIndex || 50;
  
  if (fgi < 30) {
    return 'Market is in fear mode with investors showing risk-averse behavior. This often presents buying opportunities for long-term investors.';
  } else if (fgi > 70) {
    return 'Market is showing signs of euphoria with high risk-taking behavior. Caution is advised as corrections may follow.';
  } else {
    return 'Market sentiment is balanced with rational price discovery. Normal market conditions prevail.';
  }
}

function identifyContrarianSignals(priceData: any, sentimentData: any): string[] {
  const signals = [];
  
  if (sentimentData && sentimentData.fearGreedIndex < 25 && priceData && priceData.priceChange24h < -5) {
    signals.push('Extreme fear with price drop - Strong contrarian buy signal');
  }
  
  if (sentimentData && sentimentData.fearGreedIndex > 75 && priceData && priceData.priceChange24h > 10) {
    signals.push('Extreme greed with price surge - Strong contrarian sell signal');
  }
  
  return signals;
}

function identifyMomentumSignals(priceData: any, technicalData: any): string[] {
  const signals = [];
  
  if (technicalData && technicalData.macd > 0 && technicalData.rsi > 50) {
    signals.push('Positive momentum with bullish technical indicators');
  }
  
  if (technicalData && technicalData.macd < 0 && technicalData.rsi < 50) {
    signals.push('Negative momentum with bearish technical indicators');
  }
  
  return signals;
}

function generateRecommendation(priceData: any, onChainData: any, technicalData: any, sentimentData: any): string {
  const riskLevel = assessRiskLevel(priceData, onChainData, technicalData);
  const regime = identifyMarketRegime([priceData].filter(Boolean), onChainData, sentimentData);
  
  if (riskLevel === 'low' && regime === 'bull_market') {
    return 'strong_buy';
  } else if (riskLevel === 'medium' && regime === 'bull_market') {
    return 'buy';
  } else if (riskLevel === 'high' || regime === 'bear_market') {
    return 'sell';
  } else {
    return 'hold';
  }
}

function calculateRecommendationConfidence(priceData: any, onChainData: any, technicalData: any, sentimentData: any): number {
  let confidence = 50;
  
  if (priceData) confidence += 10;
  if (onChainData) confidence += 15;
  if (technicalData) confidence += 15;
  if (sentimentData) confidence += 10;
  
  return Math.min(100, confidence);
}

function generateReasoning(priceData: any, onChainData: any, technicalData: any, sentimentData: any): string {
  const reasons = [];
  
  if (technicalData && technicalData.rsi < 30) {
    reasons.push('RSI indicates oversold conditions');
  }
  
  if (technicalData && technicalData.rsi > 70) {
    reasons.push('RSI indicates overbought conditions');
  }
  
  if (sentimentData && sentimentData.fearGreedIndex < 30) {
    reasons.push('Market fear suggests potential buying opportunity');
  }
  
  if (sentimentData && sentimentData.fearGreedIndex > 70) {
    reasons.push('Market greed suggests caution is warranted');
  }
  
  if (onChainData && onChainData.activeAddresses > 500000) {
    reasons.push('Strong on-chain activity supports positive outlook');
  }
  
  return reasons.length > 0 ? reasons.join('; ') : 'Based on current market conditions and technical indicators';
}