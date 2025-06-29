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
    const format = searchParams.get('format') || 'csv';
    const includeDetails = searchParams.get('includeDetails') === 'true';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const action = searchParams.get('action');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    // Build filter
    const filter: Record<string, unknown> = {};
    
    if (userId) filter.userId = userId;
    if (action) filter.action = action;
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) (filter.createdAt as Record<string, unknown>).$gte = new Date(startDate);
      if (endDate) (filter.createdAt as Record<string, unknown>).$lte = new Date(endDate);
    }

    // Get activities with populated user info
    const activities = await Activity.find(filter)
      .populate({
        path: 'userId',
        select: 'username firstName lastName role email',
        match: { role: { $ne: 'admin' } }
      })
      .sort({ createdAt: -1 });

    // Filter out admin activities
    const filteredActivities = activities.filter(activity => 
      activity.userId && activity.userId.role !== 'admin'
    );

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `activities-${timestamp}.${format}`;

    // Prepare data for export
    const exportData = filteredActivities.map(activity => {
      const baseData = {
        ID: activity._id.toString(),
        Usuario: activity.userUsername,
        'Nombre Completo': activity.userFullName,
        Acción: activity.action,
        Estado: activity.status,
        'Fecha Creación': new Date(activity.createdAt).toISOString(),
        'Fecha Actualización': new Date(activity.updatedAt).toISOString(),
      };

      if (includeDetails) {
        return {
          ...baseData,
          'Mensaje Error': activity.errorMessage || '',
          'Estudiante Username': activity.details.studentUsername || '',
          'Estudiante Nombre Completo': activity.details.studentName || '',
          'Estudiante Email': activity.details.studentEmail || '',
          'Estudiante Nombre': activity.details.studentFirstName || '',
          'Estudiante Apellido': activity.details.studentLastName || '',
          'Estudiante Documento': activity.details.studentDocument || '',
          'Curso ID': activity.details.courseId || '',
          'Curso Nombre': activity.details.courseName || '',
          'Curso Código': activity.details.courseShortName || '',
          'Moodle User ID': activity.details.moodleUserId || '',
          'Razón': activity.details.reason || '',
          'Datos Anteriores': activity.details.oldData ? JSON.stringify(activity.details.oldData) : '',
          'Datos Nuevos': activity.details.newData ? JSON.stringify(activity.details.newData) : '',
        };
      }

      return baseData;
    });

    let responseBody: string | Buffer;
    let contentType: string;

    switch (format) {
      case 'json':
        contentType = 'application/json';
        responseBody = JSON.stringify(exportData, null, 2);
        break;
      
      case 'csv':
        contentType = 'text/csv';
        if (exportData.length === 0) {
          responseBody = '';
        } else {
          const headers = Object.keys(exportData[0]);
          const csvContent = [
            headers.join(','),
            ...exportData.map(row => 
              headers.map(header => {
                const value = row[header as keyof typeof row];
                // Escape CSV values
                if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value || '';
              }).join(',')
            )
          ].join('\n');
          responseBody = csvContent;
        }
        break;
      
      case 'xlsx':
        // For XLSX, we'll return JSON for now since we don't have xlsx library
        // In a real implementation, you'd use a library like 'xlsx' or 'exceljs'
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        responseBody = JSON.stringify(exportData, null, 2);
        break;
      
      default:
        contentType = 'text/csv';
        responseBody = '';
    }

    // Create response with proper headers
    const response = new NextResponse(responseBody, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

    return response;
  } catch (error) {
    console.error('Export activities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 