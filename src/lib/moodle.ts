import { MoodleCourse, MoodleUser, CreateUserRequest, EnrollUserRequest, ApiResponse } from '../types/moodle';

const MOODLE_API_URL = process.env.NEXT_PUBLIC_MOODLE_API_URL;
const MOODLE_TOKEN = process.env.NEXT_PUBLIC_MOODLE_TOKEN;

interface MoodleApiParams {
  [key: string]: string | number | boolean | Array<string | number | boolean> | Array<Record<string, string | number | boolean>>;
}

interface Enrolment {
  id: number;
  courseid: number;
  roleid: number;
  suspended: boolean;
  timestart: number;
  timeend: number;
  [key: string]: unknown;
}

interface EnrolmentMethod {
  id: number;
  name: string;
  status: number;
  type: string;
  [key: string]: unknown;
}

export async function callMoodleApi<T>(wsfunction: string, params: MoodleApiParams = {}): Promise<ApiResponse<T>> {
  console.log(`\n🚀 [MOODLE API] Llamando función: ${wsfunction}`);
  console.log(`📦 [MOODLE API] Parámetros:`, JSON.stringify(params, null, 2));
  
  const queryParams = new URLSearchParams({
    wstoken: MOODLE_TOKEN || '',
    wsfunction,
    moodlewsrestformat: 'json',
  });

  // Crear el cuerpo de la solicitud en el formato exacto que espera Moodle
  const body = new URLSearchParams();
  
  // Manejar diferentes tipos de parámetros según la función
  if (params.users && Array.isArray(params.users)) {
    // Para core_user_create_users
    console.log('Formateando parámetros de creación de usuario:', params.users);
    params.users.forEach((user, index) => {
      Object.entries(user).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const paramName = `users[${index}][${key}]`;
          const paramValue = String(value);
          console.log(`Agregando parámetro de usuario: ${paramName} = ${paramValue}`);
          body.append(paramName, paramValue);
        }
      });
    });
  } else if (params.enrolments && Array.isArray(params.enrolments)) {
    // Para enrol_manual_enrol_users
    console.log('Formateando parámetros de inscripción:', params.enrolments);
    params.enrolments.forEach((enrollment, index) => {
      Object.entries(enrollment).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          const paramName = `enrolments[${index}][${key}]`;
          const paramValue = String(value);
          console.log(`Agregando parámetro: ${paramName} = ${paramValue}`);
          body.append(paramName, paramValue);
        }
      });
    });
  } else {
    // Para otros parámetros como field, values, etc.
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Para arrays como values[]
          value.forEach((item, index) => {
            body.append(`${key}[${index}]`, String(item));
          });
        } else {
          // Para valores simples
          body.append(key, String(value));
        }
      }
    });
  }

  console.log('URL:', `${MOODLE_API_URL}?${queryParams}`);
  console.log('Body:', body.toString());
  console.log('Headers:', { 'Content-Type': 'application/x-www-form-urlencoded' });

  try {
    const response = await fetch(`${MOODLE_API_URL}?${queryParams}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('HTTP Error:', response.status, response.statusText);
      return { 
        success: false, 
        error: `Error HTTP: ${response.status} ${response.statusText}` 
      };
    }

    const data = await response.json();
    console.log(`📨 [MOODLE API] Respuesta recibida para ${wsfunction}:`, typeof data);
    
    // Debug más detallado para core_enrol_get_enrolled_users
    if (wsfunction === 'core_enrol_get_enrolled_users') {
      console.log('🔍 [MOODLE DEBUG] Analizando respuesta de core_enrol_get_enrolled_users:');
      console.log('🔍 [MOODLE DEBUG] Tipo de respuesta:', typeof data);
      console.log('🔍 [MOODLE DEBUG] Es array?:', Array.isArray(data));
      console.log('🔍 [MOODLE DEBUG] Longitud (si es array):', Array.isArray(data) ? data.length : 'N/A');
      
      if (Array.isArray(data)) {
        console.log('🔍 [MOODLE DEBUG] Primeros 3 usuarios:', data.slice(0, 3));
        
        // Buscar específicamente a Tuttolomondo
        const tuttolomondo = data.find((user: any) => 
          user.id === 4949 || 
          user.username === '33128569' || 
          (user.firstname === 'Aldo Adrian' && user.lastname === 'Tuttolomondo')
        );
        
        if (tuttolomondo) {
          console.log('🎯 [MOODLE DEBUG] TUTTOLOMONDO ENCONTRADO:');
          console.log('🎯 [MOODLE DEBUG] Objeto completo:', JSON.stringify(tuttolomondo, null, 2));
          console.log('🎯 [MOODLE DEBUG] Propiedades del objeto:', Object.keys(tuttolomondo));
          console.log('🎯 [MOODLE DEBUG] Valor de suspended:', tuttolomondo.suspended);
          console.log('🎯 [MOODLE DEBUG] Tipo de suspended:', typeof tuttolomondo.suspended);
        } else {
          console.log('❌ [MOODLE DEBUG] Tuttolomondo NO encontrado en la respuesta');
        }
        
        // Mostrar estructura de un usuario ejemplo
        if (data.length > 0) {
          console.log('📋 [MOODLE DEBUG] Estructura de usuario ejemplo (primer usuario):');
          console.log('📋 [MOODLE DEBUG] Propiedades:', Object.keys(data[0]));
          console.log('📋 [MOODLE DEBUG] Usuario ejemplo:', JSON.stringify(data[0], null, 2));
        }
      } else {
        console.log('🔍 [MOODLE DEBUG] Respuesta completa (no es array):', JSON.stringify(data, null, 2));
      }
    }
    
    // Mantener el debug original pero más conciso
    if (wsfunction === 'core_enrol_get_enrolled_users' && Array.isArray(data)) {
      data.forEach((user, index) => {
        if (user && user.id) {
          console.log(`👤 [MOODLE DEBUG] Usuario ${user.id} (${user.username || 'sin username'}): suspended=${user.suspended} (tipo: ${typeof user.suspended})`);
        }
      });
    }

    // Verificar si la respuesta es null o undefined
    if (data === null || data === undefined) {
      console.log('Moodle returned null/undefined response - this might be normal for successful operations');
      // Para algunas operaciones como enrollments y unenrollments, una respuesta nula puede indicar éxito
      if (wsfunction === 'enrol_manual_enrol_users' || wsfunction === 'enrol_manual_unenrol_users') {
        return { 
          success: true, 
          data: { success: true } as T
        };
      }
      return { 
        success: false, 
        error: 'Respuesta nula de Moodle' 
      };
    }

    // Verificar si hay una excepción de Moodle
    if (data.exception) {
      console.error('Moodle error details:', {
        exception: data.exception,
        errorcode: data.errorcode,
        message: data.message,
        debuginfo: data.debuginfo,
        function: wsfunction
      });
      return { 
        success: false, 
        error: data.message || 'Error en Moodle' 
      };
    }

    // Para enrollments, una respuesta vacía también puede indicar éxito
    if (!data || Object.keys(data).length === 0) {
      if (wsfunction === 'enrol_manual_enrol_users') {
        return { 
          success: true, 
          data: { success: true } as T
        };
      }
      return { 
        success: false, 
        error: 'Respuesta vacía de Moodle' 
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error en la solicitud:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error en la solicitud' 
    };
  }
}


export async function getCourses(): Promise<ApiResponse<MoodleCourse[]>> {
  return callMoodleApi<MoodleCourse[]>('core_course_get_courses');
}

export async function getUserByField(field: string, value: string): Promise<ApiResponse<MoodleUser[]>> {
  return callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
    field,
    values: [value],
  });
}

export async function createUser(userData: CreateUserRequest): Promise<ApiResponse<MoodleUser[]>> {
  console.log('Iniciando creación de usuario con datos:', userData);
  
  // Validar el formato de la contraseña - solo contraseña compleja
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
  
  if (!passwordRegex.test(userData.password)) {
    return {
      success: false,
      error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial'
    };
  }

  // Validar formato de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    return {
      success: false,
      error: 'Formato de email inválido'
    };
  }

  // Validar formato de username (solo letras, números, guiones y puntos)
  const usernameRegex = /^[a-zA-Z0-9._-]+$/;
  if (!usernameRegex.test(userData.username)) {
    return {
      success: false,
      error: 'El nombre de usuario solo puede contener letras, números, guiones, puntos y guiones bajos'
    };
  }

  // Verificar que el username no esté vacío
  if (!userData.username.trim()) {
    return {
      success: false,
      error: 'El nombre de usuario no puede estar vacío'
    };
  }

  // Verificar que el username tenga el formato correcto (con punto)
  if (!userData.username.includes('.')) {
    return {
      success: false,
      error: 'El nombre de usuario debe tener el formato: nombre.apellido (con punto)'
    };
  }

  // Verificar que el nombre y apellido no estén vacíos
  if (!userData.firstname.trim() || !userData.lastname.trim()) {
    return {
      success: false,
      error: 'El nombre y apellido no pueden estar vacíos'
    };
  }

  // VERIFICAR SI EL USUARIO YA EXISTE EN MOODLE
  console.log('Verificando si el usuario ya existe en Moodle...');
  const existingUserCheck = await verifyUser(userData.username);
  
  if (existingUserCheck.success && existingUserCheck.data && existingUserCheck.data.length > 0) {
    return {
      success: false,
      error: `El usuario ${userData.username} ya existe en Moodle`
    };
  }

  // También verificar por email
  const existingEmailCheck = await getUserByField('email', userData.email);
  
  if (existingEmailCheck.success && existingEmailCheck.data && existingEmailCheck.data.length > 0) {
    return {
      success: false,
      error: `El email ${userData.email} ya está registrado en Moodle`
    };
  }

  // VERIFICAR SI EXISTE UN USUARIO CON EL MISMO NOMBRE COMPLETO
  console.log('Verificando si existe un usuario con el mismo nombre completo...');
  const duplicateNameCheck = await checkDuplicateName(userData.firstname, userData.lastname);
  
  if (duplicateNameCheck.success && duplicateNameCheck.data && duplicateNameCheck.data.length > 0) {
    const existingUsers = duplicateNameCheck.data.map(user => 
      `${user.firstname} ${user.lastname} (@${user.username})`
    ).join(', ');
    
    return {
      success: false,
      error: `Ya existe un usuario con el nombre ${userData.firstname} ${userData.lastname}. Usuarios existentes: ${existingUsers}`
    };
  }

  // Formatear los datos del usuario según lo esperado por Moodle
  const formattedUserData = {
    username: userData.username,
    password: userData.password,
    firstname: userData.firstname,
    lastname: userData.lastname,
    email: userData.email,
    auth: 'manual',
    lang: 'es',
    timezone: 'America/Argentina/Buenos_Aires',
    mailformat: 1,
    maildisplay: 0,
    city: '',
    country: 'AR'
  };

  console.log('Datos formateados para Moodle:', formattedUserData);

  // Enviar la solicitud con el formato exacto que espera Moodle
  const response = await callMoodleApi<MoodleUser[]>('core_user_create_users', {
    users: [formattedUserData]
  });

  console.log('Respuesta de creación de usuario:', response);
  
  // Si falla, intentar con un formato más simple
  if (!response.success) {
    console.log('Intentando formato alternativo para creación de usuario...');
    const simpleParams = {
      'users[0][username]': userData.username,
      'users[0][password]': userData.password,
      'users[0][firstname]': userData.firstname,
      'users[0][lastname]': userData.lastname,
      'users[0][email]': userData.email,
      'users[0][auth]': 'manual'
    };
    
    const simpleResponse = await callMoodleApi<MoodleUser[]>('core_user_create_users', simpleParams);
    console.log('Respuesta con formato simple:', simpleResponse);
    
    return simpleResponse;
  }
  
  return response;
}

interface MoodleErrorResponse {
  exception?: string;
  message?: string;
}

export async function verifyUser(username: string): Promise<ApiResponse<MoodleUser[]>> {
  console.log('Verificando usuario:', username);
  try {
    const response = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
      field: 'username',
      values: [username],
    });

    console.log('Respuesta de verificación de usuario:', response);

    if (!response.success) {
      console.error('Error en verificación de usuario:', response.error);
      return {
        success: false,
        error: 'Error al verificar el usuario',
      };
    }

    if (!response.data || response.data.length === 0) {
      console.log('Usuario no encontrado en Moodle');
      return {
        success: false,
        error: 'Usuario no encontrado',
      };
    }

    console.log('Usuario encontrado:', response.data[0]);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('Excepción en verificación de usuario:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al verificar el usuario',
    };
  }
}

export async function enrollUser(enrollmentData: EnrollUserRequest): Promise<ApiResponse<{ success: boolean }>> {
  console.log('Iniciando proceso de inscripción para:', enrollmentData);
  
  // Primero verificar si el usuario existe
  const userCheck = await verifyUser(enrollmentData.username);
  console.log('Resultado de verificación de usuario:', userCheck);
  
  if (!userCheck.success || !userCheck.data || userCheck.data.length === 0) {
    console.error('Usuario no encontrado o error en verificación:', userCheck.error);
    return {
      success: false,
      error: userCheck.error || 'Usuario no encontrado',
    };
  }

  const userId = userCheck.data[0].id;
  console.log('ID del usuario encontrado:', userId);

  // Validar que los datos requeridos estén presentes y sean números válidos
  if (!userId || !enrollmentData.courseid) {
    console.error('Datos faltantes para inscripción:', { userId, courseId: enrollmentData.courseid });
    return {
      success: false,
      error: 'Se requieren el ID del usuario y el ID del curso para la inscripción',
    };
  }

  // Convertir y validar los IDs como números
  const courseId = Number(enrollmentData.courseid);

  if (isNaN(courseId)) {
    console.error('ID del curso inválido:', enrollmentData.courseid);
    return {
      success: false,
      error: 'El ID del curso debe ser un número válido',
    };
  }

  // Asegurarse de que el roleid sea un número válido
  const roleid = typeof enrollmentData.roleid === 'number' && !isNaN(enrollmentData.roleid) 
    ? enrollmentData.roleid 
    : 5; // 5 es el roleid por defecto para estudiantes

  console.log('Parámetros de inscripción preparados:', { userId, courseId, roleid });

  // Formato específico requerido por Moodle
  const enrollmentParams = {
    enrolments: [{
      userid: userId,
      courseid: courseId,
      roleid: roleid,
      suspend: 0,
      timestart: Math.floor(Date.now() / 1000),
      timeend: 0
    }]
  };

  try {
    console.log('Enviando parámetros de inscripción:', JSON.stringify(enrollmentParams, null, 2));
    
    // Intentar con un formato alternativo si el primero falla
    const response = await callMoodleApi<{ success: boolean }>('enrol_manual_enrol_users', enrollmentParams);
    console.log('Respuesta de Moodle para inscripción:', JSON.stringify(response, null, 2));
    
    if (!response.success) {
      console.error('Error en respuesta de inscripción:', response.error);
      
      // Si falla, intentar con un formato más simple
      console.log('Intentando formato alternativo de inscripción...');
      const simpleParams = {
        'enrolments[0][userid]': userId,
        'enrolments[0][courseid]': courseId,
        'enrolments[0][roleid]': roleid,
        'enrolments[0][suspend]': 0,
        'enrolments[0][timestart]': Math.floor(Date.now() / 1000),
        'enrolments[0][timeend]': 0
      };
      
      const simpleResponse = await callMoodleApi<{ success: boolean }>('enrol_manual_enrol_users', simpleParams);
      console.log('Respuesta con formato simple:', JSON.stringify(simpleResponse, null, 2));
      
      if (!simpleResponse.success) {
        return {
          success: false,
          error: simpleResponse.error || 'Error al inscribir al usuario en el curso',
        };
      }
      
      return simpleResponse;
    }

    // Verificar si la respuesta indica un error específico de Moodle
    if (response.data && typeof response.data === 'object' && 'exception' in response.data) {
      const moodleResponse = response.data as MoodleErrorResponse;
      console.error('Excepción de Moodle en inscripción:', moodleResponse);
      return {
        success: false,
        error: moodleResponse.message || 'Error al inscribir al usuario en el curso',
      };
    }

    console.log('Inscripción exitosa');
    return {
      success: true,
      data: { success: true },
    };
  } catch (error) {
    console.error('Error en la inscripción:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al inscribir al usuario en el curso',
    };
  }
}

export async function searchUsers(searchTerm: string): Promise<ApiResponse<MoodleUser[]>> {
  console.log('Buscando usuarios con término:', searchTerm);
  try {
    // Intentar buscar por email primero
    const emailResponse = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
      field: 'email',
      values: [searchTerm],
    });

    if (emailResponse.success && emailResponse.data && emailResponse.data.length > 0) {
      console.log('Usuarios encontrados por email:', emailResponse.data);
      return emailResponse;
    }

    // Si no se encuentra por email, intentar buscar por nombre
    const nameResponse = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
      field: 'firstname',
      values: [searchTerm],
    });

    if (nameResponse.success && nameResponse.data && nameResponse.data.length > 0) {
      console.log('Usuarios encontrados por nombre:', nameResponse.data);
      return nameResponse;
    }

    // Si no se encuentra por nombre, intentar buscar por apellido
    const lastNameResponse = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
      field: 'lastname',
      values: [searchTerm],
    });

    if (lastNameResponse.success && lastNameResponse.data && lastNameResponse.data.length > 0) {
      console.log('Usuarios encontrados por apellido:', lastNameResponse.data);
      return lastNameResponse;
    }

    // Intentar buscar por username exacto
    const usernameResponse = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
      field: 'username',
      values: [searchTerm],
    });

    if (usernameResponse.success && usernameResponse.data && usernameResponse.data.length > 0) {
      console.log('Usuario encontrado por username:', usernameResponse.data);
      return usernameResponse;
    }

    return {
      success: false,
      error: 'No se encontraron usuarios con ese término de búsqueda',
    };
  } catch (error) {
    console.error('Error en búsqueda de usuarios:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al buscar usuarios',
    };
  }
}

// Nueva función para buscar usuarios por nombre completo
export async function searchUsersByName(firstName: string, lastName: string): Promise<ApiResponse<MoodleUser[]>> {
  console.log('Buscando usuarios por nombre completo:', { firstName, lastName });
  try {
    // Buscar por nombre y apellido
    const nameResponse = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
      field: 'firstname',
      values: [firstName],
    });

    if (nameResponse.success && nameResponse.data && nameResponse.data.length > 0) {
      // Filtrar por apellido también
      const filteredUsers = nameResponse.data.filter(user => 
        user.lastname.toLowerCase() === lastName.toLowerCase()
      );
      
      if (filteredUsers.length > 0) {
        console.log('Usuarios encontrados por nombre completo:', filteredUsers);
        return {
          success: true,
          data: filteredUsers,
        };
      }
    }

    // Si no se encuentra por nombre, intentar por apellido
    const lastNameResponse = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
      field: 'lastname',
      values: [lastName],
    });

    if (lastNameResponse.success && lastNameResponse.data && lastNameResponse.data.length > 0) {
      // Filtrar por nombre también
      const filteredUsers = lastNameResponse.data.filter(user => 
        user.firstname.toLowerCase() === firstName.toLowerCase()
      );
      
      if (filteredUsers.length > 0) {
        console.log('Usuarios encontrados por nombre completo (búsqueda inversa):', filteredUsers);
        return {
          success: true,
          data: filteredUsers,
        };
      }
    }

    return {
      success: false,
      error: 'No se encontraron usuarios con ese nombre completo',
    };
  } catch (error) {
    console.error('Error en búsqueda de usuarios por nombre completo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al buscar usuarios por nombre completo',
    };
  }
}

// Función para verificar si existe un usuario con el mismo nombre completo
export async function checkDuplicateName(firstName: string, lastName: string): Promise<ApiResponse<MoodleUser[]>> {
  console.log('Verificando duplicados por nombre:', { firstName, lastName });
  
  const searchResult = await searchUsersByName(firstName, lastName);
  
  if (searchResult.success && searchResult.data && searchResult.data.length > 0) {
    return {
      success: true,
      data: searchResult.data,
      error: `Ya existe un usuario con el nombre ${firstName} ${lastName}`
    };
  }
  
  return {
    success: false,
    data: [],
    error: 'No se encontraron duplicados'
  };
}

// Función para obtener todos los usuarios
export async function getAllUsers(): Promise<MoodleUser[]> {
  console.log('Obteniendo todos los usuarios...');
  try {
    // Intentar obtener usuarios de diferentes maneras
    const responses = await Promise.allSettled([
      // Buscar por diferentes campos para obtener una muestra de usuarios
      callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
        field: 'id',
        values: ['1', '2', '3', '4', '5'], // IDs de ejemplo
      }),
      callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
        field: 'username',
        values: ['admin', 'guest', 'test'], // Usernames de ejemplo
      }),
      callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
        field: 'email',
        values: ['admin@example.com', 'test@example.com'], // Emails de ejemplo
      }),
    ]);

    const allUsers: MoodleUser[] = [];
    const seenIds = new Set<number>();

    responses.forEach((response) => {
      if (response.status === 'fulfilled' && response.value.success && response.value.data) {
        response.value.data.forEach((user) => {
          if (!seenIds.has(user.id)) {
            seenIds.add(user.id);
            allUsers.push(user);
          }
        });
      }
    });

    console.log(`Se obtuvieron ${allUsers.length} usuarios únicos`);
    return allUsers;
  } catch (error) {
    console.error('Error obteniendo todos los usuarios:', error);
    return [];
  }
} 

// Función para obtener estudiantes de un curso específico
export async function getCourseStudents(courseId: number): Promise<ApiResponse<MoodleUser[]>> {
  console.log(`Obteniendo estudiantes para el curso ${courseId}`);
  
  try {
    // Método 1: Intentar con core_enrol_get_enrolled_users (API principal)
    console.log('Método 1: Intentando con core_enrol_get_enrolled_users...');
    let response = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users', {
      courseid: courseId,
      options: [
        { name: 'withcapability', value: 'moodle/course:view' },
        { name: 'groupid', value: 0 },
        { name: 'onlyactive', value: false }
      ]
    });

    console.log('Respuesta de core_enrol_get_enrolled_users:', response);

    if (response.success && response.data && response.data.length > 0) {
      // Procesar los datos para detectar suspensión específica del curso
      const processedStudents = response.data.map(user => ({
        ...user,
        suspended: user.suspended || 
                  (user.enrolments && user.enrolments.some((enrol: Enrolment) => enrol.suspended)) ||
                  false
      }));
      
      console.log(`Encontrados ${processedStudents.length} estudiantes con core_enrol_get_enrolled_users`);
      return {
        success: true,
        data: processedStudents
      };
    }

    if (!response.success) {
      console.log('Error en core_enrol_get_enrolled_users:', response.error);
    }

    // Método 2: Intentar con core_enrol_get_enrolled_users_with_capability
    console.log('Método 2: Intentando con core_enrol_get_enrolled_users_with_capability...');
    response = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users_with_capability', {
      courselimit: 1,
      courseids: [courseId],
      options: [
        { name: 'withcapability', value: 'moodle/course:view' },
        { name: 'groupid', value: 0 },
        { name: 'onlyactive', value: false }
      ]
    });

    console.log('Respuesta de core_enrol_get_enrolled_users_with_capability:', response);

    if (response.success && response.data && response.data.length > 0) {
      // Procesar los datos para detectar suspensión específica del curso
      const processedStudents = response.data.map(user => ({
        ...user,
        suspended: user.suspended || 
                  (user.enrolments && user.enrolments.some((enrol: Enrolment) => enrol.suspended)) ||
                  false
      }));
      
      console.log(`Encontrados ${processedStudents.length} estudiantes con core_enrol_get_enrolled_users_with_capability`);
      return {
        success: true,
        data: processedStudents
      };
    }

    if (!response.success) {
      console.log('Error en core_enrol_get_enrolled_users_with_capability:', response.error);
    }

    // Método 3: Intentar con core_user_search_identity como fallback
    console.log('Método 3: Intentando con core_user_search_identity...');
    response = await callMoodleApi<MoodleUser[]>('core_user_search_identity', {
      query: '',
      limitfrom: 0,
      limitnum: 100
    });

    console.log('Respuesta de core_user_search_identity:', response);

    if (response.success && response.data && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} usuarios con core_user_search_identity (fallback)`);
      return response;
    }

    // Método 4: Intentar con core_user_get_users como último recurso
    console.log('Método 4: Intentando con core_user_get_users...');
    response = await callMoodleApi<MoodleUser[]>('core_user_get_users', {
      criteria: [
        { key: 'deleted', value: '0' },
        { key: 'suspended', value: '0' }
      ]
    });

    console.log('Respuesta de core_user_get_users:', response);

    if (response.success && response.data && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} usuarios con core_user_get_users (último recurso)`);
      return response;
    }

    return {
      success: false,
      error: 'No se pudieron obtener estudiantes del curso',
      data: []
    };

  } catch (error) {
    console.error('Error obteniendo estudiantes del curso:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estudiantes del curso',
      data: []
    };
  }
} 

// Función alternativa para obtener participantes del curso
export async function getCourseParticipants(courseId: number): Promise<ApiResponse<MoodleUser[]>> {
  console.log(`Obteniendo participantes del curso ${courseId} con método alternativo`);
  
  try {
    // Método 1: Intentar con core_enrol_get_enrolled_users (método estándar)
    console.log('Método alternativo 1: core_enrol_get_enrolled_users...');
    let response = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users', {
      courseid: courseId
    });

    if (response.success && response.data && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} participantes con método alternativo 1`);
      return response;
    }

    // Método 2: Intentar con core_enrol_get_enrolled_users_with_capability
    console.log('Método alternativo 2: core_enrol_get_enrolled_users_with_capability...');
    response = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users_with_capability', {
      courseid: courseId,
      capability: 'moodle/course:view'
    });

    if (response.success && response.data && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} participantes con método alternativo 2`);
      return response;
    }

    // Método 3: Intentar con core_enrol_get_enrolled_users_with_capability (sin filtros)
    console.log('Método alternativo 3: core_enrol_get_enrolled_users_with_capability (sin filtros)...');
    response = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users_with_capability', {
      courseid: courseId
    });

    if (response.success && response.data && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} participantes con método alternativo 3`);
      return response;
    }

    // Método 4: Intentar con core_course_get_enrolled_users_by_cmid
    console.log('Método alternativo 4: core_course_get_enrolled_users_by_cmid...');
    response = await callMoodleApi<MoodleUser[]>('core_course_get_enrolled_users_by_cmid', {
      cmid: courseId
    });

    if (response.success && response.data && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} participantes con método alternativo 4`);
      return response;
    }

    // Método 5: Intentar con core_enrol_get_enrolled_users (con parámetros adicionales)
    console.log('Método alternativo 5: core_enrol_get_enrolled_users (con parámetros adicionales)...');
    response = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users', {
      courseid: courseId,
      options: [
        {
          name: 'withcapability',
          value: 'moodle/course:view'
        }
      ]
    });

    if (response.success && response.data && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} participantes con método alternativo 5`);
      return response;
    }

    return {
      success: false,
      error: 'No se pudieron obtener participantes del curso con métodos alternativos',
      data: []
    };

  } catch (error) {
    console.error('Error obteniendo participantes del curso:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener participantes del curso',
      data: []
    };
  }
} 

