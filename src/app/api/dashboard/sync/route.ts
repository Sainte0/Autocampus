import { NextRequest, NextResponse } from 'next/server';
import { syncDashboardData, syncDashboardDataOptimized } from '../../../../lib/dashboard-sync';
import { verifyToken } from '../../../../lib/jwt';

export async function POST(request: NextRequest) {
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

    // Obtener parámetros del body para elegir tipo de sincronización
    const body = await request.json().catch(() => ({}));
    const useOptimized = body.optimized !== false; // Por defecto usar optimizada

    // Iniciar sincronización
    const result = useOptimized ? await syncDashboardDataOptimized() : await syncDashboardData();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Sincronización iniciada exitosamente',
        stats: {
          totalUsers: result.stats?.totalUsers || 0,
          totalCourses: result.stats?.totalCourses || 0,
          lastSync: result.stats?.lastSync,
          syncStatus: result.stats?.syncStatus
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Error en la sincronización'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error en API de sincronización:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
} 