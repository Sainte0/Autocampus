import { NextRequest, NextResponse } from 'next/server';
import { toggleUserSuspension } from '../../../../lib/moodle';
import { verifyToken } from '../../../../lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Verificar token de autenticación
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

    const { userId, suspend } = await request.json();

    if (!userId || typeof suspend !== 'boolean') {
      return NextResponse.json(
        { error: 'Se requiere userId y suspend (boolean)' },
        { status: 400 }
      );
    }

    console.log(`Suspensión GLOBAL: Usuario ${userId} - ${suspend ? 'Suspender' : 'Reactivar'} - Realizada por: ${payload.username}`);

    const result = await toggleUserSuspension(userId, suspend);

    if (result.success) {
      return NextResponse.json({
        message: `Usuario ${suspend ? 'suspendido' : 'reactivado'} globalmente en Moodle`,
        userId,
        suspended: suspend
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Error al actualizar el usuario' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error en toggle-suspension:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 