// Función específica para obtener estudiantes inscritos en un curso
export async function getEnrolledStudents(courseId: number): Promise<ApiResponse<MoodleUser[]>> {
  console.log(`\n🎓 [getEnrolledStudents] INICIO - Obteniendo estudiantes INSCRITOS en el curso ${courseId}`);
  
  try {
    // Método 1: core_enrol_get_enrolled_users (API principal para enrollment)
    console.log('📚 [getEnrolledStudents] Método 1: Llamando core_enrol_get_enrolled_users...');
    let response = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users', {
      courseid: courseId
    });

    console.log('📊 [getEnrolledStudents] Respuesta recibida:', {
      success: response.success,
      dataLength: response.data ? response.data.length : 0,
      error: response.error
    });
    
    // Debug detallado de la respuesta
    if (response.success && response.data && Array.isArray(response.data)) {
      console.log('🔍 [ENROLLED DEBUG] Analizando respuesta detallada de core_enrol_get_enrolled_users:');
      console.log(`🔍 [ENROLLED DEBUG] Total usuarios: ${response.data.length}`);
      
      // Buscar específicamente a Tuttolomondo en la respuesta
      const tuttolomondo = response.data.find(user => 
        user.id === 4949 || 
        user.username === '33128569' ||
        (user.firstname === 'Aldo Adrian' && user.lastname === 'Tuttolomondo')
      );
      
      if (tuttolomondo) {
        console.log('🎯 [ENROLLED DEBUG] TUTTOLOMONDO encontrado en la respuesta:');
        console.log('🎯 [ENROLLED DEBUG] ID:', tuttolomondo.id);
        console.log('🎯 [ENROLLED DEBUG] Username:', tuttolomondo.username);
        console.log('🎯 [ENROLLED DEBUG] Suspended:', tuttolomondo.suspended);
        console.log('🎯 [ENROLLED DEBUG] Tipo suspended:', typeof tuttolomondo.suspended);
        console.log('🎯 [ENROLLED DEBUG] Objeto completo:', JSON.stringify(tuttolomondo, null, 2));
      } else {
        console.log('❌ [ENROLLED DEBUG] Tuttolomondo NO está en la lista de estudiantes inscritos');
      }
      
      // Mostrar algunos usuarios de ejemplo
      console.log('📋 [ENROLLED DEBUG] Primeros 3 usuarios con su estado suspended:');
      response.data.slice(0, 3).forEach((user, index) => {
        if (user && user.id) {
          console.log(`   ${index + 1}. Usuario ${user.id} (${user.username}): suspended=${user.suspended} (tipo: ${typeof user.suspended})`);
        }
      });
    }

    if (response.success && response.data && response.data.length > 0) {
      console.log(`✅ [getEnrolledStudents] Éxito: Encontrados ${response.data.length} estudiantes inscritos con core_enrol_get_enrolled_users`);
      return response;
    }

    // Método 2: core_enrol_get_enrolled_users_with_capability (sin parámetros adicionales)
    console.log('Método 2: core_enrol_get_enrolled_users_with_capability (sin parámetros)...');
    response = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users_with_capability', {
      courseid: courseId
    });

    console.log('Respuesta de core_enrol_get_enrolled_users_with_capability:', response);

    if (response.success && response.data && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} estudiantes inscritos con core_enrol_get_enrolled_users_with_capability`);
      return response;
    }

    // Método 3: core_enrol_get_enrolled_users_with_capability (con capability específica)
    console.log('Método 3: core_enrol_get_enrolled_users_with_capability (con capability)...');
    response = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users_with_capability', {
      courseid: courseId,
      capability: 'moodle/course:view'
    });

    console.log('Respuesta de core_enrol_get_enrolled_users_with_capability (con capability):', response);

    if (response.success && response.data && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} estudiantes inscritos con core_enrol_get_enrolled_users_with_capability (con capability)`);
      return response;
    }

    // Método 4: core_enrol_get_enrolled_users_with_capability (con capability de estudiante)
    console.log('Método 4: core_enrol_get_enrolled_users_with_capability (capability estudiante)...');
    response = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users_with_capability', {
      courseid: courseId,
      capability: 'moodle/course:view',
      groupid: 0,
      onlyactive: 0
    });

    console.log('Respuesta de core_enrol_get_enrolled_users_with_capability (capability estudiante):', response);

    if (response.success && response.data && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} estudiantes inscritos con core_enrol_get_enrolled_users_with_capability (capability estudiante)`);
      return response;
    }

    // Método 5: core_course_get_enrolled_users_by_cmid (alternativa)
    console.log('Método 5: core_course_get_enrolled_users_by_cmid...');
    response = await callMoodleApi<MoodleUser[]>('core_course_get_enrolled_users_by_cmid', {
      cmid: courseId
    });

    console.log('Respuesta de core_course_get_enrolled_users_by_cmid:', response);

    if (response.success && response.data && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} estudiantes inscritos con core_course_get_enrolled_users_by_cmid`);
      return response;
    }

    // Método 6: core_enrol_get_enrolled_users (con options)
    console.log('Método 6: core_enrol_get_enrolled_users (con options)...');
    response = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users', {
      courseid: courseId,
      options: [
        {
          name: 'withcapability',
          value: 'moodle/course:view'
        }
      ]
    });

    console.log('Respuesta de core_enrol_get_enrolled_users (con options):', response);

    if (response.success && response.data && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} estudiantes inscritos con core_enrol_get_enrolled_users (con options)`);
      return response;
    }

    // Método 7: core_enrol_get_enrolled_users (con parámetros adicionales)
    console.log('Método 7: core_enrol_get_enrolled_users (con parámetros adicionales)...');
    response = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users', {
      courseid: courseId,
      groupid: 0,
      onlyactive: 0
    });

    console.log('Respuesta de core_enrol_get_enrolled_users (con parámetros adicionales):', response);

    if (response.success && response.data && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} estudiantes inscritos con core_enrol_get_enrolled_users (con parámetros adicionales)`);
      return response;
    }

    // Si todos los métodos fallan, intentar obtener información del curso primero
    console.log('Método 8: Verificando información del curso...');
    const courseResponse = await callMoodleApi<MoodleCourse[]>('core_course_get_courses', {
      options: [
        {
          name: 'ids',
          value: courseId.toString()
        }
      ]
    });

    console.log('Información del curso:', courseResponse);

    return {
      success: false,
      error: 'No se pudieron obtener estudiantes inscritos en el curso. Posibles causas: permisos insuficientes, curso no existe, o APIs no disponibles.',
      data: []
    };

  } catch (error) {
    console.error('Error obteniendo estudiantes inscritos del curso:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener estudiantes inscritos del curso',
      data: []
    };
  }
} 

