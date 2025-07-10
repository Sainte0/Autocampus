'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../../components/ui/Button';
import { useCourseUserSync } from '../../../../hooks/useUserSync';
import { UserStateNotification } from '../../../../components/UserStateNotification';

interface Student {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  fullname: string;
  suspended?: boolean;
}

interface Course {
  id: number;
  shortname: string;
  fullname: string;
  categoryid: number;
  categoryname: string;
  visible: number;
}

export default function CourseStudentsPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serverMessage, setServerMessage] = useState('');
  const [updatingUser, setUpdatingUser] = useState<number | null>(null);

  // Hook para sincronización de usuarios del curso
  const { updateCourseUserSuspension, removeUserFromCourse } = useCourseUserSync(parseInt(courseId), students);

  const loadCourseAndStudents = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // Cargar información del curso
      const courseResponse = await fetch(`/api/courses/${courseId}`);
      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        setCourse(courseData.course);
      }

      // Cargar estudiantes del curso
      const studentsResponse = await fetch(`/api/courses/students?courseId=${courseId}`);
      const studentsData = await studentsResponse.json();
      
      if (studentsResponse.ok) {
        setStudents(studentsData.students || []);
        
        // Mostrar mensaje informativo si existe
        if (studentsData.message) {
          setServerMessage(studentsData.message);
        }
      } else {
        const errorMessage = studentsData.error || 'Error al cargar los estudiantes del curso';
        const details = studentsData.details ? ` (${studentsData.details})` : '';
        setError(`${errorMessage}${details}`);
        setStudents([]);
      }
    } catch (err) {
      setError('Error al cargar la información del curso');
      console.error('Error loading course and students:', err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (courseId) {
      loadCourseAndStudents();
    }
  }, [courseId, loadCourseAndStudents]);

  const toggleUserSuspension = async (userId: number, currentSuspended: boolean) => {
    setUpdatingUser(userId);
    
    const result = await updateCourseUserSuspension(userId, currentSuspended);
    
    if (result.success) {
      // Actualizar el estado local del usuario
      setStudents(prevStudents => 
        prevStudents.map(student => 
          student.id === userId 
            ? { ...student, suspended: !currentSuspended }
            : student
        )
      );
      
      setServerMessage(result.message);
    } else {
      setError(result.error || 'Error al actualizar el usuario en el curso');
    }
    
    setUpdatingUser(null);
  };

  const handleRemoveUser = async (userId: number, userName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar a ${userName} del curso? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    setUpdatingUser(userId);
    
    const result = await removeUserFromCourse(userId);
    
    if (result.success) {
      // Remover el usuario de la lista local
      setStudents(prevStudents => 
        prevStudents.filter(student => student.id !== userId)
      );
      
      setServerMessage(result.message);
    } else {
      setError(result.error || 'Error al eliminar el usuario del curso');
    }
    
    setUpdatingUser(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Notificaciones de estado de usuarios */}
        {students.map(student => (
          <UserStateNotification
            key={`notification-${student.id}`}
            userId={student.id}
            userName={student.fullname}
            isSuspended={student.suspended || false}
            isCourseSuspension={true}
            courseId={parseInt(courseId)}
          />
        ))}
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/courses"
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              ← Volver a Cursos
            </Link>
          </div>
          
          {course && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Alumnos del Curso
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                <div>
                  <span className="font-semibold">Curso:</span> {course.fullname}
                </div>
                <div>
                  <span className="font-semibold">Código:</span> {course.shortname}
                </div>
                <div>
                  <span className="font-semibold">Categoría:</span> {course.categoryname}
                </div>
                <div>
                  <span className="font-semibold">Estado:</span>
                  <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${
                    course.visible 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {course.visible ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Alumnos ({students.length})
              </h2>
            </div>
            <Button
              onClick={loadCourseAndStudents}
              disabled={loading}
              className="w-auto"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </div>
          
          <p className="text-xs text-green-600 dark:text-green-400 mt-2">
            ✅ Suspender: El alumno queda en el curso pero no puede acceder | Eliminar: El alumno se borra completamente del curso
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Server Message */}
        {serverMessage && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm">{serverMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {students.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Nombre Completo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.fullname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          student.suspended 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {student.suspended ? 'Suspendido' : 'Activo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        <div className="flex gap-2">
                          <Button
                            onClick={() => toggleUserSuspension(student.id, student.suspended || false)}
                            disabled={updatingUser === student.id}
                            className={`px-3 py-1 text-xs font-medium rounded ${
                              student.suspended
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-orange-600 hover:bg-orange-700 text-white'
                            }`}
                          >
                            {updatingUser === student.id 
                              ? 'Actualizando...' 
                              : student.suspended 
                                ? 'Reactivar' 
                                : 'Suspender'
                            }
                          </Button>
                          <Button
                            onClick={() => handleRemoveUser(student.id, student.fullname)}
                            disabled={updatingUser === student.id}
                            className="px-3 py-1 text-xs font-medium rounded bg-red-600 hover:bg-red-700 text-white"
                          >
                            {updatingUser === student.id ? 'Eliminando...' : 'Eliminar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Students */}
        {students.length === 0 && !loading && !error && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No hay alumnos inscritos en este curso.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Cargando alumnos del curso...
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 