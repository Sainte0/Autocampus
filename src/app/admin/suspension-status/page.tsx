'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

interface SuspensionStatus {
  _id: string;
  userId: number;
  courseId: number;
  suspended: boolean;
  suspendedAt?: string;
  reactivatedAt?: string;
  suspendedBy?: string;
  reactivatedBy?: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

interface Course {
  id: number;
  fullname: string;
  shortname: string;
}

export default function SuspensionStatusPage() {
  const { token } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [suspensionStatuses, setSuspensionStatuses] = useState<SuspensionStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar cursos al montar el componente
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const response = await fetch('/api/courses', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCourses(data.data || []);
        } else {
          setError('Error al cargar los cursos');
        }
      } catch (error) {
        console.error('Error cargando cursos:', error);
        setError('Error al cargar los cursos');
      }
    };

    if (token) {
      loadCourses();
    }
  }, [token]);

  // Cargar estados de suspensión cuando se selecciona un curso
  useEffect(() => {
    const loadSuspensionStatus = async () => {
      if (!selectedCourse || !token) return;

      setLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/courses/${selectedCourse}/suspension-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSuspensionStatuses(data.data || []);
        } else {
          setError('Error al cargar los estados de suspensión');
        }
      } catch (error) {
        console.error('Error cargando estados de suspensión:', error);
        setError('Error al cargar los estados de suspensión');
      } finally {
        setLoading(false);
      }
    };

    loadSuspensionStatus();
  }, [selectedCourse, token]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-AR');
  };

  const getStatusText = (status: SuspensionStatus) => {
    if (status.suspended) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Suspendido
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Activo
        </span>
      );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Estados de Suspensión
        </h1>
        <p className="text-gray-600">
          Visualiza el historial de suspensiones y reactivaciones de usuarios en los cursos.
        </p>
      </div>

      {/* Selector de curso */}
      <div className="mb-6">
        <label htmlFor="course-select" className="block text-sm font-medium text-gray-700 mb-2">
          Seleccionar Curso
        </label>
        <select
          id="course-select"
          value={selectedCourse || ''}
          onChange={(e) => setSelectedCourse(e.target.value ? parseInt(e.target.value) : null)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Selecciona un curso...</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.fullname}
            </option>
          ))}
        </select>
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Estados de suspensión */}
      {selectedCourse && (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Estados de Suspensión - {courses.find(c => c.id === selectedCourse)?.fullname}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              {loading ? 'Cargando...' : `${suspensionStatuses.length} registros encontrados`}
            </p>
          </div>

          {loading ? (
            <div className="px-4 py-8 text-center">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition ease-in-out duration-150 cursor-not-allowed">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Cargando...
              </div>
            </div>
          ) : suspensionStatuses.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {suspensionStatuses.map((status) => (
                <li key={status._id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {status.userId}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            Usuario ID: {status.userId}
                          </p>
                          {getStatusText(status)}
                        </div>
                        <div className="mt-1 text-sm text-gray-500 space-y-1">
                          {status.suspended ? (
                            <>
                              {status.suspendedAt && (
                                <p>Suspendido el: {formatDate(status.suspendedAt)}</p>
                              )}
                              {status.suspendedBy && (
                                <p>Suspendido por: {status.suspendedBy}</p>
                              )}
                              {status.reason && (
                                <p>Motivo: {status.reason}</p>
                              )}
                            </>
                          ) : (
                            <>
                              {status.reactivatedAt && (
                                <p>Reactivado el: {formatDate(status.reactivatedAt)}</p>
                              )}
                              {status.reactivatedBy && (
                                <p>Reactivado por: {status.reactivatedBy}</p>
                              )}
                            </>
                          )}
                          <p>Última actualización: {formatDate(status.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-gray-500">No hay registros de suspensión para este curso.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 