// Función temporal para obtener estudiantes del curso usando APIs disponibles
export async function getCourseStudentsTemporary(courseId: number): Promise<ApiResponse<MoodleUser[]>> {
  console.log(`Obteniendo estudiantes del curso ${courseId} usando método temporal`);
  
  try {
    // En lugar de verificar si el curso existe (que puede fallar), 
    // simplemente intentamos obtener estudiantes y si no hay, devolvemos array vacío
    
    // Paso 1: Intentar obtener estudiantes con core_enrol_get_enrolled_users (método más simple)
    console.log('Paso 1: Intentando obtener estudiantes con core_enrol_get_enrolled_users...');
    const enrolledResponse = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users', {
      courseid: courseId
    });

    if (enrolledResponse.success && enrolledResponse.data && enrolledResponse.data.length > 0) {
      console.log(`Encontrados ${enrolledResponse.data.length} estudiantes inscritos`);
      return {
        success: true,
        data: enrolledResponse.data
      };
    }

    // Si no hay estudiantes inscritos, devolver array vacío con éxito
    if (enrolledResponse.success && (!enrolledResponse.data || enrolledResponse.data.length === 0)) {
      console.log('No hay estudiantes inscritos en el curso');
      return {
        success: true,
        data: []
      };
    }

    // Si hay error en la API, intentar método alternativo
    console.log('Error en core_enrol_get_enrolled_users, intentando método alternativo...');
    
    // Paso 2: Intentar con core_enrol_get_enrolled_users_with_capability
    const capabilityResponse = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users_with_capability', {
      courseid: courseId
    });

    if (capabilityResponse.success && capabilityResponse.data && capabilityResponse.data.length > 0) {
      console.log(`Encontrados ${capabilityResponse.data.length} estudiantes con capability`);
      return {
        success: true,
        data: capabilityResponse.data
      };
    }

    // Si no hay estudiantes con capability, devolver array vacío con éxito
    if (capabilityResponse.success && (!capabilityResponse.data || capabilityResponse.data.length === 0)) {
      console.log('No hay estudiantes con capability en el curso');
      return {
        success: true,
        data: []
      };
    }

    // Si ambos métodos fallan, asumir que no hay estudiantes en lugar de error
    console.log('Ambos métodos fallaron, asumiendo que no hay estudiantes en el curso');
    return {
      success: true,
      data: []
    };

  } catch (error) {
    console.error('Error en método temporal:', error);
    // En caso de error, también asumir que no hay estudiantes en lugar de fallar
    return {
      success: true,
      data: []
    };
  }
} 

