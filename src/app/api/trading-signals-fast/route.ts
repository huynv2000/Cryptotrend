import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const coinId = searchParams.get('coinId') || 'bitcoin';
    
    if (action === 'signal') {
      // Get cryptocurrency
      const crypto = await db.cryptocurrency.findFirst({
        where: { coinGeckoId: coinId }
      });
      
      if (!crypto) {
        return NextResponse.json(
          { error: 'Cryptocurrency not found' },
          { status: 404 }
        );
      }
      
      // Get latest data for signal calculation
      const onChainData = await db.onChainMetric.findFirst({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' }
      });
      
      const technicalData = await db.technicalIndicator.findFirst({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' }
      });
      
      const sentimentData = await db.sentimentMetric.findFirst({
        orderBy: { timestamp: 'desc' }
      });
      
      const derivativesData = await db.derivativeMetric.findFirst({
        where: { cryptoId: crypto.id },
        orderBy: { timestamp: 'desc' }
      });
      
      // Check if we have valid data for signal calculation
      if (!onChainData || !technicalData || !sentimentData || !derivativesData ||
          onChainData.mvrv === null || technicalData.rsi === null || 
          sentimentData.fearGreedIndex === null || derivativesData.fundingRate === null) {
        
        return NextResponse.json({
          signal: {
            signal: 'N/A',
            confidence: 0,
            reasoning: 'Insufficient data available for signal calculation',
            riskLevel: 'UNKNOWN',
            conditions: {
              mvrv: onChainData?.mvrv || null,
              fearGreed: sentimentData?.fearGreedIndex || null,
              fundingRate: derivativesData?.fundingRate || null,
              sopr: onChainData?.sopr || null,
              rsi: technicalData?.rsi || null,
              nupl: onChainData?.nupl || null,
              volumeTrend: 'unknown',
              extremeDetected: false,
              error: "N/A - Insufficient data for signal calculation"
            },
            triggers: ['Data quality check failed']
          }
        });
      }
      
      // Calculate trading signal (simplified logic)
      let signal = 'HOLD';
      let confidence = 50;
      let reasoning = 'Market conditions are neutral';
      let riskLevel = 'MEDIUM';
      
      const mvrv = onChainData.mvrv;
      const rsi = technicalData.rsi;
      const fearGreed = sentimentData.fearGreedIndex;
      const fundingRate = derivativesData.fundingRate;
      
      // Buy conditions
      if (mvrv < 1.5 && rsi < 60 && fearGreed < 60 && fundingRate < 0.02) {
        signal = 'BUY';
        confidence = 75;
        reasoning = 'MVRV indicates undervaluation, RSI shows no overbought conditions, fear/greed is neutral, funding rate is healthy';
        riskLevel = 'LOW';
      }
      // Strong buy conditions
      else if (mvrv < 1.2 && rsi < 40 && fearGreed < 40 && fundingRate < 0.01) {
        signal = 'STRONG_BUY';
        confidence = 85;
        reasoning = 'Strong undervaluation signals across all metrics';
        riskLevel = 'LOW';
      }
      // Sell conditions
      else if (mvrv > 2.5 || rsi > 70 || fearGreed > 75 || fundingRate > 0.05) {
        signal = 'SELL';
        confidence = 70;
        reasoning = 'Overvaluation or overbought conditions detected';
        riskLevel = 'HIGH';
      }
      // Strong sell conditions
      else if (mvrv > 3 || rsi > 80 || fearGreed > 80 || fundingRate > 0.1) {
        signal = 'STRONG_SELL';
        confidence = 90;
        reasoning = 'Extreme overvaluation conditions';
        riskLevel = 'HIGH';
      }
      
      const tradingSignal = {
        signal: signal,
        confidence: confidence,
        reasoning: reasoning,
        riskLevel: riskLevel,
        conditions: {
          mvrv: mvrv,
          fearGreed: fearGreed,
          fundingRate: fundingRate,
          sopr: onChainData.sopr,
          rsi: rsi,
          nupl: onChainData.nupl,
          volumeTrend: 'stable',
          extremeDetected: false
        },
        triggers: [reasoning]
      };
      
      return NextResponse.json({ signal: tradingSignal });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing trading signals:', error);
    return NextResponse.json(
      { error: 'Failed to process trading signals' },
      { status: 500 }
    );
  }
}