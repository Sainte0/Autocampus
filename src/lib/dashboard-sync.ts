import connectDB from './mongodb';
import DashboardStatsModel, { IDashboardStats } from '../models/DashboardStats';
import { 
  getCourses, 
  getUsersWithStatusFilter, 
  getCourseStudents,
  getCourseStudentsSimple,
  callMoodleApi
} from './moodle';
import { MoodleUser, MoodleCourse } from '../types/moodle';

// Función principal para sincronizar todos los datos del dashboard
export async function syncDashboardData(): Promise<{ success: boolean; error?: string; stats?: IDashboardStats }> {
  try {
    await connectDB();
    

    
    // Actualizar estado a "en progreso"
    // eslint-disable-next-line prefer-const
    let dashboardStats = await DashboardStatsModel.findOne().sort({ createdAt: -1 });
    if (!dashboardStats) {
      dashboardStats = new DashboardStatsModel({
        syncStatus: 'in_progress',
        lastSync: new Date()
      });
    } else {
      dashboardStats.syncStatus = 'in_progress';
      dashboardStats.lastSync = new Date();
      dashboardStats.syncError = undefined;
    }
    await dashboardStats.save();
    
    // 1. Obtener usuarios suspendidos globalmente
    const globallySuspendedUsers = await getGloballySuspendedUsers();
    
    // 2. Obtener usuarios con múltiples cursos
    const usersWithMultipleCourses = await getUsersWithMultipleCourses();
    
    // 3. Obtener usuarios que nunca ingresaron
    const neverAccessedUsers = await getNeverAccessedUsers();
    
    // 4. Obtener usuarios suspendidos por curso
    const courseSuspendedUsers = await getCourseSuspendedUsers();
    
    // Actualizar el documento con los datos obtenidos
    dashboardStats.globallySuspendedUsers = globallySuspendedUsers;
    dashboardStats.usersWithMultipleCourses = usersWithMultipleCourses;
    dashboardStats.neverAccessedUsers = neverAccessedUsers;
    dashboardStats.courseSuspendedUsers = courseSuspendedUsers;
    dashboardStats.totalUsers = globallySuspendedUsers.length + usersWithMultipleCourses.length + neverAccessedUsers.length;
    dashboardStats.totalCourses = courseSuspendedUsers.length;
    dashboardStats.syncStatus = 'completed';
    dashboardStats.lastSync = new Date();
    
    await dashboardStats.save();
    
    return { success: true, stats: dashboardStats };
    
  } catch (error) {
    console.error('Error en sincronización del dashboard:', error);
    
    // Actualizar estado de error
    try {
      // eslint-disable-next-line prefer-const
      let dashboardStats = await DashboardStatsModel.findOne().sort({ createdAt: -1 });
      if (dashboardStats) {
        dashboardStats.syncStatus = 'error';
        dashboardStats.syncError = error instanceof Error ? error.message : 'Error desconocido';
        dashboardStats.lastSync = new Date();
        await dashboardStats.save();
      }
    } catch (updateError) {
      console.error('Error actualizando estado de error:', updateError);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido en sincronización' 
    };
  }
}