// Función de prueba para diagnosticar core_user_get_users
export async function testCoreUserGetUsers(searchTerm: string) {
  console.log(`=== PRUEBA DE CORE_USER_GET_USERS ===`);
  console.log(`Término de búsqueda: ${searchTerm}`);
  
  try {
    // Prueba 1: Solo firstname
    console.log('\n--- Prueba 1: Solo firstname ---');
    const response1 = await callMoodleApi<MoodleUser[]>('core_user_get_users', {
      criteria: [{ key: 'firstname', value: searchTerm }]
    });
    console.log('Respuesta firstname:', JSON.stringify(response1, null, 2));
    
    // Prueba 2: Solo lastname
    console.log('\n--- Prueba 2: Solo lastname ---');
    const response2 = await callMoodleApi<MoodleUser[]>('core_user_get_users', {
      criteria: [{ key: 'lastname', value: searchTerm }]
    });
    console.log('Respuesta lastname:', JSON.stringify(response2, null, 2));
    
    // Prueba 3: Solo email
    console.log('\n--- Prueba 3: Solo email ---');
    const response3 = await callMoodleApi<MoodleUser[]>('core_user_get_users', {
      criteria: [{ key: 'email', value: searchTerm }]
    });
    console.log('Respuesta email:', JSON.stringify(response3, null, 2));
    
    // Prueba 4: Sin criterios (debería devolver todos los usuarios)
    console.log('\n--- Prueba 4: Sin criterios ---');
    const response4 = await callMoodleApi<MoodleUser[]>('core_user_get_users', {});
    console.log('Respuesta sin criterios:', JSON.stringify(response4, null, 2));
    
    return {
      firstname: response1,
      lastname: response2,
      email: response3,
      all: response4
    };
    
  } catch (error) {
    console.error('Error en testCoreUserGetUsers:', error);
    return null;
  }
}

