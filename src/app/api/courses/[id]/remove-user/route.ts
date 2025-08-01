import { NextRequest, NextResponse } from 'next/server';
import { removeUserFromCourse } from '../../../../../lib/moodle';
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
    const { userId } = await request.json();
    
    if (isNaN(courseId) || isNaN(userId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    
    console.log(`Eliminación de usuario: Curso ${courseId}, Usuario ${userId} - Realizada por: ${payload.username}`);
    
    const result = await removeUserFromCourse(courseId, userId);
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ error: result.error || 'Error al eliminar usuario del curso' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error en remove-user:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 