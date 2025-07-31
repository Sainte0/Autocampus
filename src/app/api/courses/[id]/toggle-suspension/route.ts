import { NextRequest, NextResponse } from 'next/server';
import { toggleCourseUserSuspension } from '../../../../../lib/moodle';
import { verifyToken } from '../../../../../lib/jwt';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const courseId = parseInt(id);
    const { userId, suspend } = await request.json();
    
    if (isNaN(courseId) || isNaN(userId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    
    // Pasar el username del usuario que realiza la acción
    const result = await toggleCourseUserSuspension(courseId, userId, suspend, payload.username);
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ error: result.error || 'Error al suspender/reactivar usuario' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error en toggle-suspension:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 