// Función optimizada para sincronización rápida
export async function syncDashboardDataOptimized(): Promise<{ success: boolean; error?: string; stats?: IDashboardStats }> {
  try {
    await connectDB();
    

    
    // Actualizar estado a "en progreso"
    // eslint-disable-next-line prefer-const
    let dashboardStats = await DashboardStatsModel.findOne().sort({ createdAt: -1 });
    if (!dashboardStats) {
      dashboardStats = new DashboardStatsModel({
        syncStatus: 'in_progress',
        lastSync: new Date()
      });
    } else {
      dashboardStats.syncStatus = 'in_progress';
      dashboardStats.lastSync = new Date();
      dashboardStats.syncError = undefined;
    }
    await dashboardStats.save();
    
    // Obtener todos los datos en paralelo usando operaciones optimizadas
    console.log('Obteniendo datos en paralelo...');
    
    const [
      globallySuspendedUsers,
      allUsersWithAccess,
      coursesWithStudents
    ] = await Promise.all([
      getGloballySuspendedUsersOptimized(),
      getAllUsersWithAccessOptimized(),
      getAllCoursesWithStudentsOptimized()
    ]);
    
    // Verificar que allUsersWithAccess sea un array antes de usar filter
    if (!Array.isArray(allUsersWithAccess)) {
      console.error('allUsersWithAccess no es un array');
      throw new Error('allUsersWithAccess no es un array');
    }
    
    // Procesar usuarios con múltiples cursos
    const usersWithMultipleCourses = processUsersWithMultipleCourses(coursesWithStudents);
    
    // Procesar usuarios que nunca ingresaron
    const neverAccessedUsers = allUsersWithAccess.filter(user => 
      !user.lastaccess || user.lastaccess === 0
    ).map(user => ({
      userId: user.id,
      username: user.username,
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email,
      createdAt: new Date(), // Usar fecha actual ya que timecreated no está disponible
      lastAccess: user.lastaccess
    }));
    
         // Procesar usuarios suspendidos por curso
     const courseSuspendedUsers = await processCourseSuspendedUsers();
    
    // Actualizar el documento con los datos obtenidos
    dashboardStats.globallySuspendedUsers = globallySuspendedUsers;
    dashboardStats.usersWithMultipleCourses = usersWithMultipleCourses;
    dashboardStats.neverAccessedUsers = neverAccessedUsers;
    dashboardStats.courseSuspendedUsers = courseSuspendedUsers;
    dashboardStats.totalUsers = allUsersWithAccess.length;
    dashboardStats.totalCourses = coursesWithStudents.length;
    dashboardStats.syncStatus = 'completed';
    dashboardStats.lastSync = new Date();
    
    await dashboardStats.save();
    
    return { success: true, stats: dashboardStats };
    
  } catch (error) {
    console.error('Error en sincronización optimizada del dashboard:', error);
    
    // Actualizar estado de error
    try {
      // eslint-disable-next-line prefer-const
      let dashboardStats = await DashboardStatsModel.findOne().sort({ createdAt: -1 });
      if (dashboardStats) {
        dashboardStats.syncStatus = 'error';
        dashboardStats.syncError = error instanceof Error ? error.message : 'Error desconocido';
        dashboardStats.lastSync = new Date();
        await dashboardStats.save();
      }
    } catch (updateError) {
      console.error('Error actualizando estado de error:', updateError);
    }
    
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido en sincronización' 
    };
  }
}

// Función para obtener usuarios suspendidos globalmente
async function getGloballySuspendedUsers(): Promise<IDashboardStats['globallySuspendedUsers']> {
  try {
    const response = await getUsersWithStatusFilter(true);
    
    if (!response.success || !response.data) {
      return [];
    }
    
    const suspendedUsers = response.data.filter(user => user.suspended);
    
    return suspendedUsers.map(user => ({
      userId: user.id,
      username: user.username,
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email,
      suspendedAt: new Date(), // Moodle no proporciona fecha de suspensión, usar fecha actual
      suspendedBy: undefined,
      reason: undefined
    }));
    
  } catch (error) {
    console.error('Error obteniendo usuarios suspendidos globalmente:', error);
    return [];
  }
}

// Función optimizada para obtener usuarios suspendidos globalmente
async function getGloballySuspendedUsersOptimized(): Promise<IDashboardStats['globallySuspendedUsers']> {
  try {
    // Obtener todos los usuarios primero
    const allUsers = await getAllUsersWithAccessOptimized();
    
    if (allUsers.length === 0) {
      return [];
    }
    
    // Filtrar solo los usuarios suspendidos
    const suspendedUsers = allUsers.filter(user => user.suspended === true);
    
    return suspendedUsers.map(user => ({
      userId: user.id,
      username: user.username,
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email,
      suspendedAt: new Date(),
      suspendedBy: undefined,
      reason: undefined
    }));
    
  } catch (error) {
    console.error('Error obteniendo usuarios suspendidos globalmente:', error);
    return [];
  }
}

