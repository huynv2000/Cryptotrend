// Portfolio Performance Analytics API Route
// Handles performance metrics and analytics for portfolio

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const timeframe = searchParams.get('timeframe') || '1m';

    // Use default user ID if not provided
    const defaultUserId = 'default-user-id';

    // Fetch portfolio positions
    const positions = await db.portfolio.findMany({
      where: {
        userId: userId || defaultUserId,
      },
      include: {
        crypto: true,
      },
    });

    if (positions.length === 0) {
      return NextResponse.json({
        success: true,
        metrics: null,
        benchmarks: [],
        performanceData: [],
      });
    }

    // Calculate performance metrics (simplified for demo)
    let totalValue = 0;
    let totalCostBasis = 0;
    let totalProfitLoss = 0;

    positions.forEach((position) => {
      // Use a mock price since currentPrice is not available in the crypto model
      const mockPrice = 50000; // Mock price for demonstration
      const currentValue = position.amount * mockPrice;
      const costBasis = position.amount * position.avgBuyPrice;
      const profitLoss = currentValue - costBasis;

      totalValue += currentValue;
      totalCostBasis += costBasis;
      totalProfitLoss += profitLoss;
    });

    const totalReturnPercentage = totalCostBasis > 0 ? (totalProfitLoss / totalCostBasis) * 100 : 0;

    // Mock performance metrics (in a real app, these would be calculated from historical data)
    const metrics = {
      totalReturn: totalProfitLoss,
      totalReturnPercentage,
      dailyReturn: (Math.random() - 0.5) * 2, // Random daily return for demo
      weeklyReturn: (Math.random() - 0.5) * 10, // Random weekly return for demo
      monthlyReturn: totalReturnPercentage,
      yearlyReturn: totalReturnPercentage * 12, // Simplified yearly calculation
      volatility: Math.random() * 30 + 5, // Random volatility between 5-35%
      sharpeRatio: Math.random() * 2 + 0.5, // Random Sharpe ratio
      maxDrawdown: Math.random() * 20 + 5, // Random max drawdown
      winRate: Math.random() * 40 + 40, // Random win rate between 40-80%
      bestDay: Math.random() * 10 + 5, // Random best day
      worstDay: -(Math.random() * 10 + 5), // Random worst day
    };

    // Mock benchmark data
    const benchmarks = [
      {
        name: 'S&P 500',
        returnPercentage: Math.random() * 20 - 5,
        volatility: Math.random() * 15 + 5,
        sharpeRatio: Math.random() * 1.5 + 0.5,
      },
      {
        name: 'NASDAQ',
        returnPercentage: Math.random() * 25 - 5,
        volatility: Math.random() * 20 + 8,
        sharpeRatio: Math.random() * 1.8 + 0.3,
      },
      {
        name: 'Bitcoin',
        returnPercentage: Math.random() * 50 - 20,
        volatility: Math.random() * 40 + 20,
        sharpeRatio: Math.random() * 2.5 + 0.2,
      },
      {
        name: 'Ethereum',
        returnPercentage: Math.random() * 60 - 25,
        volatility: Math.random() * 45 + 25,
        sharpeRatio: Math.random() * 2.2 + 0.1,
      },
    ];

    // Mock performance data for charts
    const performanceData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      const portfolioReturn = (Math.random() - 0.5) * 4; // Random daily return
      const benchmarkReturn = (Math.random() - 0.5) * 2; // Random benchmark return
      
      return {
        date: date.toISOString().split('T')[0],
        portfolioValue: totalValue * (1 + portfolioReturn / 100),
        benchmarkValue: totalValue * (1 + benchmarkReturn / 100),
        portfolioReturn,
        benchmarkReturn,
      };
    });

    return NextResponse.json({
      success: true,
      metrics,
      benchmarks,
      performanceData,
    });
  } catch (error) {
    console.error('Error fetching portfolio performance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio performance data' },
      { status: 500 }
    );
  }
}