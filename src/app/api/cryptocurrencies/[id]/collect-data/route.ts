import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Update or create coin data collection record
    await db.run(`
      INSERT OR REPLACE INTO coin_data_collection 
      (cryptoId, status, lastCollected, nextCollection, errorCount, metadata)
      VALUES (?, ?, datetime('now'), datetime('now', '+1 hour'), 0, '{}')
    `, [params.id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering data collection:', error);
    return NextResponse.json(
      { error: 'Failed to trigger data collection' },
      { status: 500 }
    );
  }
}