// Función para obtener usuarios con múltiples cursos
async function getUsersWithMultipleCourses(): Promise<IDashboardStats['usersWithMultipleCourses']> {
  try {
    // Obtener todos los cursos
    const coursesResponse = await getCourses();
    if (!coursesResponse.success || !coursesResponse.data) {
      return [];
    }
    
    const courses = coursesResponse.data;
    const userCourseMap = new Map<number, { user: MoodleUser; courses: Array<{ courseId: number; courseName: string; courseShortName: string }> }>();
    
    // Obtener estudiantes de cada curso
    for (const course of courses) {
      try {
        const studentsResponse = await getCourseStudents(course.id);
        if (studentsResponse.success && studentsResponse.data) {
          for (const student of studentsResponse.data) {
            if (!userCourseMap.has(student.id)) {
              userCourseMap.set(student.id, { user: student, courses: [] });
            }
            userCourseMap.get(student.id)!.courses.push({
              courseId: course.id,
              courseName: course.fullname,
              courseShortName: course.shortname
            });
          }
        }
      } catch (courseError) {
        console.log(`Error obteniendo estudiantes del curso ${course.id}:`, courseError);
      }
    }
    
    // Filtrar usuarios con múltiples cursos
    const usersWithMultipleCourses: IDashboardStats['usersWithMultipleCourses'] = [];
    
    for (const [, userData] of userCourseMap) {
      if (userData.courses.length > 1) {
        usersWithMultipleCourses.push({
          userId: userData.user.id,
          username: userData.user.username,
          firstName: userData.user.firstname,
          lastName: userData.user.lastname,
          email: userData.user.email,
          courseCount: userData.courses.length,
          courses: userData.courses
        });
      }
    }
    
    return usersWithMultipleCourses;
    
  } catch {
    console.error('Error obteniendo usuarios con múltiples cursos');
    return [];
  }
}

// Función optimizada para obtener todos los usuarios con información de acceso
async function getAllUsersWithAccessOptimized(): Promise<MoodleUser[]> {
  try {
    // Método 1: Intentar con core_user_get_users sin criteria
    let response = await callMoodleApi<MoodleUser[]>('core_user_get_users', {});
    
    if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
    
    // Método 2: Intentar con core_user_get_users_by_field
    response = await callMoodleApi<MoodleUser[]>('core_user_get_users_by_field', {
      field: 'deleted',
      values: ['0']
    });
    
    if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
    
    // Método 3: Intentar con core_user_get_users con criteria diferente
    response = await callMoodleApi<MoodleUser[]>('core_user_get_users', {
      criteria: [
        { key: 'suspended', value: '0' }
      ]
    });
    
    if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
    
    // Método 4: Intentar con core_user_get_users con criteria original
    response = await callMoodleApi<MoodleUser[]>('core_user_get_users', {
      criteria: [
        { key: 'deleted', value: '0' }
      ]
    });
    
    if (response.success && response.data && Array.isArray(response.data) && response.data.length > 0) {
      return response.data;
    }
    
    // Si ningún método funciona, verificar si hay datos en formato diferente
    if (response.success && response.data && typeof response.data === 'object' && response.data !== null) {
      const dataObj = response.data as unknown as Record<string, unknown>;
      if ('users' in dataObj && Array.isArray(dataObj.users) && dataObj.users.length > 0) {
        return dataObj.users as MoodleUser[];
      }
    }
    
    return [];
    
  } catch {
    console.error('Error obteniendo usuarios con acceso');
    return [];
  }
}

// Función para obtener usuarios que nunca ingresaron
async function getNeverAccessedUsers(): Promise<IDashboardStats['neverAccessedUsers']> {
  try {
    // Usar la función optimizada que ya maneja múltiples métodos
    const allUsers = await getAllUsersWithAccessOptimized();
    
    if (allUsers.length === 0) {
      return [];
    }
    
    // Filtrar usuarios que nunca ingresaron (lastaccess es 0 o null)
    const neverAccessedUsers = allUsers.filter(user => 
      !user.lastaccess || user.lastaccess === 0
    );
    
    return neverAccessedUsers.map(user => ({
      userId: user.id,
      username: user.username,
      firstName: user.firstname,
      lastName: user.lastname,
      email: user.email,
      createdAt: new Date(), // Usar fecha actual ya que timecreated no está disponible
      lastAccess: user.lastaccess
    }));
    
  } catch (error) {
    console.error('Error obteniendo usuarios que nunca ingresaron:', error);
    return [];
  }
}

