import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const search = searchParams.get('search');
    
    const whereClause: any = {};
    
    if (activeOnly) {
      whereClause.isActive = true;
    }
    
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { symbol: { contains: search } },
        { coinGeckoId: { contains: search } }
      ];
    }
    
    const cryptocurrencies = await db.cryptocurrency.findMany({
      where: whereClause,
      orderBy: { rank: 'asc' },
      take: 50
    });
    
    return NextResponse.json(cryptocurrencies);
  } catch (error) {
    console.error('Error fetching cryptocurrencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cryptocurrencies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { symbol, name, coinGeckoId, userId } = await request.json();
    
    if (!symbol || !name || !coinGeckoId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if coin already exists
    const existingCoin = await db.cryptocurrency.findFirst({
      where: {
        OR: [
          { coinGeckoId },
          { symbol }
        ]
      }
    });
    
    if (existingCoin) {
      return NextResponse.json(
        { error: 'Coin already exists' },
        { status: 400 }
      );
    }
    
    // Insert new cryptocurrency
    const newCoin = await db.cryptocurrency.create({
      data: {
        id: coinGeckoId,
        symbol,
        name,
        coinGeckoId,
        isActive: true,
        isDefault: false,
        addedBy: userId
      }
    });
    
    return NextResponse.json({ success: true, coin: newCoin });
  } catch (error) {
    console.error('Error adding cryptocurrency:', error);
    return NextResponse.json(
      { error: 'Failed to add cryptocurrency' },
      { status: 500 }
    );
  }
}