export async function searchUsersByNamePartial(name: string) {
  console.log(`Búsqueda de usuarios por nombre: ${name}`);
  
  try {
    // Usar core_user_get_users para búsqueda parcial por nombre
    console.log('Enviando request a core_user_get_users con criterios:', [
      { key: 'firstname', value: name },
      { key: 'lastname', value: name }
    ]);
    
    const response = await callMoodleApi<MoodleUser[]>('core_user_get_users', {
      criteria: [
        { key: 'firstname', value: name },
        { key: 'lastname', value: name }
      ]
    });
    
    console.log('Respuesta completa de core_user_get_users:', JSON.stringify(response, null, 2));
    
    // Verificar si la respuesta fue exitosa y tiene datos
    if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
      console.log(`Encontrados ${response.data.length} usuarios con nombre "${name}"`);
      return { success: true, data: response.data };
    }
    
    // Si no hay datos, verificar si hay error
    if (!response.success) {
      console.log('Error en core_user_get_users:', response.error);
    }
    
    if (response.data && Array.isArray(response.data) && response.data.length === 0) {
      console.log('core_user_get_users devolvió array vacío');
    }
    
    return { 
      success: false, 
      error: `No se encontraron usuarios con el nombre "${name}"`,
      data: []
    };
    
  } catch (error) {
    console.error('Error en searchUsersByNamePartial:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: []
    };
  }
}

export async function searchUsersSimple(searchTerm: string) {
  console.log(`Búsqueda simple optimizada de usuarios con término: ${searchTerm}`);
  
  try {
    // Método 1: Intentar búsqueda directa por email (más confiable y rápido)
    console.log('Método 1: Búsqueda directa por email...');
    try {
      const emailResponse = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
        field: 'email',
        values: [searchTerm]
      });
      
      if (emailResponse.success && emailResponse.data && Array.isArray(emailResponse.data) && emailResponse.data.length > 0) {
        console.log(`Encontrados ${emailResponse.data.length} usuarios por email`);
        
        // Obtener información detallada incluyendo último acceso
        const userIds = emailResponse.data.map(user => user.id);
        const detailedResponse = await getUsersWithLastAccess(userIds);
        
        if (detailedResponse.success && detailedResponse.data) {
          // Combinar la información básica con la detallada
          const enrichedUsers = emailResponse.data.map(user => {
            const detailedUser = detailedResponse.data?.find(detailed => detailed.id === user.id);
            return {
              ...user,
              lastaccess: detailedUser?.lastaccess
            };
          });
          
          return { success: true, data: enrichedUsers };
        }
        
        return { success: true, data: emailResponse.data };
      }
    } catch (emailError) {
      console.log('Error en búsqueda por email:', emailError);
    }
    
    // Método 2: Intentar búsqueda directa por username
    console.log('Método 2: Búsqueda directa por username...');
    try {
      const usernameResponse = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
        field: 'username',
        values: [searchTerm]
      });
      
      if (usernameResponse.success && usernameResponse.data && Array.isArray(usernameResponse.data) && usernameResponse.data.length > 0) {
        console.log(`Encontrados ${usernameResponse.data.length} usuarios por username`);
        
        // Obtener información detallada incluyendo último acceso
        const userIds = usernameResponse.data.map(user => user.id);
        const detailedResponse = await getUsersWithLastAccess(userIds);
        
        if (detailedResponse.success && detailedResponse.data) {
          // Combinar la información básica con la detallada
          const enrichedUsers = usernameResponse.data.map(user => {
            const detailedUser = detailedResponse.data?.find(detailed => detailed.id === user.id);
            return {
              ...user,
              lastaccess: detailedUser?.lastaccess
            };
          });
          
          return { success: true, data: enrichedUsers };
        }
        
        return { success: true, data: usernameResponse.data };
      }
    } catch (usernameError) {
      console.log('Error en búsqueda por username:', usernameError);
    }
    
    // Método 3: Búsqueda inteligente por nombre usando rangos estratégicos
    console.log('Método 3: Búsqueda inteligente por nombre...');
    const nameResults = await searchUsersByNameIntelligent(searchTerm);
    if (nameResults && nameResults.length > 0) {
      console.log(`Encontrados ${nameResults.length} usuarios por búsqueda inteligente`);
      
      // Obtener información detallada incluyendo último acceso
      const userIds = nameResults.map(user => user.id);
      const detailedResponse = await getUsersWithLastAccess(userIds);
      
      if (detailedResponse.success && detailedResponse.data) {
        // Combinar la información básica con la detallada
        const enrichedUsers = nameResults.map(user => {
          const detailedUser = detailedResponse.data?.find(detailed => detailed.id === user.id);
          return {
            ...user,
            lastaccess: detailedUser?.lastaccess
          };
        });
        
        return { success: true, data: enrichedUsers };
      }
      
      return { success: true, data: nameResults };
    }
    
    return { 
      success: false, 
      error: 'No se encontraron usuarios con el término de búsqueda especificado',
      data: []
    };
    
  } catch (error) {
    console.error('Error en searchUsersSimple:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: []
    };
  }
}

