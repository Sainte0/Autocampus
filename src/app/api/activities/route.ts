import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import Activity from '../../../models/Activity';
import User from '../../../models/User';
import { verifyToken } from '../../../lib/jwt';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build filter - exclude admin activities
    const filter: any = {
      'userId.role': { $ne: 'admin' } // Exclude admin activities
    };
    
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Calculate skip
    const skip = (page - 1) * limit;

    // Get activities with pagination and populate user info
    const activities = await Activity.find(filter)
      .populate({
        path: 'userId',
        select: 'username firstName lastName role',
        match: { role: { $ne: 'admin' } } // Double check to exclude admin users
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter out any activities where user is admin (in case populate didn't work)
    const filteredActivities = activities.filter(activity => 
      activity.userId && activity.userId.role !== 'admin'
    );

    // Get total count
    const total = await Activity.countDocuments(filter);

    return NextResponse.json({
      success: true,
      activities: filteredActivities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 