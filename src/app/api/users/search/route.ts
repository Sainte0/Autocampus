import { NextRequest, NextResponse } from 'next/server';
import { searchUsersSimple, searchUsersAdvanced } from '../../../../lib/moodle';

interface MoodleUser {
  id: number;
  username: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  fullname?: string;
  suspended?: boolean;
  lastaccess?: number;
}

export async function GET(request: NextRequest) {
  return handleSearch(request);
}

export async function POST(request: NextRequest) {
  return handleSearch(request);
}

async function handleSearch(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('q');
    const searchType = searchParams.get('type') || 'simple';
    const testMode = searchParams.get('test') === 'true';
    
    // Parámetros para búsqueda avanzada
    const firstName = searchParams.get('firstname');
    const lastName = searchParams.get('lastname');
    const email = searchParams.get('email');
    const username = searchParams.get('username');

    console.log(`=== INICIO: Búsqueda de usuarios ===`);
    console.log('Tipo de búsqueda:', searchType);
    console.log('Término de búsqueda:', searchTerm);
    console.log('Modo de prueba:', testMode);
    console.log('Parámetros avanzados:', { firstName, lastName, email, username });

    // Si está en modo de prueba, ejecutar diagnóstico
    if (testMode && searchTerm) {
      console.log('Ejecutando modo de prueba...');
      const testResults = await searchUsersSimple(searchTerm);
      return NextResponse.json({ 
        testMode: true,
        results: testResults,
        message: 'Prueba de búsqueda simple completada'
      });
    }

    let response;
    let methodUsed = '';

    try {
      if (searchType === 'advanced') {
        // Búsqueda avanzada con múltiples criterios
        const criteria: { key: string; value: string }[] = [];
        
        if (firstName) criteria.push({ key: 'firstname', value: firstName });
        if (lastName) criteria.push({ key: 'lastname', value: lastName });
        if (email) criteria.push({ key: 'email', value: email });
        if (username) criteria.push({ key: 'username', value: username });

        if (criteria.length === 0) {
          return NextResponse.json(
            { error: 'Debes especificar al menos un criterio de búsqueda' },
            { status: 400 }
          );
        }

        response = await searchUsersAdvanced(criteria);
        methodUsed = 'searchUsersAdvanced';
      } else {
        // Búsqueda simple - buscar en todos los campos automáticamente
        if (!searchTerm) {
          return NextResponse.json(
            { error: 'Término de búsqueda requerido' },
            { status: 400 }
          );
        }

        response = await searchUsersSimple(searchTerm);
        methodUsed = 'searchUsersSimple';
      }
    } catch (searchError) {
      console.error('Error en la función de búsqueda:', searchError);
      return NextResponse.json(
        { 
          error: 'Error en la función de búsqueda',
          details: searchError instanceof Error ? searchError.message : 'Error desconocido en búsqueda',
          users: []
        },
        { status: 500 }
      );
    }

    console.log(`=== RESPUESTA COMPLETA:`, response);

    if (!response.success) {
      console.error('Error en búsqueda:', response);
      return NextResponse.json(
        { 
          error: 'Error al buscar usuarios',
          details: 'Error en la búsqueda',
          users: []
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

    // Formatear los datos de los usuarios
    const formattedUsers = (users as MoodleUser[]).map((user: MoodleUser) => ({
      id: user.id,
      username: user.username,
      firstname: user.firstname || '',
      lastname: user.lastname || '',
      email: user.email || '',
      fullname: user.fullname || `${user.firstname || ''} ${user.lastname || ''}`.trim(),
      suspended: user.suspended || false,  // Asegurar que siempre esté presente
      lastaccess: user.lastaccess || 0  // Incluir información del último acceso
    }));

    console.log(`=== FINAL: Encontrados ${formattedUsers.length} usuarios ===`);

    return NextResponse.json({ 
      users: formattedUsers,
      message: `Encontrados ${formattedUsers.length} usuarios.`,
      method: methodUsed,
      searchType: searchType,
      debug: {
        originalUsers: response.data?.length || 0,
        filteredUsers: formattedUsers.length,
        searchTerm: searchTerm,
        searchType: searchType,
        methodUsed: methodUsed
      }
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
        users: []
      },
      { status: 500 }
    );
  }
} 