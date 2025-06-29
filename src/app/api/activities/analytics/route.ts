import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import Activity from '../../../../models/Activity';
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Calculate date range
    let startDate: Date | null = null;
    const now = new Date();
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
        startDate = null;
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Build filter - include all activities
    const filter: Record<string, unknown> = {};
    
    if (startDate) {
      filter.createdAt = { $gte: startDate };
    }

    // Get activities with populated user info
    const activities = await Activity.find(filter)
      .populate('userId', 'username firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(1000); // Limit for performance

    // Don't filter out admin activities - include all
    const filteredActivities = activities;

    // Calculate statistics
    const stats = {
      total: filteredActivities.length,
      byAction: {} as { [key: string]: number },
      byStatus: {} as { [key: string]: number },
      byUser: {} as { [key: string]: number },
      byDate: {} as { [key: string]: number },
      recentActivities: filteredActivities.slice(0, 10).map(activity => ({
        _id: activity._id,
        action: activity.action,
        userUsername: activity.userUsername,
        status: activity.status,
        createdAt: activity.createdAt,
      }))
    };

    // Count by action
    filteredActivities.forEach(activity => {
      stats.byAction[activity.action] = (stats.byAction[activity.action] || 0) + 1;
    });

    // Count by status
    filteredActivities.forEach(activity => {
      const status = activity.status || 'success'; // Default to success if no status
      stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    });

    // Count by user
    filteredActivities.forEach(activity => {
      stats.byUser[activity.userUsername] = (stats.byUser[activity.userUsername] || 0) + 1;
    });

    // Count by date (group by day)
    filteredActivities.forEach(activity => {
      const date = new Date(activity.createdAt).toISOString().split('T')[0];
      stats.byDate[date] = (stats.byDate[date] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Get activity analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 