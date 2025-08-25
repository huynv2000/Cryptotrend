import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { isActive } = await request.json();
    
    await db.cryptocurrency.update({
      where: { id },
      data: { 
        isActive,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating cryptocurrency:', error);
    return NextResponse.json(
      { error: 'Failed to update cryptocurrency' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.cryptocurrency.deleteMany({
      where: { 
        id,
        isDefault: false
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cryptocurrency:', error);
    return NextResponse.json(
      { error: 'Failed to delete cryptocurrency' },
      { status: 500 }
    );
  }
}