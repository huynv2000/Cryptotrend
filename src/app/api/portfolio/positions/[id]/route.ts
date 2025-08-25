// Individual Portfolio Position API Route
// Handles GET, PUT, DELETE operations for specific portfolio positions

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const positionId = params.id;

    // Fetch position with details
    const position = await db.portfolio.findUnique({
      where: { id: positionId },
      include: {
        crypto: true,
      },
    });

    if (!position) {
      return NextResponse.json(
        { success: false, error: 'Position not found' },
        { status: 404 }
      );
    }

    // Calculate current values
    // Use a mock price since currentPrice is not available in the crypto model
    const mockPrice = 50000; // Mock price for demonstration
    const currentValue = position.amount * mockPrice;
    const profitLoss = currentValue - (position.amount * position.avgBuyPrice);
    const profitLossPercentage = ((currentValue - (position.amount * position.avgBuyPrice)) / (position.amount * position.avgBuyPrice)) * 100;

    // Mock transaction history (in a real app, this would come from a transactions table)
    const transactions = [
      {
        id: 'tx-1',
        type: 'BUY' as const,
        amount: position.amount,
        price: position.avgBuyPrice,
        totalValue: position.amount * position.avgBuyPrice,
        timestamp: position.createdAt.toISOString(),
      },
    ];

    // Mock performance data (in a real app, this would be calculated from historical data)
    const performanceData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      const daysSincePurchase = Math.max(0, i - 15);
      const value = position.amount * position.avgBuyPrice * (1 + (Math.random() - 0.5) * 0.1 + daysSincePurchase * 0.01);
      const costBasis = position.amount * position.avgBuyPrice;
      
      return {
        date: date.toISOString().split('T')[0],
        value,
        costBasis,
        profitLoss: value - costBasis,
      };
    });

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
      transactions,
      performanceData,
    });
  } catch (error) {
    console.error('Error fetching position:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch position data' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const positionId = params.id;
    const body = await request.json();
    const { amount, avgBuyPrice } = body;

    // Validate required fields
    if (!amount || !avgBuyPrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: amount, avgBuyPrice' },
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

    // Check if position exists
    const existingPosition = await db.portfolio.findUnique({
      where: { id: positionId },
    });

    if (!existingPosition) {
      return NextResponse.json(
        { success: false, error: 'Position not found' },
        { status: 404 }
      );
    }

    // Update position
    const position = await db.portfolio.update({
      where: { id: positionId },
      data: {
        amount: amountNum,
        avgBuyPrice: avgBuyPriceNum,
        updatedAt: new Date(),
      },
      include: {
        crypto: true,
      },
    });

    // Calculate current values
    // Use a mock price since currentPrice is not available in the crypto model
    const mockPrice = 50000; // Mock price for demonstration
    const currentValue = position.amount * mockPrice;
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
      message: 'Position updated successfully',
    });
  } catch (error) {
    console.error('Error updating position:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update position' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const positionId = params.id;

    // Check if position exists
    const existingPosition = await db.portfolio.findUnique({
      where: { id: positionId },
    });

    if (!existingPosition) {
      return NextResponse.json(
        { success: false, error: 'Position not found' },
        { status: 404 }
      );
    }

    // Delete position
    await db.portfolio.delete({
      where: { id: positionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Position deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting position:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete position' },
      { status: 500 }
    );
  }
}