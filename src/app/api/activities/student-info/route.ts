import { NextRequest, NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import { verifyToken } from '../../../../lib/jwt';
import mongoose from 'mongoose';

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
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get username from query parameters
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Find the most recent create_student activity for this username
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error('Database connection not available');
    }

    const studentActivity = await db.collection('activities').findOne(
      {
        action: 'create_student',
        'details.studentUsername': username
      },
      {
        sort: { createdAt: -1 } // Get the most recent one
      }
    );

    if (!studentActivity) {
      return NextResponse.json(
        { error: 'Student not found in activity logs' },
        { status: 404 }
      );
    }

    // Extract student information from the activity
    const studentInfo = {
      username: studentActivity.details.studentUsername,
      name: studentActivity.details.studentName,
      email: studentActivity.details.studentEmail,
      firstName: studentActivity.details.studentFirstName,
      lastName: studentActivity.details.studentLastName,
      document: studentActivity.details.studentDocument,
      password: studentActivity.details.studentPassword,
      moodleUserId: studentActivity.details.moodleUserId,
    };

    return NextResponse.json({
      success: true,
      student: studentInfo,
    });
  } catch (error) {
    console.error('Get student info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 