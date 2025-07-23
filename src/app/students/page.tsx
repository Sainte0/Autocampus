'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StudentForm } from '../../components/StudentForm';
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
import { createUser } from '../../lib/moodle';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useUserSync } from '../../hooks/useUserSync';
import { UserStateNotification } from '../../components/UserStateNotification';

interface ActivityDetails {
  studentUsername?: string;
  studentName?: string;
  studentEmail?: string;
  studentFirstName?: string;
  studentLastName?: string;
  studentDocument?: string;
  studentPassword?: string;
  moodleUserId?: number;
}

interface Student {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  fullname: string;
  suspended?: boolean;
  lastaccess?: number; // Timestamp del último acceso
}

export default function StudentsPage() {
  const { user, isLoading, token } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para la lista de estudiantes
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [serverMessage, setServerMessage] = useState('');
  const [updatingUser, setUpdatingUser] = useState<number | null>(null);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');

  // Hook para sincronización de usuarios
  const { updateUserSuspension, getSyncedUsers } = useUserSync(students);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setIsAuthorized(true);
    }
  }, [user, isLoading]);

  useEffect(() => {
    // Obtener usuarios sincronizados y aplicar filtros
    const syncedStudents = getSyncedUsers();
    
    let filtered = syncedStudents;
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(student => 
        student.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.username?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredStudents(filtered);
  }, [students, searchTerm, getSyncedUsers]);

  const logActivity = async (action: string, details: ActivityDetails, status: 'success' | 'error' = 'success', errorMessage?: string) => {
    try {
      const response = await fetch('/api/activities/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action, details, status, errorMessage }),
      });

      if (!response.ok) {
        console.error('Log activity failed');
      }
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleCreateStudent = async (data: {
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    document?: string;
  }) => {
    setError(null);
    setSuccess(null);

    try {
      // Create student in Moodle
      const createResponse = await createUser(data);
      
      if (!createResponse.success) {
        // Log the failed activity
        await logActivity('create_student', {
          studentUsername: data.username,
          studentName: `${data.firstname} ${data.lastname}`,
          studentEmail: data.email,
          studentFirstName: data.firstname,
          studentLastName: data.lastname,
          studentDocument: data.document || '',
          studentPassword: data.password,
        }, 'error', createResponse.error);

        throw new Error(createResponse.error || 'Error al crear el estudiante');
      }

      // Log the successful activity
      const logDetails = {
        studentUsername: data.username,
        studentName: `${data.firstname} ${data.lastname}`,
        studentEmail: data.email,
        studentFirstName: data.firstname,
        studentLastName: data.lastname,
        studentDocument: data.document || '',
        studentPassword: data.password,
        moodleUserId: createResponse.data?.[0]?.id,
      };
      
      await logActivity('create_student', logDetails, 'success');

      setSuccess(`Estudiante ${data.firstname} ${data.lastname} creado exitosamente`);
      
      // Reset form
      return Promise.resolve();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el estudiante';
      setError(errorMessage);
      throw err;
    }
  };

  const searchStudents = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Construir URL con parámetros de query
      const params = new URLSearchParams();
      params.append('type', 'simple');
      params.append('q', searchTerm);
      
      const response = await fetch(`/api/users/search?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al buscar estudiantes');
      }

      const data = await response.json();
      setStudents(data.users || []);
      setServerMessage(data.message || 'Búsqueda completada');
    } catch (err) {
      setError('Error al buscar estudiantes');
      console.error('Error searching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchStudents();
  };

  const toggleUserSuspension = async (userId: number, currentSuspended: boolean) => {
    setUpdatingUser(userId);
    
    const result = await updateUserSuspension(userId, currentSuspended);
    
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
      setError(result.error || 'Error al actualizar el usuario');
    }
    
    setUpdatingUser(null);
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
                  Esto incluye creación de usuarios, inscripciones, búsquedas, y cualquier otra actividad del sistema para garantizar la seguridad y el correcto funcionamiento de la plataforma.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gestión de Alumnos
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Crea nuevos alumnos, busca y gestiona sus estados en Moodle
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Conectado como: {user?.firstName} {user?.lastName} (@{user?.username})
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('create')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'create'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Crear Alumno
              </button>
              <button
                onClick={() => setActiveTab('list')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'list'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                Lista de Alumnos
              </button>
            </nav>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Server Message */}
        {serverMessage && (
          <div className="mb-6 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
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

        {/* Tab Content */}
        {activeTab === 'create' ? (
          /* Crear Alumno Tab */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <StudentForm onSubmit={handleCreateStudent} token={token || undefined} />
          </div>
        ) : (
          /* Lista de Alumnos Tab */
          <div>
            {/* Notificaciones de estado de usuarios */}
            {filteredStudents.map(student => (
              <UserStateNotification
                key={`notification-${student.id}`}
                userId={student.id}
                userName={student.fullname}
                isSuspended={student.suspended || false}
                isCourseSuspension={false}
              />
            ))}

            {/* Search Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Buscar por nombre, email, usuario..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={loading || !searchTerm.trim()}
                    className="w-full sm:w-auto"
                  >
                    {loading ? 'Buscando...' : 'Buscar'}
                  </Button>
                  {students.length > 0 && (
                    <Button
                      onClick={searchStudents}
                      disabled={loading}
                      className="w-full sm:w-auto bg-gray-500 hover:bg-gray-600"
                    >
                      {loading ? 'Refrescando...' : 'Refrescar'}
                    </Button>
                  )}
                </div>
              </form>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                La búsqueda se realiza automáticamente en todos los campos (nombre, email, usuario)
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✅ Suspensión GLOBAL: Los cambios afectan al usuario en todo Moodle
              </p>
            </div>

            {/* Results */}
            {filteredStudents.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Resultados ({filteredStudents.length} de {students.length})
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
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Nombre Completo
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Último Acceso
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredStudents.map((student) => (
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
                            <Button
                              onClick={() => toggleUserSuspension(student.id, student.suspended || false)}
                              disabled={updatingUser === student.id}
                              className={`px-3 py-1 text-xs font-medium rounded ${
                                student.suspended
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                            >
                              {updatingUser === student.id 
                                ? 'Actualizando...' 
                                : student.suspended 
                                  ? 'Reactivar' 
                                  : 'Suspender'
                              }
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile/Tablet Cards */}
                <div className="lg:hidden">
                  <div className="space-y-4 p-4">
                    {filteredStudents.map((student) => (
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
                        
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
                          <Button
                            onClick={() => toggleUserSuspension(student.id, student.suspended || false)}
                            disabled={updatingUser === student.id}
                            className={`w-full px-3 py-2 text-sm font-medium rounded ${
                              student.suspended
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                          >
                            {updatingUser === student.id 
                              ? 'Actualizando...' 
                              : student.suspended 
                                ? 'Reactivar Globalmente' 
                                : 'Suspender Globalmente'
                            }
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No Results */}
            {filteredStudents.length === 0 && students.length > 0 && !loading && !error && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No se encontraron estudiantes con los criterios de búsqueda especificados.
                </p>
              </div>
            )}

            {/* No Students */}
            {students.length === 0 && !loading && !error && (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Realiza una búsqueda para ver estudiantes
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 