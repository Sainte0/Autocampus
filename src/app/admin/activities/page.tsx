'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ActivityNavigation } from '../../../components/ActivityNavigation';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
}

interface Activity {
  _id: string;
  userId: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  userUsername: string;
  userFullName: string;
  action: 'create_student' | 'enroll_student' | 'update_student' | 'delete_student' | 'unenroll_student';
  details: {
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
    moodleUserId?: number;
    oldData?: Record<string, unknown>;
    newData?: Record<string, unknown>;
    reason?: string;
  };
  status: 'success' | 'error' | 'pending';
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminActivitiesPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    userId: '',
    action: '',
    status: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [isClearing, setIsClearing] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch {
      console.error('Error fetching users');
    }
  }, [token]);

  const fetchActivities = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.action && { action: filters.action }),
        ...(filters.status && { status: filters.status }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await fetch(`/api/activities?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setActivities(data.activities);
        setPagination(data.pagination);
      }
    } catch {
      console.error('Error fetching activities');
    } finally {
      setIsLoading(false);
    }
  }, [token, pagination.page, pagination.limit, filters]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      window.location.href = '/admin/login';
      return;
    }
    fetchUsers();
    fetchActivities();
  }, [user, fetchUsers, fetchActivities]);

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create_student':
        return 'Crear Alumno';
      case 'enroll_student':
        return 'Inscribir Alumno';
      case 'update_student':
        return 'Actualizar Alumno';
      case 'delete_student':
        return 'Eliminar Alumno';
      case 'unenroll_student':
        return 'Desinscribir Alumno';
      default:
        return action;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create_student':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'enroll_student':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'update_student':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'delete_student':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'unenroll_student':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success':
        return 'Exitoso';
      case 'error':
        return 'Error';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const handleViewDetails = (activityId: string) => {
    router.push(`/admin/activities/${activityId}`);
  };

  const handleClearAllActivities = async () => {
    if (!confirm('¿Estás seguro de que quieres eliminar TODOS los registros de actividades? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsClearing(true);
    try {
      const response = await fetch('/api/activities/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        // Refresh the activities list
        fetchActivities();
      } else {
        alert('Error al limpiar las actividades: ' + data.error);
      }
    } catch (error) {
      alert('Error al limpiar las actividades');
      console.error('Error clearing activities:', error);
    } finally {
      setIsClearing(false);
    }
  };

  if (isLoading) {
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
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Registro de Actividades de Usuarios</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Historial completo de acciones realizadas por usuarios del sistema con detalles técnicos
          </p>
        </div>

        <ActivityNavigation />

        {/* Clear All Activities Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={handleClearAllActivities}
            disabled={isClearing}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            {isClearing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Limpiando...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Limpiar Todas las Actividades</span>
              </>
            )}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Usuario
              </label>
              <select
                value={filters.userId}
                onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los usuarios</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.firstName} {user.lastName} (@{user.username})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Acción
              </label>
              <select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todas las acciones</option>
                <option value="create_student">Crear Alumno</option>
                <option value="enroll_student">Inscribir Alumno</option>
                <option value="update_student">Actualizar Alumno</option>
                <option value="delete_student">Eliminar Alumno</option>
                <option value="unenroll_student">Desinscribir Alumno</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Todos los estados</option>
                <option value="success">Exitoso</option>
                <option value="error">Error</option>
                <option value="pending">Pendiente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Fecha Fin
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => setFilters({ userId: '', action: '', status: '', startDate: '', endDate: '' })}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </div>

        {/* Activities Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Actividades de Usuarios ({pagination.total} total)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Detalles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No se encontraron actividades para los filtros seleccionados
                    </td>
                  </tr>
                ) : (
                  activities.map((activity) => (
                    <tr key={activity._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {activity.userId?.firstName} {activity.userId?.lastName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          @{activity.userUsername}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(activity.action)}`}>
                          {getActionLabel(activity.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(activity.status)}`}>
                          {getStatusLabel(activity.status)}
                        </span>
                        {activity.errorMessage && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Error
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {activity.action === 'create_student' && (
                          <div>
                            <strong>Alumno:</strong> {activity.details.studentFirstName && activity.details.studentLastName 
                              ? `${activity.details.studentFirstName} ${activity.details.studentLastName}`
                              : activity.details.studentUsername}
                            <div className="text-gray-500 dark:text-gray-400">
                              Usuario: {activity.details.studentUsername}
                            </div>
                            {activity.details.studentEmail && (
                              <div className="text-gray-500 dark:text-gray-400">Email: {activity.details.studentEmail}</div>
                            )}
                            {activity.details.studentDocument && (
                              <div className="text-gray-500 dark:text-gray-400">Documento: {activity.details.studentDocument}</div>
                            )}
                            {activity.details.studentPassword && (
                              <div className="text-gray-500 dark:text-gray-400">Contraseña: {activity.details.studentPassword}</div>
                            )}
                            {activity.details.moodleUserId && (
                              <div className="text-gray-500 dark:text-gray-400">ID Moodle: {activity.details.moodleUserId}</div>
                            )}
                          </div>
                        )}
                        {activity.action === 'enroll_student' && (
                          <div>
                            <strong>Alumno:</strong> {activity.details.studentFirstName && activity.details.studentLastName 
                              ? `${activity.details.studentFirstName} ${activity.details.studentLastName}`
                              : activity.details.studentUsername}
                            <div className="text-gray-500 dark:text-gray-400">
                              Usuario: {activity.details.studentUsername}
                            </div>
                            {activity.details.studentEmail && (
                              <div className="text-gray-500 dark:text-gray-400">Email: {activity.details.studentEmail}</div>
                            )}
                            {activity.details.courseName && (
                              <div className="text-gray-500 dark:text-gray-400">Curso: {activity.details.courseName}</div>
                            )}
                            {activity.details.courseShortName && (
                              <div className="text-gray-500 dark:text-gray-400">Código: {activity.details.courseShortName}</div>
                            )}
                          </div>
                        )}
                        {activity.action === 'update_student' && (
                          <div>
                            <strong>Actualización:</strong> {activity.details.studentFirstName && activity.details.studentLastName 
                              ? `${activity.details.studentFirstName} ${activity.details.studentLastName}`
                              : activity.details.studentUsername}
                            <div className="text-gray-500 dark:text-gray-400">
                              Usuario: {activity.details.studentUsername}
                            </div>
                            {activity.details.reason && (
                              <div className="text-gray-500 dark:text-gray-400">Razón: {activity.details.reason}</div>
                            )}
                          </div>
                        )}
                        {activity.action === 'delete_student' && (
                          <div>
                            <strong>Eliminación:</strong> {activity.details.studentFirstName && activity.details.studentLastName 
                              ? `${activity.details.studentFirstName} ${activity.details.studentLastName}`
                              : activity.details.studentUsername}
                            <div className="text-gray-500 dark:text-gray-400">
                              Usuario: {activity.details.studentUsername}
                            </div>
                            {activity.details.reason && (
                              <div className="text-gray-500 dark:text-gray-400">Razón: {activity.details.reason}</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {(() => {
                          try {
                            const date = new Date(activity.createdAt);
                            return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleString('es-ES');
                          } catch {
                            return 'Fecha inválida';
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="secondary"
                          onClick={() => handleViewDetails(activity._id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1 text-sm"
                        >
                          Ver Detalle
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  Página {pagination.page} de {pagination.pages} ({pagination.total} actividades totales)
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                    disabled={pagination.page <= 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.pages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 