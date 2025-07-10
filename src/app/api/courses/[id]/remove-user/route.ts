import { NextRequest, NextResponse } from 'next/server';
import { removeUserFromCourse } from '../../../../../lib/moodle';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);
    const { userId } = await request.json();
    if (isNaN(courseId) || isNaN(userId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }
    const result = await removeUserFromCourse(courseId, userId);
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ error: result.error || 'Error al eliminar usuario del curso' }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
} 