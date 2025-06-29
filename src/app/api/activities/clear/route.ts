import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Activity from '../../../../models/Activity';
import { verifyToken } from '../../../../lib/jwt';

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization token required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Delete all activities
    const result = await Activity.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `Se eliminaron ${result.deletedCount} registros de actividades`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('Clear activities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 