import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { verifyToken } from '../../../../lib/jwt';

export async function GET(request: NextRequest) {
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

    // Get only regular users (exclude admins)
    const users = await User.find(
      { role: 'user', isActive: true },
      { _id: 1, username: 1, firstName: 1, lastName: 1 }
    ).sort({ firstName: 1, lastName: 1 });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Get users list error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 