// Función optimizada para obtener todos los cursos con estudiantes en una sola operación
export async function getAllCoursesWithStudentsOptimized(): Promise<Array<{ course: MoodleCourse; students: MoodleUser[] }>> {
  try {
    // Obtener todos los cursos
    const coursesResponse = await getCourses();
    if (!coursesResponse.success || !coursesResponse.data) {
      return [];
    }
    
    const courses = coursesResponse.data;
    
    // Obtener estudiantes de todos los cursos en paralelo (limitado a 5 a la vez para evitar sobrecarga)
    const batchSize = 5;
    const results: Array<{ course: MoodleCourse; students: MoodleUser[] }> = [];
    
    for (let i = 0; i < courses.length; i += batchSize) {
      const batch = courses.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (course) => {
        try {
          const studentsResponse = await getCourseStudentsSimple(course.id);
          return {
            course,
            students: studentsResponse.success && studentsResponse.data ? studentsResponse.data : []
          };
        } catch {
          return { course, students: [] };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Pequeña pausa entre lotes para evitar sobrecarga
      if (i + batchSize < courses.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    return results;
    
  } catch (error) {
    console.error('Error obteniendo cursos con estudiantes:', error);
    return [];
  }
}

// Función para procesar usuarios con múltiples cursos
function processUsersWithMultipleCourses(coursesWithStudents: Array<{ course: MoodleCourse; students: MoodleUser[] }>): IDashboardStats['usersWithMultipleCourses'] {
  const userCourseMap = new Map<number, { user: MoodleUser; courses: Array<{ courseId: number; courseName: string; courseShortName: string }> }>();
  
  // Mapear usuarios a sus cursos (excluyendo "ASD- Campus ASD")
  for (const { course, students } of coursesWithStudents) {
    // Excluir el curso "ASD- Campus ASD" que no debe contar como un curso real
    // Usar múltiples variaciones del nombre para asegurar la exclusión
    const courseName = course.fullname?.toLowerCase() || '';
    if (courseName.includes('asd- campus asd') || 
        courseName.includes('asd campus asd') || 
        courseName.includes('campus asd') ||
        course.fullname === 'ASD - Campus ASD' ||
        course.fullname === 'ASD- Campus ASD') {

      continue;
    }
    
    for (const student of students) {
      if (!userCourseMap.has(student.id)) {
        userCourseMap.set(student.id, { user: student, courses: [] });
      }
      userCourseMap.get(student.id)!.courses.push({
        courseId: course.id,
        courseName: course.fullname,
        courseShortName: course.shortname
      });
    }
  }
  
  // Filtrar usuarios con múltiples cursos
  const usersWithMultipleCourses: IDashboardStats['usersWithMultipleCourses'] = [];
  
  for (const [, userData] of userCourseMap) {
    if (userData.courses.length > 1) {
      usersWithMultipleCourses.push({
        userId: userData.user.id,
        username: userData.user.username,
        firstName: userData.user.firstname,
        lastName: userData.user.lastname,
        email: userData.user.email,
        courseCount: userData.courses.length,
        courses: userData.courses
      });
    }
  }
  

  
  return usersWithMultipleCourses;
}

// Función para procesar usuarios suspendidos por curso desde la base de datos
async function processCourseSuspendedUsers(): Promise<IDashboardStats['courseSuspendedUsers']> {
  try {
    // Importar el modelo de SuspensionStatus
    const SuspensionStatusModel = (await import('../models/SuspensionStatus')).default;
    
    // Obtener todos los registros de suspensión agrupados por curso
    const suspensionStatuses = await SuspensionStatusModel.aggregate([
      {
        $match: { suspended: true }
      },
      {
        $group: {
          _id: '$courseId',
          suspendedUsers: {
            $push: {
              userId: '$userId',
              suspendedAt: '$suspendedAt',
              suspendedBy: '$suspendedBy',
              reason: '$reason'
            }
          },
          count: { $sum: 1 }
        }
      }
    ]);
    
    if (suspensionStatuses.length === 0) {
      return [];
    }
    
    // Obtener información de los cursos
    const coursesResponse = await getCourses();
    if (!coursesResponse.success || !coursesResponse.data) {
      return [];
    }
    
    const courses = coursesResponse.data;
    const courseMap = new Map(courses.map(course => [course.id, course]));
    
    // Obtener información de los usuarios suspendidos
    const allUsers = await getAllUsersWithAccessOptimized();
    const userMap = new Map(allUsers.map(user => [user.id, user]));
    
    // Construir el resultado
    const courseSuspendedUsers: IDashboardStats['courseSuspendedUsers'] = [];
    
         for (const status of suspensionStatuses as Array<{ _id: number; suspendedUsers: Array<{ userId: number; suspendedAt?: Date; suspendedBy?: string; reason?: string }> }>) {
       const courseId = status._id;
      const course = courseMap.get(courseId);
      
      if (!course) {
        continue;
      }
      
      const suspendedUsers = status.suspendedUsers.map((suspendedUser: { userId: number; suspendedAt?: Date; suspendedBy?: string; reason?: string }) => {
        const user = userMap.get(suspendedUser.userId);
        if (!user) {
          return null;
        }
        
        return {
          userId: user.id,
          username: user.username,
          firstName: user.firstname,
          lastName: user.lastname,
          email: user.email,
          suspendedAt: suspendedUser.suspendedAt || new Date(),
          suspendedBy: suspendedUser.suspendedBy,
          reason: suspendedUser.reason
        };
      }).filter((user): user is NonNullable<typeof user> => user !== null);
      
      if (suspendedUsers.length > 0) {
        courseSuspendedUsers.push({
          courseId: course.id,
          courseName: course.fullname,
          courseShortName: course.shortname,
          suspendedUsers
        });
      }
    }
    
    return courseSuspendedUsers;
    
  } catch (error) {
    console.error('Error procesando usuarios suspendidos por curso:', error);
    return [];
  }
}

// Función para obtener usuarios suspendidos por curso
async function getCourseSuspendedUsers(): Promise<IDashboardStats['courseSuspendedUsers']> {
  try {
    // Obtener todos los cursos
    const coursesResponse = await getCourses();
    if (!coursesResponse.success || !coursesResponse.data) {
      return [];
    }
    
    const courseSuspendedUsers: IDashboardStats['courseSuspendedUsers'] = [];
    
    // Para cada curso, obtener usuarios suspendidos
    for (const course of coursesResponse.data) {
      try {
        const studentsResponse = await getCourseStudents(course.id);
        if (studentsResponse.success && studentsResponse.data) {
          const suspendedStudents = studentsResponse.data.filter(student => 
            student.suspended || (student.enrolments && student.enrolments.some((enrol: { suspended: boolean }) => enrol.suspended))
          );
          
          if (suspendedStudents.length > 0) {
            courseSuspendedUsers.push({
              courseId: course.id,
              courseName: course.fullname,
              courseShortName: course.shortname,
              suspendedUsers: suspendedStudents.map(student => ({
                userId: student.id,
                username: student.username,
                firstName: student.firstname,
                lastName: student.lastname,
                email: student.email,
                suspendedAt: new Date(), // Moodle no proporciona fecha específica
                suspendedBy: undefined,
                reason: undefined
              }))
            });
          }
        }
      } catch (courseError) {
        console.log(`Error obteniendo usuarios suspendidos del curso ${course.id}:`, courseError);
      }
    }
    
    return courseSuspendedUsers;
    
  } catch (error) {
    console.error('Error obteniendo usuarios suspendidos por curso:', error);
    return [];
  }
}

// Función para obtener las estadísticas más recientes del dashboard
export async function getLatestDashboardStats(): Promise<{ success: boolean; error?: string; stats?: IDashboardStats }> {
  try {
    await connectDB();
    
    const stats = await DashboardStatsModel.findOne().sort({ createdAt: -1 });
    
    if (!stats) {
      return { success: false, error: 'No hay estadísticas disponibles' };
    }
    
    return { success: true, stats };
    
  } catch (error) {
    console.error('Error obteniendo estadísticas del dashboard:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
}

// Función para obtener estadísticas específicas del dashboard
export async function getDashboardStatsByType(type: 'globallySuspended' | 'multipleCourses' | 'neverAccessed' | 'courseSuspended'): Promise<{ success: boolean; error?: string; data?: unknown[] }> {
  try {
    await connectDB();
    
    const stats = await DashboardStatsModel.findOne().sort({ createdAt: -1 });
    
    if (!stats) {
      return { success: false, error: 'No hay estadísticas disponibles' };
    }
    
    let data: unknown[] = [];
    
    switch (type) {
      case 'globallySuspended':
        data = stats.globallySuspendedUsers;
        break;
      case 'multipleCourses':
        data = stats.usersWithMultipleCourses;
        break;
      case 'neverAccessed':
        data = stats.neverAccessedUsers;
        break;
      case 'courseSuspended':
        data = stats.courseSuspendedUsers;
        break;
    }
    
    return { success: true, data };
    
  } catch (error) {
    console.error(`Error obteniendo estadísticas de tipo ${type}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    };
  }
} 