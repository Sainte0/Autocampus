import { NextRequest, NextResponse } from 'next/server';
import { getEnrolledStudents, getCourseStudentsTemporary, getEnrolmentStatus } from '../../../../lib/moodle';

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

    console.log(`\n🌐 [API ROUTE] === INICIO: Solicitando estudiantes INSCRITOS para el curso ${courseIdNum} ===`);
    
    // Intentar PRIMERO con la función específica para estudiantes inscritos
    let response = await getEnrolledStudents(courseIdNum);
    let methodUsed = 'getEnrolledStudents';

    console.log(`🌐 [API ROUTE] Respuesta de getEnrolledStudents:`, {
      success: response.success,
      dataLength: response.data?.length || 0,
      error: response.error
    });

    // Si no funciona, usar la función temporal
    if (!response.success || !response.data || response.data.length === 0) {
      console.log('🌐 [API ROUTE] Función de estudiantes inscritos falló, usando método temporal...');
      response = await getCourseStudentsTemporary(courseIdNum);
      methodUsed = 'getCourseStudentsTemporary';
    }

    console.log(`🌐 [API ROUTE] === RESPUESTA COMPLETA:`, {
      success: response.success,
      dataLength: response.data?.length || 0,
      methodUsed: methodUsed
    });

    if (!response.success) {
      console.error('🌐 [API ROUTE] Error obteniendo estudiantes:', response.error);
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
    console.log(`🌐 [API ROUTE] Usuarios obtenidos antes del filtrado: ${users.length}`);
    
    // Buscar específicamente a Tuttolomondo antes del filtrado
    const tuttolomondoBeforeFilter = users.find((user: MoodleUser) => 
      user.id === 4949 || 
      user.username === '33128569' ||
      (user.firstname === 'Aldo Adrian' && user.lastname === 'Tuttolomondo')
    );
    
    if (tuttolomondoBeforeFilter) {
      console.log('🎯 [API ROUTE] TUTTOLOMONDO antes del filtrado:');
      console.log('🎯 [API ROUTE] - ID:', tuttolomondoBeforeFilter.id);
      console.log('🎯 [API ROUTE] - Username:', tuttolomondoBeforeFilter.username);
      console.log('🎯 [API ROUTE] - Suspended (original):', tuttolomondoBeforeFilter.suspended);
      console.log('🎯 [API ROUTE] - Tipo suspended:', typeof tuttolomondoBeforeFilter.suspended);
      console.log('🎯 [API ROUTE] - Objeto completo:', JSON.stringify(tuttolomondoBeforeFilter, null, 2));
    } else {
      console.log('❌ [API ROUTE] Tuttolomondo NO encontrado antes del filtrado');
    }
    
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
      console.log(`🌐 [API ROUTE] Usuarios después del filtrado: ${users.length} (filtrados: ${beforeFilter - users.length})`);
    }

    // Obtener el estado de suspensión para cada usuario
    const usersWithSuspensionStatus = await Promise.all(
      (users as MoodleUser[]).map(async (user: MoodleUser) => {
        try {
          const suspensionStatus = await getEnrolmentStatus(courseIdNum, user.id);
          return {
            ...user,
            suspended: suspensionStatus.suspended || false
          };
        } catch (error) {
          console.error(`🌐 [API ROUTE] Error obteniendo estado de suspensión para usuario ${user.id}:`, error);
          return {
            ...user,
            suspended: false // Por defecto, asumir que no está suspendido
          };
        }
      })
    );

    // Formatear los datos de los estudiantes
    const formattedStudents = usersWithSuspensionStatus.map((user: MoodleUser & { suspended: boolean }) => ({
      id: user.id,
      username: user.username,
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      email: user.email || '',
      fullname: user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
      lastaccess: user.lastaccess || 0,
      suspended: user.suspended
    }));

    console.log(`🌐 [API ROUTE] === FINAL: Encontrados ${formattedStudents.length} estudiantes para el curso ${courseIdNum} ===`);

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
    console.error('🌐 [API ROUTE] Error getting course students:', error);
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