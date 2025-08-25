import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Update or create coin data collection record using Prisma
    await db.coinDataCollection.upsert({
      where: {
        cryptoId: id
      },
      update: {
        status: 'PENDING',
        lastCollected: new Date(),
        nextCollection: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        errorCount: 0,
        lastError: null,
        metadata: {}
      },
      create: {
        cryptoId: id,
        status: 'PENDING',
        lastCollected: new Date(),
        nextCollection: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        errorCount: 0,
        metadata: {}
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering data collection:', error);
    return NextResponse.json(
      { error: 'Failed to trigger data collection' },
      { status: 500 }
    );
  }
}