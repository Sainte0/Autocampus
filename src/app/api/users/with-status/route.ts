import { NextRequest, NextResponse } from 'next/server';
import { getUsersWithStatusFilter } from '../../../../lib/moodle';

interface MoodleUser {
  id: number;
  username: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  fullname?: string;
  suspended?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const suspendedParam = searchParams.get('suspended');
    
    // Convertir el parámetro a boolean o undefined
    let suspended: boolean | undefined;
    if (suspendedParam === 'true') {
      suspended = true;
    } else if (suspendedParam === 'false') {
      suspended = false;
    } else {
      suspended = undefined; // Mostrar todos
    }

    console.log(`Obteniendo usuarios con filtro de estado: ${suspended === undefined ? 'todos' : suspended ? 'suspendidos' : 'activos'}`);

    const result = await getUsersWithStatusFilter(suspended);

    if (result.success) {
      // Formatear los datos de los usuarios
      const formattedUsers = (result.data as MoodleUser[]).map((user: MoodleUser) => ({
        id: user.id,
        username: user.username,
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        email: user.email || '',
        fullname: user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
        suspended: user.suspended || false
      }));

      return NextResponse.json({
        users: formattedUsers,
        message: `Encontrados ${formattedUsers.length} usuarios`,
        filter: suspended === undefined ? 'todos' : suspended ? 'suspendidos' : 'activos'
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Error al obtener usuarios',
          details: result.error
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error obteniendo usuarios con estado:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
} 