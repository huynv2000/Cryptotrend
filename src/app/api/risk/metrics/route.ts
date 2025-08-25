// Risk Metrics API Endpoint
// Provides comprehensive risk analysis data for portfolio and individual assets

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { VaRCalculator, RiskUtils } from '@/lib/risk/var-calculator';

interface PortfolioRiskSummary {
  totalVaR95: number;
  totalVaR99: number;
  portfolioVolatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
  riskLevel: string;
  riskScore: number;
  diversificationScore: number;
}

interface RiskMetricsResponse {
  riskMetrics: any[];
  portfolioSummary: PortfolioRiskSummary | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const cryptoId = searchParams.get('cryptoId');

    if (!userId && !cryptoId) {
      return NextResponse.json(
        { error: 'Either userId or cryptoId is required' },
        { status: 400 }
      );
    }

    let riskMetrics = [];
    let portfolioSummary: PortfolioRiskSummary | null = null;

    if (userId) {
      // Get portfolio risk metrics for user
      const portfolio = await db.portfolio.findMany({
        where: { userId },
        include: {
          crypto: {
            include: {
              riskMetrics: {
                orderBy: { timestamp: 'desc' },
                take: 1
              }
            }
          }
        }
      });

      if (portfolio.length > 0) {
        // Calculate portfolio-level risk metrics
        const totalValue = portfolio.reduce((sum, position) => 
          sum + (position.currentValue || position.amount * position.avgBuyPrice), 0
        );

        let totalVaR95 = 0;
        let totalVaR99 = 0;
        let weightedVolatility = 0;
        let weightedSharpe = 0;
        let maxDrawdown = 0;
        let riskScore = 0;

        portfolio.forEach(position => {
          const value = position.currentValue || position.amount * position.avgBuyPrice;
          const weight = value / totalValue;
          const riskMetric = position.crypto.riskMetrics[0];

          if (riskMetric) {
            totalVaR95 += (riskMetric.var95 || 0) * weight;
            totalVaR99 += (riskMetric.var99 || 0) * weight;
            weightedVolatility += (riskMetric.volatility || 0) * weight;
            weightedSharpe += (riskMetric.sharpeRatio || 0) * weight;
            maxDrawdown = Math.max(maxDrawdown, riskMetric.maxDrawdown || 0);
            riskScore += (riskMetric.riskScore || 0) * weight;

            (riskMetrics as any[]).push({
              id: riskMetric.id,
              cryptoId: position.crypto.id,
              symbol: position.crypto.symbol,
              name: position.crypto.name,
              var95: riskMetric.var95 || 0,
              var99: riskMetric.var99 || 0,
              expectedShortfall95: riskMetric.expectedShortfall95 || 0,
              volatility: riskMetric.volatility || 0,
              maxDrawdown: riskMetric.maxDrawdown || 0,
              sharpeRatio: riskMetric.sharpeRatio || 0,
              riskLevel: riskMetric.riskLevel || 'MEDIUM',
              riskScore: riskMetric.riskScore || 50,
              riskTrend: riskMetric.riskTrend || 'STABLE',
              timestamp: riskMetric.timestamp.toISOString()
            });
          }
        });

        // Calculate diversification score (simplified)
        const diversificationScore = Math.min(100, portfolio.length * 20);

        // Determine overall risk level
        let riskLevel = 'LOW';
        if (riskScore > 70) riskLevel = 'CRITICAL';
        else if (riskScore > 50) riskLevel = 'HIGH';
        else if (riskScore > 30) riskLevel = 'MEDIUM';

        portfolioSummary = {
          totalVaR95,
          totalVaR99,
          portfolioVolatility: weightedVolatility,
          maxDrawdown,
          sharpeRatio: weightedSharpe,
          riskLevel,
          riskScore,
          diversificationScore
        };
      }
    } else if (cryptoId) {
      // Get risk metrics for specific cryptocurrency
      const riskMetric = await db.riskMetric.findFirst({
        where: { cryptoId },
        orderBy: { timestamp: 'desc' }
      });

      const crypto = await db.cryptocurrency.findUnique({
        where: { id: cryptoId }
      });

      if (riskMetric && crypto) {
        (riskMetrics as any[]).push({
          id: riskMetric.id,
          cryptoId: crypto.id,
          symbol: crypto.symbol,
          name: crypto.name,
          var95: riskMetric.var95 || 0,
          var99: riskMetric.var99 || 0,
          expectedShortfall95: riskMetric.expectedShortfall95 || 0,
          volatility: riskMetric.volatility || 0,
          maxDrawdown: riskMetric.maxDrawdown || 0,
          sharpeRatio: riskMetric.sharpeRatio || 0,
          riskLevel: riskMetric.riskLevel || 'MEDIUM',
          riskScore: riskMetric.riskScore || 50,
          riskTrend: riskMetric.riskTrend || 'STABLE',
          timestamp: riskMetric.timestamp.toISOString()
        });
      }
    }

