'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { CourseList } from '../../components/CourseList';
import { getCourses, enrollUser, searchUsers } from '../../lib/moodle';
import { MoodleCourse } from '../../types/moodle';

interface ActivityDetails {
  studentUsername?: string;
  studentName?: string;
  studentEmail?: string;
  studentFirstName?: string;
  studentLastName?: string;
  studentDocument?: string;
  studentPassword?: string;
  courseId?: number;
  courseName?: string;
  courseShortName?: string;
}

export default function CoursesPage() {
  const { user, isLoading, token } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [courses, setCourses] = useState<MoodleCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setIsAuthorized(true);
      loadCourses();
    }
  }, [user, isLoading]);

  const logActivity = async (action: string, details: ActivityDetails, status: 'success' | 'error' = 'success', errorMessage?: string) => {
    try {
      await fetch('/api/activities/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action, details, status, errorMessage }),
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCourses();
      if (response.success && response.data) {
        setCourses(response.data);
      } else {
        setError(response.error || 'Error al cargar los cursos');
      }
    } catch {
      setError('Error al cargar los cursos');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (courseId: number, username: string) => {
    try {
      const course = courses.find(c => c.id === courseId);
      
      // Obtener información completa del estudiante desde los logs de actividades
      let studentInfo = null;
      try {
        const studentResponse = await fetch(`/api/activities/student-info?username=${username}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (studentResponse.ok) {
          const studentData = await studentResponse.json();
          if (studentData.success) {
            studentInfo = studentData.student;
          }
        }
      } catch (error) {
        console.error('Error getting student info:', error);
      }
      
      // Si no se pudo obtener la información completa, buscar en Moodle como fallback
      if (!studentInfo) {
        const userResponse = await searchUsers(username);
        if (userResponse.success && userResponse.data && userResponse.data.length > 0) {
          studentInfo = userResponse.data[0];
        }
      }
      
      const enrollmentResponse = await enrollUser({
        username,
        courseid: courseId,
        roleid: 5 // 5 es el roleid para estudiantes
      });

      if (enrollmentResponse.success) {
        // Log the successful enrollment activity with complete student info
        await logActivity('enroll_student', {
          studentUsername: username,
          studentName: studentInfo?.name || studentInfo?.firstname ? `${studentInfo.firstname} ${studentInfo.lastname}` : username,
          studentEmail: studentInfo?.email || '',
          studentFirstName: studentInfo?.firstName || studentInfo?.firstname || '',
          studentLastName: studentInfo?.lastName || studentInfo?.lastname || '',
          studentDocument: studentInfo?.document || '',
          studentPassword: studentInfo?.password || '',
          courseId: courseId,
          courseName: course?.fullname || `Curso ${courseId}`,
          courseShortName: course?.shortname,
        }, 'success');

        // Create receipt data and redirect to receipt page
        const receiptData = {
          studentUsername: username,
          studentName: studentInfo?.name || studentInfo?.firstname ? `${studentInfo.firstname} ${studentInfo.lastname}` : username,
          studentEmail: studentInfo?.email || '',
          studentFirstName: studentInfo?.firstName || studentInfo?.firstname || '',
          studentLastName: studentInfo?.lastName || studentInfo?.lastname || '',
          studentDocument: studentInfo?.document || '',
          studentPassword: studentInfo?.password || '',
          courseId: courseId,
          courseName: course?.fullname || `Curso ${courseId}`,
          courseShortName: course?.shortname || '',
          enrollmentDate: new Date().toISOString(),
          enrollmentId: `ENR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        };

        // Redirect to receipt page with data
        const encodedData = encodeURIComponent(JSON.stringify(receiptData));
        window.location.href = `/receipt?data=${encodedData}`;
      } else {
        // Log the failed enrollment activity
        await logActivity('enroll_student', {
          studentUsername: username,
          studentName: studentInfo?.name || studentInfo?.firstname ? `${studentInfo.firstname} ${studentInfo.lastname}` : username,
          studentEmail: studentInfo?.email || '',
          studentFirstName: studentInfo?.firstName || studentInfo?.firstname || '',
          studentLastName: studentInfo?.lastName || studentInfo?.lastname || '',
          studentDocument: studentInfo?.document || '',
          studentPassword: studentInfo?.password || '',
          courseId: courseId,
          courseName: course?.fullname || `Curso ${courseId}`,
          courseShortName: course?.shortname,
        }, 'error', enrollmentResponse.error);
      }

      return enrollmentResponse;
    } catch (error) {
      const course = courses.find(c => c.id === courseId);
      
      // Log the error activity
      await logActivity('enroll_student', {
        studentUsername: username,
        courseId: courseId,
        courseName: course?.fullname || `Curso ${courseId}`,
        courseShortName: course?.shortname,
      }, 'error', error instanceof Error ? error.message : 'Error desconocido');

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al inscribir al usuario'
      };
    }
  };

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando cursos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
            <p className="text-red-700 dark:text-gray-200">{error}</p>
            <button
              onClick={loadCourses}
              className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Banner de Aviso */}
        <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                ⚠️ Aviso Importante
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  <strong>Todas las acciones realizadas en esta plataforma son monitoreadas y registradas por el administrador.</strong>
                </p>
                <p className="mt-1">
                  Esto incluye inscripciones, búsquedas, y cualquier otra actividad del sistema para garantizar la seguridad y el correcto funcionamiento de la plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestión de Cursos
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Visualiza los cursos disponibles y gestiona las inscripciones de estudiantes
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Conectado como: {user?.firstName} {user?.lastName} (@{user?.username})
          </p>
        </div>
        <CourseList courses={courses} onEnroll={handleEnroll} />
      </div>
    </div>
  );
} 