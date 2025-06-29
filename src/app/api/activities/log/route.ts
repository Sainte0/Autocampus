import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
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
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user details from database
    const user = await User.findById(payload.userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { action, details, status = 'success', errorMessage } = await request.json();

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    // Create activity data
    const activityData = {
      userId: payload.userId,
      userUsername: payload.username,
      userFullName: `${user.firstName} ${user.lastName}`,
      action,
      details: details || {},
      status,
      errorMessage,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Use direct MongoDB insertion
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    const result = await db.collection('activities').insertOne(activityData);
    const createdActivity = await db.collection('activities').findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      activity: createdActivity,
    });
  } catch (error) {
    console.error('Log activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 