import { NextRequest, NextResponse } from 'next/server';
import { getLatestDashboardStats, getDashboardStatsByType } from '../../../../lib/dashboard-sync';
import { verifyToken } from '../../../../lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Token de autorización requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Acceso denegado' }, { status: 403 });
    }

    // Obtener parámetros de consulta
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'globallySuspended' | 'multipleCourses' | 'neverAccessed' | 'courseSuspended' | null;

    if (type) {
      // Obtener estadísticas específicas por tipo
      const result = await getDashboardStatsByType(type);
      
      if (result.success) {
        return NextResponse.json({
          success: true,
          data: result.data || []
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'Error obteniendo estadísticas'
        }, { status: 500 });
      }
    } else {
      // Obtener todas las estadísticas
      const result = await getLatestDashboardStats();
      
      if (result.success && result.stats) {
        return NextResponse.json({
          success: true,
          stats: {
            globallySuspendedUsers: result.stats.globallySuspendedUsers,
            usersWithMultipleCourses: result.stats.usersWithMultipleCourses,
            neverAccessedUsers: result.stats.neverAccessedUsers,
            courseSuspendedUsers: result.stats.courseSuspendedUsers,
            totalUsers: result.stats.totalUsers,
            totalCourses: result.stats.totalCourses,
            lastSync: result.stats.lastSync,
            syncStatus: result.stats.syncStatus,
            syncError: result.stats.syncError
          }
        });
      } else {
        return NextResponse.json({
          success: false,
          error: result.error || 'No hay estadísticas disponibles'
        }, { status: 404 });
      }
    }
    
  } catch (error) {
    console.error('Error en API de estadísticas:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
} 