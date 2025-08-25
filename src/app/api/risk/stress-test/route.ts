// Stress Test API Endpoint
// Performs stress testing scenarios on portfolio to assess risk under extreme conditions

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface StressTestScenario {
  id: string;
  name: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  probability: number;
  marketShock: number;
  volatilityIncrease: number;
  correlationBreakdown: number;
  liquidityShock: number;
}

interface StressTestResult {
  scenarioId: string;
  scenarioName: string;
  portfolioValueBefore: number;
  portfolioValueAfter: number;
  lossAmount: number;
  lossPercentage: number;
  varBreach: boolean;
  maxDrawdown: number;
  recoveryTime: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
}

const predefinedScenarios: StressTestScenario[] = [
  {
    id: 'market_crash_2008',
    name: '2008 Market Crash',
    description: 'Global financial crisis similar to 2008',
    severity: 'EXTREME',
    probability: 0.01,
    marketShock: -50,
    volatilityIncrease: 300,
    correlationBreakdown: 80,
    liquidityShock: -70
  },
  {
    id: 'crypto_winter_2022',
    name: 'Crypto Winter 2022',
    description: 'Extended crypto bear market',
    severity: 'HIGH',
    probability: 0.05,
    marketShock: -70,
    volatilityIncrease: 200,
    correlationBreakdown: 60,
    liquidityShock: -50
  },
  {
    id: 'black_swan_event',
    name: 'Black Swan Event',
    description: 'Unprecedented market event',
    severity: 'EXTREME',
    probability: 0.001,
    marketShock: -80,
    volatilityIncrease: 500,
    correlationBreakdown: 90,
    liquidityShock: -90
  },
  {
    id: 'regulatory_crackdown',
    name: 'Regulatory Crackdown',
    description: 'Major regulatory restrictions',
    severity: 'HIGH',
    probability: 0.02,
    marketShock: -40,
    volatilityIncrease: 150,
    correlationBreakdown: 70,
    liquidityShock: -60
  },
  {
    id: 'exchange_failure',
    name: 'Major Exchange Failure',
    description: 'Collapse of a major exchange',
    severity: 'MEDIUM',
    probability: 0.03,
    marketShock: -30,
    volatilityIncrease: 100,
    correlationBreakdown: 50,
    liquidityShock: -80
  }
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, scenarioIds } = body;

    if (!userId || !scenarioIds || !Array.isArray(scenarioIds)) {
      return NextResponse.json(
        { error: 'userId and scenarioIds are required' },
        { status: 400 }
      );
    }

    // Get user's portfolio
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

    if (portfolio.length === 0) {
      return NextResponse.json(
        { error: 'No portfolio found for user' },
        { status: 404 }
      );
    }

    // Calculate current portfolio value
    const portfolioValueBefore = portfolio.reduce((sum, position) => 
      sum + (position.currentValue || position.amount * position.avgBuyPrice), 0
    );

    // Get selected scenarios
    const selectedScenarios = predefinedScenarios.filter(s => scenarioIds.includes(s.id));

    // Run stress tests for each scenario
    const results: StressTestResult[] = [];

    for (const scenario of selectedScenarios) {
      const result = await runStressTest(scenario, portfolio, portfolioValueBefore);
      results.push(result);
    }

    return NextResponse.json({
      results,
      portfolioValueBefore,
      scenariosTested: selectedScenarios.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error running stress tests:', error);
    return NextResponse.json(
      { error: 'Failed to run stress tests' },
      { status: 500 }
    );
  }
}

async function runStressTest(
  scenario: StressTestScenario,
  portfolio: any[],
  portfolioValueBefore: number
): Promise<StressTestResult> {
  // Calculate portfolio impact under stress scenario
  let portfolioValueAfter = portfolioValueBefore;
  let totalLoss = 0;
  let maxDrawdown = 0;
  let varBreach = false;

  // Apply scenario effects to each position
  portfolio.forEach(position => {
    const positionValue = position.currentValue || position.amount * position.avgBuyPrice;
    const riskMetric = position.crypto.riskMetrics[0];
    
    // Calculate position-specific impact
    let positionLoss = 0;
    
    // Base market shock
    positionLoss += positionValue * (scenario.marketShock / 100);
    
    // Additional volatility impact (simplified)
    if (riskMetric && riskMetric.volatility) {
      const volatilityImpact = positionValue * (riskMetric.volatility / 100) * (scenario.volatilityIncrease / 100);
      positionLoss += Math.abs(volatilityImpact) * 0.5; // Assume 50% of volatility impact is negative
    }
    
    // Liquidity shock impact
    const liquidityImpact = positionValue * (scenario.liquidityShock / 100) * 0.3; // 30% of liquidity shock realized
    positionLoss += liquidityImpact;
    
    totalLoss += positionLoss;
  });

  portfolioValueAfter = portfolioValueBefore + totalLoss;
  const lossPercentage = (totalLoss / portfolioValueBefore) * 100;

  // Calculate max drawdown under stress (simplified)
  maxDrawdown = Math.abs(lossPercentage) * 1.2; // Assume drawdown is 20% worse than immediate loss

  // Check if VaR is breached (simplified check)
  const portfolioVaR = portfolio.reduce((sum, position) => {
    const riskMetric = position.crypto.riskMetrics[0];
    return sum + (riskMetric?.var95 || 0);
  }, 0);
  
  varBreach = Math.abs(totalLoss) > portfolioVaR;

  // Calculate recovery time (simplified heuristic)
  let recoveryTime = 0;
  if (lossPercentage < -10) recoveryTime = 30;
  else if (lossPercentage < -25) recoveryTime = 90;
  else if (lossPercentage < -50) recoveryTime = 180;
  else recoveryTime = 365;

  // Adjust recovery time based on scenario severity
  if (scenario.severity === 'EXTREME') recoveryTime *= 1.5;
  else if (scenario.severity === 'HIGH') recoveryTime *= 1.2;

  // Determine risk level
  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (lossPercentage < -50 || varBreach) riskLevel = 'CRITICAL';
  else if (lossPercentage < -25) riskLevel = 'HIGH';
  else if (lossPercentage < -10) riskLevel = 'MEDIUM';

  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    portfolioValueBefore,
    portfolioValueAfter,
    lossAmount: Math.abs(totalLoss),
    lossPercentage,
    varBreach,
    maxDrawdown,
    recoveryTime: Math.round(recoveryTime),
    riskLevel,
    timestamp: new Date().toISOString()
  };
}