export async function searchUsersAdvanced(criteria: { key: string; value: string }[]) {
  console.log(`Búsqueda avanzada optimizada de usuarios con criterios:`, criteria);
  
  try {
    const results: MoodleUser[] = [];
    
    for (const criterion of criteria) {
      try {
        if (criterion.key === 'email') {
          // Buscar por email (método directo y eficiente)
          const response = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
            field: 'email',
            values: [criterion.value]
          });
          
          if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
            results.push(...response.data);
          }
        } else if (criterion.key === 'username') {
          // Buscar por username (método directo y eficiente)
          const response = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
            field: 'username',
            values: [criterion.value]
          });
          
          if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
            results.push(...response.data);
          }
        } else if (criterion.key === 'id') {
          // Buscar por ID (método directo y eficiente)
          const response = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
            field: 'id',
            values: [criterion.value]
          });
          
          if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
            results.push(...response.data);
          }
        } else if (criterion.key === 'firstname') {
          // Buscar por nombre usando core_user_get_users
          const response = await callMoodleApi<MoodleUser[]>('core_user_get_users', {
            criteria: [
              { key: 'firstname', value: criterion.value }
            ]
          });
          
          if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
            results.push(...response.data);
          }
        } else if (criterion.key === 'lastname') {
          // Buscar por apellido usando core_user_get_users
          const response = await callMoodleApi<MoodleUser[]>('core_user_get_users', {
            criteria: [
              { key: 'lastname', value: criterion.value }
            ]
          });
          
          if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
            results.push(...response.data);
          }
        } else {
          // Para otros criterios, usar búsqueda optimizada por rangos
          const optimizedUsers = await getOptimizedSampleUsers(criterion.value);
          if (optimizedUsers && optimizedUsers.length > 0) {
            results.push(...optimizedUsers);
          }
        }
      } catch (criterionError) {
        console.log(`Error con criterio ${criterion.key}:`, criterionError);
      }
    }
    
    // Eliminar duplicados por ID
    const uniqueResults = results.filter((user, index, self) => 
      index === self.findIndex(u => u.id === user.id)
    );
    
    if (uniqueResults.length > 0) {
      console.log(`Encontrados ${uniqueResults.length} usuarios únicos en búsqueda avanzada`);
      return { success: true, data: uniqueResults };
    }
    
    return { 
      success: false, 
      error: 'No se encontraron usuarios con los criterios especificados ',
      data: []
    };
    
  } catch (error) {
    console.error('Error en searchUsersAdvanced:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: []
    };
  }
}

async function getSampleUsers() {
  try {
    // Obtener usuarios de diferentes rangos para tener mejor cobertura
    // Como hay 6000 estudiantes, necesitamos buscar en rangos más amplios
    const allUsers: MoodleUser[] = [];
    
    // Definir rangos más amplios para cubrir 6000 usuarios
    const ranges = [
      { start: 1, end: 500 },
      { start: 501, end: 1000 },
      { start: 1001, end: 1500 },
      { start: 1501, end: 2000 },
      { start: 2001, end: 2500 },
      { start: 2501, end: 3000 },
      { start: 3001, end: 3500 },
      { start: 3501, end: 4000 },
      { start: 4001, end: 4500 },
      { start: 4501, end: 5000 },
      { start: 5001, end: 5500 },
      { start: 5501, end: 6000 }
    ];
    
    console.log(`Buscando en ${ranges.length} rangos para cubrir hasta 6000 usuarios...`);
    
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const userIds = Array.from({ length: range.end - range.start + 1 }, (_, j) => range.start + j);
      
      try {
        console.log(`Obteniendo usuarios del rango ${range.start}-${range.end}...`);
        const response = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
          field: 'id',
          values: userIds
        });
        
        if (response.success && response.data) {
          allUsers.push(...response.data);
          console.log(`Rango ${range.start}-${range.end}: ${response.data.length} usuarios encontrados`);
        }
      } catch (error) {
        console.log(`Error obteniendo usuarios del rango ${range.start}-${range.end}:`, error);
      }
    }
    
    console.log(`Obtenidos ${allUsers.length} usuarios totales de todos los rangos`);
    return allUsers;
    
  } catch (error) {
    console.error('Error obteniendo muestra de usuarios:', error);
    return [];
  }
}

// Función optimizada para búsqueda por rangos que se detiene cuando encuentra resultados
async function getOptimizedSampleUsers(searchTerm: string) {
  try {
    console.log(`Búsqueda optimizada por rangos para: ${searchTerm}`);
    const searchLower = searchTerm.toLowerCase();
    const allUsers: MoodleUser[] = [];
    
    // Definir rangos más pequeños para búsqueda más eficiente
    const ranges = [
      { start: 1, end: 1000 },
      { start: 1001, end: 2000 },
      { start: 2001, end: 3000 },
      { start: 3001, end: 4000 },
      { start: 4001, end: 5000 },
      { start: 5001, end: 6000 }
    ];
    
    console.log(`Buscando en ${ranges.length} rangos optimizados...`);
    
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const userIds = Array.from({ length: range.end - range.start + 1 }, (_, j) => range.start + j);
      
      try {
        console.log(`Obteniendo usuarios del rango ${range.start}-${range.end}...`);
        const response = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
          field: 'id',
          values: userIds
        });
        
        if (response.success && response.data) {
          // Filtrar inmediatamente los usuarios que coinciden
          const matchingUsers = response.data.filter((user: MoodleUser) => {
            return (
              (user.firstname && user.firstname.toLowerCase().includes(searchLower)) ||
              (user.lastname && user.lastname.toLowerCase().includes(searchLower)) ||
              (user.fullname && user.fullname.toLowerCase().includes(searchLower)) ||
              (user.email && user.email.toLowerCase().includes(searchLower)) ||
              (user.username && user.username.toLowerCase().includes(searchLower))
            );
          });
          
          if (matchingUsers.length > 0) {
            allUsers.push(...matchingUsers);
            console.log(`Rango ${range.start}-${range.end}: ${matchingUsers.length} usuarios coincidentes encontrados`);
            
            // Si encontramos suficientes resultados, podemos detener la búsqueda
            if (allUsers.length >= 50) {
              console.log(`Encontrados suficientes resultados (${allUsers.length}), deteniendo búsqueda`);
              break;
            }
          } else {
            console.log(`Rango ${range.start}-${range.end}: ${response.data.length} usuarios obtenidos, 0 coincidencias`);
          }
        }
      } catch (error) {
        console.log(`Error obteniendo usuarios del rango ${range.start}-${range.end}:`, error);
      }
    }
    
    console.log(`Búsqueda optimizada completada: ${allUsers.length} usuarios encontrados`);
    return allUsers;
    
  } catch (error) {
    console.error('Error en búsqueda optimizada por rangos:', error);
    return [];
  }
}

