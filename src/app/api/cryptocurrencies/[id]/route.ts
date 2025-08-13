import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { isActive } = await request.json();
    
    await db.run(
      'UPDATE cryptocurrencies SET isActive = ?, updatedAt = datetime("now") WHERE id = ?',
      [isActive ? 1 : 0, params.id]
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating cryptocurrency:', error);
    return NextResponse.json(
      { error: 'Failed to update cryptocurrency' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await db.run('DELETE FROM cryptocurrencies WHERE id = ? AND isDefault = 0', [params.id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cryptocurrency:', error);
    return NextResponse.json(
      { error: 'Failed to delete cryptocurrency' },
      { status: 500 }
    );
  }
}