    return NextResponse.json({
      riskMetrics,
      portfolioSummary
    } as RiskMetricsResponse);

  } catch (error) {
    console.error('Error fetching risk metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk metrics' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cryptoId, returns, portfolioValue } = body;

    if (!cryptoId || !returns || !portfolioValue) {
      return NextResponse.json(
        { error: 'cryptoId, returns, and portfolioValue are required' },
        { status: 400 }
      );
    }

    // Calculate VaR using different methods
    const varInput = {
      portfolioValue,
      returns,
      confidenceLevel: 0.95,
      timeHorizon: 1
    };

    const varResults = VaRCalculator.calculateAllVaRMetrics(varInput);
    
    // Calculate additional risk metrics
    const volatility = RiskUtils.calculateVolatility(returns);
    const maxDrawdown = RiskUtils.calculateMaxDrawdown(returns);
    const sharpeRatio = RiskUtils.calculateSharpeRatio(returns);

    // Determine risk level based on multiple factors
    let riskScore = 0;
    riskScore += Math.min(30, (varResults.historical.var / portfolioValue) * 100 * 10);
    riskScore += Math.min(30, volatility * 100 * 5);
    riskScore += Math.min(20, maxDrawdown.maxDrawdown * 100 * 2);
    riskScore += Math.min(20, Math.max(0, (2 - sharpeRatio) * 10));

    let riskLevel = 'LOW';
    if (riskScore > 70) riskLevel = 'CRITICAL';
    else if (riskScore > 50) riskLevel = 'HIGH';
    else if (riskScore > 30) riskLevel = 'MEDIUM';

    // Save risk metrics to database
    const riskMetric = await db.riskMetric.create({
      data: {
        cryptoId,
        var95: varResults.historical.var,
        var99: VaRCalculator.calculateHistoricalVaR({ ...varInput, confidenceLevel: 0.99 }).var,
        varHistorical: varResults.historical.var,
        varParametric: varResults.parametric.var,
        varMonteCarlo: varResults.monteCarlo.var,
        expectedShortfall95: varResults.expectedShortfall.expectedShortfall,
        expectedShortfall99: VaRCalculator.calculateExpectedShortfall(portfolioValue, returns, 0.99).expectedShortfall,
        volatility: volatility,
        dailyVolatility: RiskUtils.calculateVolatility(returns, false),
        maxDrawdown: maxDrawdown.maxDrawdown,
        maxDrawdownDuration: maxDrawdown.duration,
        sharpeRatio: sharpeRatio,
        riskLevel,
        riskScore,
        riskTrend: 'STABLE', // Default trend
        confidence: 0.9 // Default confidence
      }
    });

    return NextResponse.json({
      id: riskMetric.id,
      cryptoId,
      varResults,
      riskMetrics: {
        volatility,
        maxDrawdown: maxDrawdown.maxDrawdown,
        sharpeRatio,
        riskLevel,
        riskScore
      },
      timestamp: riskMetric.timestamp
    });

  } catch (error) {
    console.error('Error calculating risk metrics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate risk metrics' },
      { status: 500 }
    );
  }
}