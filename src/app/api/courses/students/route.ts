import { NextRequest, NextResponse } from 'next/server';
import { getEnrolledStudents, getCourseStudentsTemporary } from '../../../../lib/moodle';

interface MoodleUser {
  id: number;
  username: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  fullname?: string;
  lastaccess?: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    
    if (!courseId) {
      return NextResponse.json(
        { error: 'courseId es requerido' },
        { status: 400 }
      );
    }

    const courseIdNum = parseInt(courseId);
    
    if (isNaN(courseIdNum)) {
      return NextResponse.json(
        { error: 'ID de curso inválido' },
        { status: 400 }
      );
    }

    console.log(`=== INICIO: Solicitando estudiantes INSCRITOS para el curso ${courseIdNum} ===`);
    
    // Intentar PRIMERO con la función específica para estudiantes inscritos
    let response = await getEnrolledStudents(courseIdNum);
    let methodUsed = 'getEnrolledStudents';

    // Si no funciona, usar la función temporal
    if (!response.success || !response.data || response.data.length === 0) {
      console.log('Función de estudiantes inscritos falló, usando método temporal...');
      response = await getCourseStudentsTemporary(courseIdNum);
      methodUsed = 'getCourseStudentsTemporary';
    }

    console.log(`=== RESPUESTA COMPLETA:`, response);

    if (!response.success) {
      console.error('Error obteniendo estudiantes:', response.error);
      return NextResponse.json(
        { 
          error: 'Error al obtener estudiantes del curso',
          details: response.error,
          students: []
        },
        { status: 500 }
      );
    }

    let users = response.data || [];
    console.log(`Usuarios obtenidos antes del filtrado: ${users.length}`);
    
    // Filtrar solo estudiantes válidos
    if (Array.isArray(users)) {
      const beforeFilter = users.length;
      users = users.filter((user: MoodleUser) => {
        // Verificar que el usuario tenga datos válidos
        if (!user || !user.id || !user.username) {
          console.log(`Filtrando usuario sin datos válidos:`, user);
          return false;
        }
        
        // Excluir usuarios que probablemente no sean estudiantes
        const excludedUsernames = ['admin', 'guest', 'teacher', 'professor', 'manager'];
        const isExcluded = excludedUsernames.some(excluded => 
          user.username.toLowerCase().includes(excluded)
        );
        
        if (isExcluded) {
          console.log(`Filtrando usuario excluido: ${user.username}`);
          return false;
        }
        
        // Verificar que tenga nombre y apellido
        if (!user.firstname || !user.lastname) {
          console.log(`Filtrando usuario sin nombre/apellido: ${user.username}`);
          return false;
        }
        
        // Verificar que tenga email válido
        if (!user.email || !user.email.includes('@')) {
          console.log(`Filtrando usuario sin email válido: ${user.username}`);
          return false;
        }
        
        console.log(`Usuario válido encontrado: ${user.username} - ${user.firstname} ${user.lastname}`);
        return true;
      });
      console.log(`Usuarios después del filtrado: ${users.length} (filtrados: ${beforeFilter - users.length})`);
    }

    // Formatear los datos de los estudiantes
    const formattedStudents = (users as MoodleUser[]).map((user: MoodleUser) => ({
      id: user.id,
      username: user.username,
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      email: user.email || '',
      fullname: user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
      lastaccess: user.lastaccess || 0
    }));

    console.log(`=== FINAL: Encontrados ${formattedStudents.length} estudiantes para el curso ${courseIdNum} ===`);

    // Crear mensaje informativo
    const message = `Mostrando ${formattedStudents.length} estudiantes del curso ${courseIdNum}.`;
    // Eliminar el mensaje técnico innecesario para el usuario final
    // if (methodUsed === 'getCourseStudentsTemporary') {
    //   message += ' ⚠️ Para obtener estudiantes específicos del curso, necesitas habilitar la función "core_enrol_get_enrolled_users" en el servicio web de Moodle.';
    // }

    return NextResponse.json({ 
      students: formattedStudents,
      message: message,
      method: methodUsed,
      debug: {
        originalUsers: response.data?.length || 0,
        filteredUsers: formattedStudents.length,
        courseId: courseIdNum,
        methodUsed: methodUsed,
        note: methodUsed === 'getCourseStudentsTemporary' ? 'Usando método temporal - habilitar APIs de enrollment en Moodle para obtener estudiantes específicos del curso' : 'Usando APIs de enrollment'
      }
    });
  } catch (error) {
    console.error('Error getting course students:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
        students: []
      },
      { status: 500 }
    );
  }
} 