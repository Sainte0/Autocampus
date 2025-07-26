'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import { useCourseUserSync } from '../../../../hooks/useUserSync';
import { UserStateNotification } from '../../../../components/UserStateNotification';

// Función auxiliar para formatear la fecha del último acceso
function formatLastAccess(lastaccess?: number): string {
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

interface Student {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  fullname: string;
  suspended?: boolean;
  lastaccess?: number;
}

interface Course {
  id: number;
  shortname: string;
  fullname: string;
  categoryid: number;
  categoryname: string;
  visible: number;
}

type SortField = 'fullname' | 'lastaccess' | 'suspended' | 'username' | 'email';
type SortDirection = 'asc' | 'desc';

export default function CourseStudentsPage() {
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serverMessage, setServerMessage] = useState('');
  const [updatingUser, setUpdatingUser] = useState<number | null>(null);
  
  // Estados para búsqueda y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('fullname');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Hook para sincronización de usuarios del curso
  const { updateCourseUserSuspension, removeUserFromCourse } = useCourseUserSync(parseInt(courseId), students);

  // Función para filtrar estudiantes por búsqueda
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) {
      return students;
    }
    
    const term = searchTerm.toLowerCase().trim();
    return students.filter(student => 
      student.firstname.toLowerCase().includes(term) ||
      student.lastname.toLowerCase().includes(term) ||
      student.fullname.toLowerCase().includes(term) ||
      student.username.toLowerCase().includes(term) ||
      student.email.toLowerCase().includes(term)
    );
  }, [students, searchTerm]);

  // Función para ordenar estudiantes
  const sortedStudents = useMemo(() => {
    return [...filteredStudents].sort((a, b) => {
      let aValue: string | number | boolean;
      let bValue: string | number | boolean;
      
      switch (sortField) {
        case 'fullname':
          aValue = a.fullname.toLowerCase();
          bValue = b.fullname.toLowerCase();
          break;
        case 'lastaccess':
          aValue = a.lastaccess || 0;
          bValue = b.lastaccess || 0;
          break;
        case 'suspended':
          aValue = a.suspended || false;
          bValue = b.suspended || false;
          break;
        case 'username':
          aValue = a.username.toLowerCase();
          bValue = b.username.toLowerCase();
          break;
        case 'email':
          aValue = a.email.toLowerCase();
          bValue = b.email.toLowerCase();
          break;
        default:
          aValue = a.fullname.toLowerCase();
          bValue = b.fullname.toLowerCase();
      }
      
      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredStudents, sortField, sortDirection]);

  // Función para cambiar el ordenamiento
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Función para obtener el ícono de ordenamiento
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return '↕️';
    }
    return sortDirection === 'asc' ? '↑' : '↓';
  };

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
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Alumnos ({students.length})
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {sortedStudents.length} de {students.length} estudiantes
              </p>
            </div>
            <Button
              onClick={loadCourseAndStudents}
              disabled={loading}
              className="w-auto"
            >
              {loading ? 'Cargando...' : 'Actualizar'}
            </Button>
          </div>
          
          {/* Búsqueda y Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Buscar por nombre, apellido, usuario o email
              </label>
              <Input
                type="text"
                placeholder="Buscar estudiantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ordenar por
              </label>
              <Select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="w-full"
                options={[
                  { value: 'fullname', label: 'Nombre/Apellido' },
                  { value: 'lastaccess', label: 'Último Acceso' },
                  { value: 'suspended', label: 'Estado' },
                  { value: 'username', label: 'Usuario' },
                  { value: 'email', label: 'Email' }
                ]}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Dirección
              </label>
              <Select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as SortDirection)}
                className="w-full"
                options={[
                  { value: 'asc', label: 'Ascendente' },
                  { value: 'desc', label: 'Descendente' }
                ]}
              />
            </div>
          </div>
          
          <p className="text-xs text-green-600 dark:text-green-400">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Estudiantes del Curso ({sortedStudents.length})
              </h2>
            </div>
            
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      ID
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('fullname')}
                    >
                      <div className="flex items-center gap-1">
                        Nombre Completo {getSortIcon('fullname')}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('username')}
                    >
                      <div className="flex items-center gap-1">
                        Usuario {getSortIcon('username')}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('email')}
                    >
                      <div className="flex items-center gap-1">
                        Email {getSortIcon('email')}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('suspended')}
                    >
                      <div className="flex items-center gap-1">
                        Estado {getSortIcon('suspended')}
                      </div>
                    </th>
                    <th 
                      className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      onClick={() => handleSort('lastaccess')}
                    >
                      <div className="flex items-center gap-1">
                        Último Acceso {getSortIcon('lastaccess')}
                      </div>
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sortedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                        {student.id}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                        {student.fullname}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                        {student.username}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                        {student.email}
                      </td>
                      <td className="px-3 py-4">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          student.suspended 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}>
                          {student.suspended ? 'Suspendido' : 'Activo'}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
                        {student.lastaccess ? formatLastAccess(student.lastaccess) : 'Nunca'}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-900 dark:text-white">
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

            {/* Mobile/Tablet Cards */}
            <div className="lg:hidden">
              <div className="space-y-4 p-4">
                {sortedStudents.map((student) => (
                  <div key={student.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                          {student.fullname}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {student.id} | @{student.username}
                        </p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        student.suspended 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {student.suspended ? 'Suspendido' : 'Activo'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Email:</span>
                        <span className="text-gray-900 dark:text-white">{student.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Último acceso:</span>
                        <span className="text-gray-900 dark:text-white">
                          {student.lastaccess ? formatLastAccess(student.lastaccess) : 'Nunca'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
                      <Button
                        onClick={() => toggleUserSuspension(student.id, student.suspended || false)}
                        disabled={updatingUser === student.id}
                        className={`w-full px-3 py-2 text-sm font-medium rounded ${
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
                        className="w-full px-3 py-2 text-sm font-medium rounded bg-red-600 hover:bg-red-700 text-white"
                      >
                        {updatingUser === student.id ? 'Eliminando...' : 'Eliminar del Curso'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* No Students */}
        {sortedStudents.length === 0 && !loading && !error && (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm.trim() ? 'No se encontraron estudiantes que coincidan con la búsqueda.' : 'No hay alumnos inscritos en este curso.'}
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