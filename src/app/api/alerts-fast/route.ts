import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const coinId = searchParams.get('coinId') || 'bitcoin';
    
    if (action === 'process-data') {
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
      
      // Get latest data
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
      
      // Generate alerts based on data
      const alerts = [];
      
      if (technicalData && technicalData.rsi !== null) {
        // RSI alerts
        if (technicalData.rsi > 70) {
          alerts.push({
            id: `rsi-overbought-${Date.now()}`,
            type: 'WARNING',
            category: 'TECHNICAL',
            title: 'RSI Overbought',
            message: `RSI is ${technicalData.rsi.toFixed(1)} indicating overbought conditions`,
            severity: 'MEDIUM',
            timestamp: new Date(),
            coinId: coinId,
            actionRequired: true,
            recommendedAction: 'Consider taking profits or waiting for correction'
          });
        } else if (technicalData.rsi < 30) {
          alerts.push({
            id: `rsi-oversold-${Date.now()}`,
            type: 'INFO',
            category: 'TECHNICAL',
            title: 'RSI Oversold',
            message: `RSI is ${technicalData.rsi.toFixed(1)} indicating oversold conditions`,
            severity: 'LOW',
            timestamp: new Date(),
            coinId: coinId,
            actionRequired: false,
            recommendedAction: 'Potential buying opportunity'
          });
        }
      }
      
      if (onChainData && onChainData.mvrv !== null) {
        // MVRV alerts
        if (onChainData.mvrv > 2.5) {
          alerts.push({
            id: `mvrv-high-${Date.now()}`,
            type: 'WARNING',
            category: 'ONCHAIN',
            title: 'High MVRV Ratio',
            message: `MVRV ratio is ${onChainData.mvrv.toFixed(2)} indicating potential overvaluation`,
            severity: 'HIGH',
            timestamp: new Date(),
            coinId: coinId,
            actionRequired: true,
            recommendedAction: 'Exercise caution, consider reducing exposure'
          });
        } else if (onChainData.mvrv < 1) {
          alerts.push({
            id: `mvrv-low-${Date.now()}`,
            type: 'INFO',
            category: 'ONCHAIN',
            title: 'Low MVRV Ratio',
            message: `MVRV ratio is ${onChainData.mvrv.toFixed(2)} indicating potential undervaluation`,
            severity: 'LOW',
            timestamp: new Date(),
            coinId: coinId,
            actionRequired: false,
            recommendedAction: 'Potential accumulation opportunity'
          });
        }
      }
      
      if (sentimentData && sentimentData.fearGreedIndex !== null) {
        // Fear & Greed alerts
        if (sentimentData.fearGreedIndex > 75) {
          alerts.push({
            id: `fear-greed-greed-${Date.now()}`,
            type: 'WARNING',
            category: 'SENTIMENT',
            title: 'Extreme Greed',
            message: `Fear & Greed index is ${sentimentData.fearGreedIndex} indicating extreme greed`,
            severity: 'MEDIUM',
            timestamp: new Date(),
            coinId: coinId,
            actionRequired: true,
            recommendedAction: 'Be cautious of potential market top'
          });
        } else if (sentimentData.fearGreedIndex < 25) {
          alerts.push({
            id: `fear-greed-fear-${Date.now()}`,
            type: 'INFO',
            category: 'SENTIMENT',
            title: 'Extreme Fear',
            message: `Fear & Greed index is ${sentimentData.fearGreedIndex} indicating extreme fear`,
            severity: 'LOW',
            timestamp: new Date(),
            coinId: coinId,
            actionRequired: false,
            recommendedAction: 'Potential buying opportunity in fear zone'
          });
        }
      }
      
      // Check for data availability
      if (!technicalData || technicalData.rsi === null) {
        alerts.push({
          id: `no-technical-data-${Date.now()}`,
          type: 'WARNING',
          category: 'SYSTEM',
          title: 'No Technical Data Available',
          message: 'Technical indicators data is not available',
          severity: 'MEDIUM',
          timestamp: new Date(),
          coinId: coinId,
          actionRequired: true,
          recommendedAction: 'Check data collector and API connections'
        });
      }

      if (!onChainData || onChainData.mvrv === null) {
        alerts.push({
          id: `no-onchain-data-${Date.now()}`,
          type: 'WARNING',
          category: 'SYSTEM',
          title: 'No On-Chain Data Available',
          message: 'On-chain metrics data is not available',
          severity: 'MEDIUM',
          timestamp: new Date(),
          coinId: coinId,
          actionRequired: true,
          recommendedAction: 'Check data collector and API connections'
        });
      }

      if (!sentimentData || sentimentData.fearGreedIndex === null) {
        alerts.push({
          id: `no-sentiment-data-${Date.now()}`,
          type: 'WARNING',
          category: 'SYSTEM',
          title: 'No Sentiment Data Available',
          message: 'Sentiment analysis data is not available',
          severity: 'MEDIUM',
          timestamp: new Date(),
          coinId: coinId,
          actionRequired: true,
          recommendedAction: 'Check data collector and API connections'
        });
      }
      
      // If no alerts generated, create a general market status alert
      if (alerts.length === 0) {
        alerts.push({
          id: `market-status-${Date.now()}`,
          type: 'INFO',
          category: 'MARKET',
          title: 'Market Status Normal',
          message: 'All indicators are within normal ranges',
          severity: 'LOW',
          timestamp: new Date(),
          coinId: coinId,
          actionRequired: false
        });
      }
      
      return NextResponse.json({ alerts });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing alerts:', error);
    return NextResponse.json(
      { error: 'Failed to process alerts' },
      { status: 500 }
    );
  }
}