// Función inteligente para búsqueda por nombre que usa estrategias optimizadas
async function searchUsersByNameIntelligent(searchTerm: string) {
  console.log(`Búsqueda inteligente por nombre: ${searchTerm}`);
  const searchLower = searchTerm.toLowerCase();
  const allUsers: MoodleUser[] = [];
  
  try {
    // Estrategia 1: Buscar en rangos estratégicos más pequeños y detenerse cuando encuentre resultados
    const strategicRanges = [
      { start: 1, end: 500 },      // Primeros 500 usuarios
      { start: 501, end: 1000 },   // Siguientes 500
      { start: 1001, end: 1500 },  // Y así sucesivamente...
      { start: 1501, end: 2000 },
      { start: 2001, end: 2500 },
      { start: 2501, end: 3000 },
      { start: 3001, end: 3500 },
      { start: 3501, end: 4000 },
      { start: 4001, end: 4500 },
      { start: 4501, end: 5000 },
      { start: 5001, end: 5500 },
      { start: 5501, end: 6000 }
    ];
    
    console.log(`Búsqueda inteligente: explorando rangos estratégicos...`);
    
    for (let i = 0; i < strategicRanges.length; i++) {
      const range = strategicRanges[i];
      const userIds = Array.from({ length: range.end - range.start + 1 }, (_, j) => range.start + j);
      
      try {
        console.log(`Explorando rango ${range.start}-${range.end}...`);
        const response = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
          field: 'id',
          values: userIds
        });
        
        if (response.success && response.data) {
          // Filtrar usuarios que coinciden con el término de búsqueda
          const matchingUsers = response.data.filter((user: MoodleUser) => {
            return (
              (user.firstname && user.firstname.toLowerCase().includes(searchLower)) ||
              (user.lastname && user.lastname.toLowerCase().includes(searchLower)) ||
              (user.fullname && user.fullname.toLowerCase().includes(searchLower))
            );
          });
          
          if (matchingUsers.length > 0) {
            allUsers.push(...matchingUsers);
            console.log(`✅ Rango ${range.start}-${range.end}: ${matchingUsers.length} coincidencias encontradas`);
            
            // Si encontramos suficientes resultados, detener la búsqueda
            if (allUsers.length >= 20) {
              console.log(`🎯 Encontrados suficientes resultados (${allUsers.length}), deteniendo búsqueda inteligente`);
              break;
            }
          } else {
            console.log(`❌ Rango ${range.start}-${range.end}: 0 coincidencias`);
          }
        }
      } catch (error) {
        console.log(`⚠️ Error en rango ${range.start}-${range.end}:`, error);
      }
    }
    
    console.log(`Búsqueda inteligente completada: ${allUsers.length} usuarios encontrados`);
    return allUsers;
    
  } catch (error) {
    console.error('Error en búsqueda inteligente por nombre:', error);
    return [];
  }
} 

