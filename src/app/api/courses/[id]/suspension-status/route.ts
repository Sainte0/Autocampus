import { NextRequest, NextResponse } from 'next/server';
import { getAllSuspensionStatusFromDB } from '../../../../../lib/suspension-db';
import { verifyToken } from '../../../../../lib/jwt';

export async function GET(
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
    
    if (isNaN(courseId)) {
      return NextResponse.json({ error: 'ID de curso inválido' }, { status: 400 });
    }
    
    // Obtener todos los estados de suspensión del curso desde la base de datos
    const suspensionStatuses = await getAllSuspensionStatusFromDB(courseId);
    
    return NextResponse.json({ 
      success: true, 
      data: suspensionStatuses,
      count: suspensionStatuses.length
    });
    
  } catch (error) {
    console.error('Error obteniendo estados de suspensión:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 