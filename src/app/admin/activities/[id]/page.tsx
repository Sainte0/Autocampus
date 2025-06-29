'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { Button } from '../../../../components/ui/Button';

interface Activity {
  _id: string;
  userId: {
    _id: string;
    username: string;
    firstName: string;
    lastName: string;
    role: string;
    email: string;
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

export default function ActivityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { id } = use(params);

  const fetchActivity = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/activities/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setActivity(data.activity);
      } else {
        setError(data.error || 'Error al cargar la actividad');
      }
    } catch {
      setError('Error al cargar la actividad');
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      window.location.href = '/admin/login';
      return;
    }
    fetchActivity();
  }, [user, fetchActivity]);

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

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return 'Fecha inválida';
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-md">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 rounded-md">
            <p className="text-yellow-700 dark:text-yellow-200">Actividad no encontrada</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Detalle de Actividad
            </h1>
            <Button
              onClick={() => router.back()}
              variant="secondary"
              className="px-4"
            >
              ← Volver
            </Button>
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Información completa de la actividad registrada en el sistema
          </p>
        </div>

        {/* Activity Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
          {/* Basic Info */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Información Básica
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Acción
                </label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getActionColor(activity.action)}`}>
                  {getActionLabel(activity.action)}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Estado
                </label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(activity.status)}`}>
                  {activity.status === 'success' ? 'Exitoso' : 
                   activity.status === 'error' ? 'Error' : 'Pendiente'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fecha de Creación
                </label>
                <p className="text-gray-900 dark:text-white">{formatDate(activity.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Última Actualización
                </label>
                <p className="text-gray-900 dark:text-white">{formatDate(activity.updatedAt)}</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Usuario que Realizó la Acción
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre Completo
                </label>
                <p className="text-gray-900 dark:text-white">
                  {activity.userId?.firstName} {activity.userId?.lastName}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre de Usuario
                </label>
                <p className="text-gray-900 dark:text-white">@{activity.userUsername}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <p className="text-gray-900 dark:text-white">{activity.userId?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rol
                </label>
                <p className="text-gray-900 dark:text-white capitalize">{activity.userId?.role}</p>
              </div>
            </div>
          </div>

          {/* Activity Details */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Detalles de la Actividad
            </h2>
            <div className="space-y-4">
              {activity.details.studentUsername && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Usuario del Estudiante
                  </label>
                  <p className="text-gray-900 dark:text-white">{activity.details.studentUsername}</p>
                </div>
              )}
              {activity.details.studentFirstName && activity.details.studentLastName && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre y Apellido
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {activity.details.studentFirstName} {activity.details.studentLastName}
                  </p>
                </div>
              )}
              {activity.details.studentEmail && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <p className="text-gray-900 dark:text-white">{activity.details.studentEmail}</p>
                </div>
              )}
              {activity.details.studentDocument && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Número de Documento
                  </label>
                  <p className="text-gray-900 dark:text-white">{activity.details.studentDocument}</p>
                </div>
              )}
              {activity.details.studentPassword && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contraseña Generada
                  </label>
                  <p className="text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {activity.details.studentPassword}
                  </p>
                </div>
              )}
              {activity.details.moodleUserId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    ID en Moodle
                  </label>
                  <p className="text-gray-900 dark:text-white">{activity.details.moodleUserId}</p>
                </div>
              )}
              {activity.details.courseId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Curso
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">ID del Curso</p>
                        <p className="text-gray-900 dark:text-white font-medium">{activity.details.courseId}</p>
                      </div>
                      {activity.details.courseName && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Nombre del Curso</p>
                          <p className="text-gray-900 dark:text-white font-medium">{activity.details.courseName}</p>
                        </div>
                      )}
                      {activity.details.courseShortName && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Código del Curso</p>
                          <p className="text-gray-900 dark:text-white font-medium">{activity.details.courseShortName}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {activity.details.reason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Razón
                  </label>
                  <p className="text-gray-900 dark:text-white">{activity.details.reason}</p>
                </div>
              )}
            </div>
          </div>

          {/* Error Message */}
          {activity.errorMessage && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Mensaje de Error
              </h2>
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-700 dark:text-red-200 font-mono text-sm">
                  {activity.errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Data Changes */}
          {(activity.details.oldData || activity.details.newData) && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Cambios de Datos
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activity.details.oldData && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Datos Anteriores
                    </label>
                    <pre className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-sm text-gray-900 dark:text-gray-100 overflow-x-auto">
                      {JSON.stringify(activity.details.oldData, null, 2)}
                    </pre>
                  </div>
                )}
                {activity.details.newData && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Datos Nuevos
                    </label>
                    <pre className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg text-sm text-gray-900 dark:text-gray-100 overflow-x-auto">
                      {JSON.stringify(activity.details.newData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 