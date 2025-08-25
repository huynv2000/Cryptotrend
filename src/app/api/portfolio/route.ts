// Portfolio API Route
// Handles CRUD operations for portfolio management

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // For now, use a default user ID since we don't have authentication
    const defaultUserId = 'default-user-id';

    // Fetch portfolio positions
    const positions = await db.portfolio.findMany({
      where: {
        userId: userId || defaultUserId,
      },
      include: {
        crypto: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total portfolio value and P&L
    let totalValue = 0;
    let totalProfitLoss = 0;
    let totalCostBasis = 0;

    const formattedPositions = positions.map((position) => {
      // Use a mock price since currentPrice is not available in the crypto model
      const mockPrice = 50000; // Mock price for demonstration
      const currentValue = position.amount * mockPrice;
      const costBasis = position.amount * position.avgBuyPrice;
      const profitLoss = currentValue - costBasis;
      const profitLossPercentage = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;

      totalValue += currentValue;
      totalProfitLoss += profitLoss;
      totalCostBasis += costBasis;

      return {
        id: position.id,
        cryptoId: position.cryptoId,
        symbol: position.crypto.symbol,
        name: position.crypto.name,
        logo: position.crypto.logo,
        amount: position.amount,
        avgBuyPrice: position.avgBuyPrice,
        currentValue,
        profitLoss,
        profitLossPercentage,
      };
    });

    const totalProfitLossPercentage = totalCostBasis > 0 ? (totalProfitLoss / totalCostBasis) * 100 : 0;

    return NextResponse.json({
      success: true,
      positions: formattedPositions,
      totalValue,
      totalProfitLoss,
      totalProfitLossPercentage,
      totalCostBasis,
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cryptoId, amount, avgBuyPrice, userId } = body;

    // Validate required fields
    if (!cryptoId || !amount || !avgBuyPrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: cryptoId, amount, avgBuyPrice' },
        { status: 400 }
      );
    }

    // Validate numeric values
    const amountNum = parseFloat(amount);
    const avgBuyPriceNum = parseFloat(avgBuyPrice);

    if (isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    if (isNaN(avgBuyPriceNum) || avgBuyPriceNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'Average buy price must be a positive number' },
        { status: 400 }
      );
    }

    // Use default user ID if not provided
    const finalUserId = userId || 'default-user-id';

    // Check if cryptocurrency exists
    const cryptocurrency = await db.cryptocurrency.findUnique({
      where: { id: cryptoId },
    });

    if (!cryptocurrency) {
      return NextResponse.json(
        { success: false, error: 'Cryptocurrency not found' },
        { status: 404 }
      );
    }

    // Check if position already exists for this user and crypto
    const existingPosition = await db.portfolio.findUnique({
      where: {
        userId_cryptoId: {
          userId: finalUserId,
          cryptoId: cryptoId,
        },
      },
    });

    let position;

    if (existingPosition) {
      // Update existing position (average the buy price)
      const totalAmount = existingPosition.amount + amountNum;
      const totalCost = (existingPosition.amount * existingPosition.avgBuyPrice) + (amountNum * avgBuyPriceNum);
      const newAvgBuyPrice = totalCost / totalAmount;

      position = await db.portfolio.update({
        where: { id: existingPosition.id },
        data: {
          amount: totalAmount,
          avgBuyPrice: newAvgBuyPrice,
          updatedAt: new Date(),
        },
        include: {
          crypto: true,
        },
      });
    } else {
      // Create new position
      position = await db.portfolio.create({
        data: {
          userId: finalUserId,
          cryptoId,
          amount: amountNum,
          avgBuyPrice: avgBuyPriceNum,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          crypto: true,
        },
      });
    }

    // Calculate current values
    const currentValue = position.amount * (position.crypto.currentPrice || 0);
    const profitLoss = currentValue - (position.amount * position.avgBuyPrice);
    const profitLossPercentage = ((currentValue - (position.amount * position.avgBuyPrice)) / (position.amount * position.avgBuyPrice)) * 100;

    const formattedPosition = {
      id: position.id,
      cryptoId: position.cryptoId,
      symbol: position.crypto.symbol,
      name: position.crypto.name,
      logo: position.crypto.logo,
      amount: position.amount,
      avgBuyPrice: position.avgBuyPrice,
      currentValue,
      profitLoss,
      profitLossPercentage,
    };

    return NextResponse.json({
      success: true,
      position: formattedPosition,
      message: existingPosition ? 'Position updated successfully' : 'Position created successfully',
    });
  } catch (error) {
    console.error('Error creating/updating portfolio position:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create/update portfolio position' },
      { status: 500 }
    );
  }
}