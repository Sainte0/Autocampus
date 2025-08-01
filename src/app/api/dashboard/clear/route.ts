import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import DashboardStatsModel from '../../../../models/DashboardStats';

export async function POST() {
  try {
    await connectDB();
    
    // Clear all existing dashboard stats
    const result = await DashboardStatsModel.deleteMany({});
    
    console.log(`Cleared ${result.deletedCount} dashboard stats records`);
    
    return NextResponse.json({ 
      success: true, 
      message: `Cleared ${result.deletedCount} dashboard stats records`,
      deletedCount: result.deletedCount
    });
    
  } catch (error) {
    console.error('Error clearing dashboard stats:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      },
      { status: 500 }
    );
  }
} 