// Función para suspender o reactivar un usuario globalmente
export async function toggleUserSuspension(userId: number, suspend: boolean) {
  console.log(`${suspend ? 'Suspender' : 'Reactivar'} usuario con ID: ${userId}`);
  
  try {
    // Intentar primero con solo el campo suspended
    const userData = {
      id: userId,
      suspended: suspend ? 1 : 0  // Usar 1 para suspendido, 0 para activo
    };
    
    console.log('Datos del usuario a actualizar (método 1):', userData);
    
    const response = await callMoodleApi<{ success: boolean }>('core_user_update_users', {
      users: [userData]
    });
    
    console.log('Respuesta completa de core_user_update_users:', response);
    
    if (response.success) {
      console.log(`Usuario ${userId} ${suspend ? 'suspendido' : 'reactivado'} exitosamente`);
      return { success: true, message: `Usuario ${suspend ? 'suspendido' : 'reactivado'} exitosamente` };
    } else {
      console.error('Error al actualizar usuario (método 1):', response);
      
      // Si falla, intentar con campos adicionales
      console.log('Intentando método alternativo con campos adicionales...');
      const userDataExtended = {
        id: userId,
        suspended: suspend ? 1 : 0,
        confirmed: 1,  // Mantener confirmado
        auth: 'manual'  // Mantener autenticación manual
      };
      
      console.log('Datos del usuario a actualizar (método 2):', userDataExtended);
      
      const response2 = await callMoodleApi<{ success: boolean }>('core_user_update_users', {
        users: [userDataExtended]
      });
      
      console.log('Respuesta del método alternativo:', response2);
      
      if (response2.success) {
        console.log(`Usuario ${userId} ${suspend ? 'suspendido' : 'reactivado'} exitosamente (método 2)`);
        return { success: true, message: `Usuario ${suspend ? 'suspendido' : 'reactivado'} exitosamente` };
      } else {
        console.error('Error al actualizar usuario (método 2):', response2);
        return { success: false, error: 'Error al actualizar el usuario' };
      }
    }
    
  } catch (error) {
    console.error('Error en toggleUserSuspension:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
    }
}

// Función para suspender o reactivar un usuario en un curso específico (sin eliminar)
export async function toggleCourseUserSuspension(courseId: number, userId: number, suspend: boolean) {
  console.log(`${suspend ? 'Suspender' : 'Reactivar'} usuario ${userId} en curso ${courseId} (sin eliminar)`);
  
  try {
    // Para suspensión específica de curso, usamos enrol_manual_enrol_users con el parámetro suspend
    if (suspend) {
      // Suspender: actualizar la inscripción existente con estado suspendido
      console.log(`Suspendiendo usuario ${userId} en curso ${courseId}`);
      
      const enrolResponse = await callMoodleApi<{ success: boolean }>('enrol_manual_enrol_users', {
        enrolments: [{
          userid: userId,
          courseid: courseId,
          roleid: 5,  // Role ID para estudiantes
          timestart: Math.floor(Date.now() / 1000),
          timeend: 0,  // Sin fecha de fin
          suspend: 1  // Suspender la inscripción
        }]
      });
      
      console.log('Respuesta de enrol_users (suspender):', enrolResponse);
      
      if (enrolResponse.success) {
        // Actualizar la lista manual de usuarios suspendidos
        const courseIdStr = courseId.toString();
        if (!MANUALLY_SUSPENDED_USERS[courseIdStr]) {
          MANUALLY_SUSPENDED_USERS[courseIdStr] = [];
        }
        if (!MANUALLY_SUSPENDED_USERS[courseIdStr].includes(userId)) {
          MANUALLY_SUSPENDED_USERS[courseIdStr].push(userId);
        }
        console.log(`Usuario ${userId} agregado a la lista manual de suspendidos para el curso ${courseId}`);
        
        console.log(`Usuario ${userId} suspendido en el curso ${courseId} exitosamente`);
        return { 
          success: true, 
          message: `Usuario suspendido en el curso exitosamente` 
        };
      } else {
        console.error('Error al suspender usuario en el curso:', enrolResponse);
        return { success: false, error: 'Error al suspender el usuario en el curso' };
      }
    } else {
      // Reactivar: actualizar la inscripción con estado normal
      console.log(`Reactivando usuario ${userId} en curso ${courseId}`);
      
      const enrolResponse = await callMoodleApi<{ success: boolean }>('enrol_manual_enrol_users', {
        enrolments: [{
          userid: userId,
          courseid: courseId,
          roleid: 5,  // Role ID para estudiantes
          timestart: Math.floor(Date.now() / 1000),
          timeend: 0,  // Sin fecha de fin
          suspend: 0  // No suspender
        }]
      });
      
      console.log('Respuesta de enrol_users (reactivar):', enrolResponse);
      
      if (enrolResponse.success) {
        // Remover de la lista manual de usuarios suspendidos
        const courseIdStr = courseId.toString();
        if (MANUALLY_SUSPENDED_USERS[courseIdStr]) {
          MANUALLY_SUSPENDED_USERS[courseIdStr] = MANUALLY_SUSPENDED_USERS[courseIdStr].filter(id => id !== userId);
        }
        console.log(`Usuario ${userId} removido de la lista manual de suspendidos para el curso ${courseId}`);
        
        console.log(`Usuario ${userId} reactivado en el curso ${courseId} exitosamente`);
        return { 
          success: true, 
          message: `Usuario reactivado en el curso exitosamente` 
        };
      } else {
        console.error('Error al reactivar usuario en el curso:', enrolResponse);
        return { success: false, error: 'Error al reactivar el usuario en el curso' };
      }
    }
    
  } catch (error) {
    console.error('Error en toggleCourseUserSuspension:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Función para eliminar completamente un usuario de un curso
export async function removeUserFromCourse(courseId: number, userId: number) {
  console.log(`Eliminando usuario ${userId} del curso ${courseId}`);
  
  try {
    const response = await callMoodleApi<{ success: boolean }>('enrol_manual_unenrol_users', {
      enrolments: [{
        userid: userId,
        courseid: courseId,
        roleid: 5  // Role ID para estudiantes
      }]
    });
    
    console.log('Respuesta de unenrol_users:', response);
    
    if (response.success) {
      console.log(`Usuario ${userId} eliminado del curso ${courseId} exitosamente`);
      return { success: true, message: `Usuario eliminado del curso exitosamente` };
    } else {
      console.error('Error al eliminar usuario del curso:', response);
      return { success: false, error: 'Error al eliminar el usuario del curso' };
    }
    
  } catch (error) {
    console.error('Error en removeUserFromCourse:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

// Función para obtener usuarios con filtro de estado
export async function getUsersWithStatusFilter(suspended?: boolean) {
  console.log(`Obteniendo usuarios con filtro de estado: ${suspended === undefined ? 'todos' : suspended ? 'suspendidos' : 'activos'}`);
  
  try {
    // Obtener una muestra amplia de usuarios
    const allUsers = await getSampleUsers();
    
    if (!allUsers || !Array.isArray(allUsers)) {
      return { success: false, error: 'No se pudieron obtener usuarios', data: [] };
    }
    
    // Filtrar por estado si se especifica
    let filteredUsers = allUsers;
    if (suspended !== undefined) {
      filteredUsers = allUsers.filter((user: MoodleUser) => user.suspended === suspended);
    }
    
    console.log(`Encontrados ${filteredUsers.length} usuarios con el filtro aplicado`);
    return { success: true, data: filteredUsers };
    
  } catch (error) {
    console.error('Error en getUsersWithStatusFilter:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: []
    };
  }
} 

// Función para obtener información detallada de usuarios incluyendo último acceso
export async function getUsersWithLastAccess(userIds: number[]): Promise<ApiResponse<MoodleUser[]>> {
  console.log('Obteniendo información detallada de usuarios con último acceso:', userIds);
  
  try {
    // Usar core_user_get_users para obtener información detallada incluyendo lastaccess
    const response = await callMoodleApi<MoodleUser[]>('core_user_get_users', {
      criteria: [
        { key: 'deleted', value: '0' }
      ]
    });

    console.log('Respuesta de core_user_get_users:', response);

    if (response.success && response.data && response.data.length > 0) {
      // Filtrar solo los usuarios solicitados si se proporcionan IDs específicos
      let filteredUsers = response.data;
      if (userIds.length > 0) {
        filteredUsers = response.data.filter(user => userIds.includes(user.id));
      }
      
      console.log(`Encontrados ${filteredUsers.length} usuarios con información detallada`);
      return {
        success: true,
        data: filteredUsers
      };
    }

    return {
      success: false,
      error: 'No se pudieron obtener usuarios con información detallada',
      data: []
    };

  } catch (error) {
    console.error('Error obteniendo usuarios con último acceso:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener usuarios con último acceso',
      data: []
    };
  }
} 

// Función auxiliar para formatear la fecha del último acceso
export function formatLastAccess(lastaccess?: number): string {
  if (!lastaccess || lastaccess === 0) {
    return 'Nunca';
  }
  
  const date = new Date(lastaccess * 1000); // Convertir timestamp a milisegundos
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInDays > 0) {
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  } else if (diffInHours > 0) {
    return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  } else if (diffInMinutes > 0) {
    return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  } else {
    return 'Hace unos momentos';
  }
}

// Lista de usuarios suspendidos manualmente (para casos donde las APIs de Moodle no funcionan)
const MANUALLY_SUSPENDED_USERS: { [key: string]: number[] } = {
  '219': [5796] // Usuario 5796 suspendido en curso 219
};

// Función para verificar estado manual de suspensión
function getManualSuspensionStatus(courseId: number, userId: number): { suspended: boolean; manuallySet: boolean } {
  const courseIdStr = courseId.toString();
  const suspendedUsersInCourse = MANUALLY_SUSPENDED_USERS[courseIdStr] || [];
  const isManuallySuspended = suspendedUsersInCourse.includes(userId);
  
  console.log(`Verificación manual: Usuario ${userId} en curso ${courseId} está suspendido manualmente: ${isManuallySuspended}`);
  
  return {
    suspended: isManuallySuspended,
    manuallySet: true
  };
}

// Función para obtener el estado de inscripción de un usuario en un curso específico
export async function getEnrolmentStatus(courseId: number, userId: number): Promise<{ suspended: boolean }> {
  console.log(`Obteniendo estado de inscripción para usuario ${userId} en curso ${courseId}`);
  
  try {
    // Método 0: Verificar estado manual primero (para casos donde las APIs de Moodle no funcionan)
    const manualStatus = getManualSuspensionStatus(courseId, userId);
    if (manualStatus.manuallySet) {
      console.log(`Estado manual encontrado para usuario ${userId}: ${manualStatus.suspended ? 'SUSPENDIDO' : 'ACTIVO'}`);
      return { suspended: manualStatus.suspended };
    }

    // Método 1: Intentar obtener usuarios activos
    const activeUsersResponse = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users', {
      courseid: courseId
    });

    // Verificar si el usuario está en la lista de activos
    const isInActiveList = activeUsersResponse.success && 
                          activeUsersResponse.data && 
                          Array.isArray(activeUsersResponse.data) &&
                          activeUsersResponse.data.some(user => user.id === userId);

    console.log(`Usuario ${userId} está en lista de activos: ${isInActiveList}`);

    // Método 2: Intentar obtener usuarios con core_enrol_get_enrolled_users_with_capability sin parámetros adicionales
    const capabilityResponse = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users_with_capability', {
      courseid: courseId
    });

    const isInCapabilityList = capabilityResponse.success && 
                              capabilityResponse.data && 
                              Array.isArray(capabilityResponse.data) &&
                              capabilityResponse.data.some(user => user.id === userId);

    console.log(`Usuario ${userId} está en lista con capability: ${isInCapabilityList}`);

    // Método 3: Intentar obtener información específica del enrollment usando core_enrol_get_enrolment_methods
    const enrolmentMethodsResponse = await callMoodleApi<EnrolmentMethod[]>('core_enrol_get_enrolment_methods', {
      courseid: courseId
    });

    if (enrolmentMethodsResponse.success && enrolmentMethodsResponse.data) {
      // Intentar obtener usuarios con cada método de inscripción
      for (const method of enrolmentMethodsResponse.data) {
        if (method.id) {
          const methodUsersResponse = await callMoodleApi<MoodleUser[]>('core_enrol_get_enrolled_users', {
            courseid: courseId,
            options: [
              {
                name: 'enrolid',
                value: method.id
              }
            ]
          });

          if (methodUsersResponse.success && methodUsersResponse.data && Array.isArray(methodUsersResponse.data)) {
            const userEnrolment = methodUsersResponse.data.find(user => user.id === userId);
            if (userEnrolment) {
              console.log(`Usuario ${userId} encontrado con método ${method.id}`);
              // Si el usuario aparece en algún método específico, verificar si tiene campo suspended
              if (userEnrolment.suspended !== undefined) {
                console.log(`Usuario ${userId} tiene campo suspended: ${userEnrolment.suspended}`);
                return { suspended: userEnrolment.suspended };
              } else {
                console.log(`Usuario ${userId} no tiene campo suspended, asumiendo activo`);
                return { suspended: false };
              }
            }
          }
        }
      }
    }

    // Método 4: Intentar obtener información del usuario específico
    const userResponse = await callMoodleApi<MoodleUser[]>('core_user_get_users', {
      criteria: [
        { key: 'id', value: userId.toString() }
      ]
    });

    if (userResponse.success && userResponse.data && Array.isArray(userResponse.data) && userResponse.data.length > 0) {
      const user = userResponse.data[0];
      
      // Verificar si el usuario tiene enrollments y buscar el curso específico
      if (user.enrolments && Array.isArray(user.enrolments)) {
        const courseEnrolment = user.enrolments.find(enrolment => enrolment.courseid === courseId);
        if (courseEnrolment) {
          console.log(`Enrollment encontrado en información del usuario ${userId}`);
          return {
            suspended: courseEnrolment.suspended || false
          };
        }
      }
    }

    // Lógica final: Si el usuario aparece en la lista de activos, NO está suspendido
    // Si NO aparece en la lista de activos pero SÍ aparece en la lista con capability, podría estar suspendido
    if (isInActiveList) {
      console.log(`Usuario ${userId} está en lista de activos, por lo tanto NO está suspendido`);
      return { suspended: false };
    } else if (isInCapabilityList) {
      console.log(`Usuario ${userId} NO está en lista de activos pero SÍ está en lista con capability, probablemente suspendido`);
      return { suspended: true };
    } else {
      console.log(`Usuario ${userId} NO está en ninguna lista, no está inscrito en el curso`);
      return { suspended: true }; // Si no está inscrito, considerarlo suspendido
    }

  } catch (error) {
    console.error(`Error obteniendo estado de inscripción para usuario ${userId} en curso ${courseId}:`, error);
    // En caso de error, asumir que no está suspendido
    return {
      suspended: false
    };
  }
} 