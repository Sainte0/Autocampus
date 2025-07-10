import { NextRequest, NextResponse } from 'next/server';
import { getCourses } from '../../../../lib/moodle';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const courseId = parseInt(id);
    
    if (isNaN(courseId)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    // Obtener todos los cursos
    const coursesResponse = await getCourses();
    
    if (!coursesResponse.success || !coursesResponse.data) {
      return NextResponse.json(
        { error: 'Error al obtener cursos' },
        { status: 500 }
      );
    }

    // Buscar el curso específico
    const course = coursesResponse.data.find(c => c.id === courseId);
    
    if (!course) {
      return NextResponse.json(
        { error: 'Curso no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error('Error getting course:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 