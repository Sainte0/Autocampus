import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import { verifyToken } from '../../../../lib/jwt';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
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

    // Find activities without status and update them
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    const result = await db.collection('activities').updateMany(
      { status: { $exists: false } },
      { $set: { status: 'success' } }
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} activities with default status`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Fix activities status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 