import { MoodleCourse, MoodleUser, CreateUserRequest, EnrollUserRequest, ApiResponse } from '../types/moodle';

const MOODLE_API_URL = process.env.NEXT_PUBLIC_MOODLE_API_URL;
const MOODLE_TOKEN = process.env.NEXT_PUBLIC_MOODLE_TOKEN;

interface MoodleApiParams {
  [key: string]: string | number | boolean | Array<string | number | boolean> | Array<Record<string, string | number | boolean>>;
}

async function callMoodleApi<T>(wsfunction: string, params: MoodleApiParams = {}): Promise<ApiResponse<T>> {
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
    console.log('Moodle response:', data);

    // Verificar si la respuesta es null o undefined
    if (data === null || data === undefined) {
      console.log('Moodle returned null/undefined response - this might be normal for successful operations');
      // Para algunas operaciones como enrollments, una respuesta nula puede indicar éxito
      if (wsfunction === 'enrol_manual_enrol_users') {
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