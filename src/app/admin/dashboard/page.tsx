'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '../../../components/ui/Button';
import { useRouter } from 'next/navigation';
import DashboardFilters from '../../../components/DashboardFilters';
import DashboardExport from '../../../components/DashboardExport';
import { useDashboardFilters } from '../../../hooks/useDashboardFilters';

interface DashboardStats {
  globallySuspendedUsers: Array<{
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    suspendedAt: string;
    suspendedBy?: string;
    reason?: string;
  }>;
  usersWithMultipleCourses: Array<{
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    courseCount: number;
    courses: Array<{
      courseId: number;
      courseName: string;
      courseShortName: string;
    }>;
  }>;
  neverAccessedUsers: Array<{
    userId: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    lastAccess: number;
  }>;
  courseSuspendedUsers: Array<{
    courseId: number;
    courseName: string;
    courseShortName: string;
    suspendedUsers: Array<{
      userId: number;
      username: string;
      firstName: string;
      lastName: string;
      email: string;
      suspendedAt: string;
      suspendedBy?: string;
      reason?: string;
    }>;
  }>;
  totalUsers: number;
  totalCourses: number;
  lastSync: string;
  syncStatus: string;
  syncError?: string;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useOptimizedSync, setUseOptimizedSync] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'globallySuspended' | 'multipleCourses' | 'neverAccessed' | 'courseSuspended'>('overview');

  // Filtros para cada sección
  const globallySuspendedFilters = useDashboardFilters({
    data: stats?.globallySuspendedUsers || [],
    searchFields: ['firstName', 'lastName', 'username', 'email'],
    defaultSortBy: 'firstName',
    defaultSortOrder: 'asc'
  });

  const multipleCoursesFilters = useDashboardFilters({
    data: stats?.usersWithMultipleCourses || [],
    searchFields: ['firstName', 'lastName', 'username', 'email'],
    defaultSortBy: 'firstName',
    defaultSortOrder: 'asc'
  });

  const neverAccessedFilters = useDashboardFilters({
    data: stats?.neverAccessedUsers || [],
    searchFields: ['firstName', 'lastName', 'username', 'email'],
    defaultSortBy: 'firstName',
    defaultSortOrder: 'asc'
  });

  const courseSuspendedFilters = useDashboardFilters({
    data: stats?.courseSuspendedUsers || [],
    searchFields: ['courseName', 'courseShortName'],
    defaultSortBy: 'courseName',
    defaultSortOrder: 'asc'
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      window.location.href = '/admin/login';
      return;
    }
    fetchStats();
  }, [user]);

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Error al cargar las estadísticas');
      }
    } catch {
      setError('Error al cargar las estadísticas');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const syncData = async () => {
    try {
      setIsSyncing(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optimized: useOptimizedSync
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Recargar estadísticas después de la sincronización
        setTimeout(() => {
          fetchStats();
        }, 2000);
      } else {
        setError(data.error || 'Error en la sincronización');
      }
    } catch {
      setError('Error en la sincronización');
    } finally {
      setIsSyncing(false);
    }
  };



  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'in_progress':
        return 'En Progreso';
      case 'error':
        return 'Error';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const exportAllData = () => {
    if (!stats) {
      alert('No hay datos para exportar');
      return;
    }

    try {
      // Crear un archivo CSV con todos los datos combinados
      const allData = [];
      
      // Agregar resumen general como primera fila
      allData.push({
        'Tipo': 'RESUMEN GENERAL',
        'Total Usuarios': stats.totalUsers,
        'Total Cursos': stats.totalCourses,
        'Usuarios Suspendidos Globalmente': stats.globallySuspendedUsers.length,
        'Usuarios con Múltiples Cursos': stats.usersWithMultipleCourses.length,
        'Usuarios que Nunca Ingresaron': stats.neverAccessedUsers.length,
        'Cursos con Usuarios Suspendidos': stats.courseSuspendedUsers.length,
        'Última Sincronización': stats.lastSync ? new Date(stats.lastSync).toLocaleString('es-ES') : 'N/A'
      });
      
      // Agregar separador
      allData.push({
        'Tipo': '=== USUARIOS SUSPENDIDOS GLOBALMENTE ===',
        'ID Usuario': '',
        'Nombre de Usuario': '',
        'Nombre': '',
        'Apellido': '',
        'Email': '',
        'Fecha de Suspensión': ''
      });
      
      // Agregar usuarios suspendidos globalmente
      stats.globallySuspendedUsers.forEach(user => {
        allData.push({
          'Tipo': 'SUSPENDIDO GLOBAL',
          'ID Usuario': user.userId,
          'Nombre de Usuario': user.username,
          'Nombre': user.firstName,
          'Apellido': user.lastName,
          'Email': user.email,
          'Fecha de Suspensión': user.suspendedAt ? new Date(user.suspendedAt).toLocaleDateString('es-ES') + ' ' + new Date(user.suspendedAt).toLocaleTimeString('es-ES') : ''
        });
      });
      
      // Agregar separador
      allData.push({
        'Tipo': '=== USUARIOS CON MÚLTIPLES CURSOS ===',
        'ID Usuario': '',
        'Nombre de Usuario': '',
        'Nombre': '',
        'Apellido': '',
        'Email': '',
        'Cantidad de Cursos': '',
        'Cursos': ''
      });
      
      // Agregar usuarios con múltiples cursos
      stats.usersWithMultipleCourses.forEach(user => {
        allData.push({
          'Tipo': 'MÚLTIPLES CURSOS',
          'ID Usuario': user.userId,
          'Nombre de Usuario': user.username,
          'Nombre': user.firstName,
          'Apellido': user.lastName,
          'Email': user.email,
          'Cantidad de Cursos': user.courseCount,
          'Cursos': user.courses.map((course: { courseShortName?: string; courseName?: string }) => course.courseShortName || course.courseName || '').join('; ')
        });
      });
      
      // Agregar separador
      allData.push({
        'Tipo': '=== USUARIOS QUE NUNCA INGRESARON ===',
        'ID Usuario': '',
        'Nombre de Usuario': '',
        'Nombre': '',
        'Apellido': '',
        'Email': '',
        'Fecha de Creación': ''
      });
      
      // Agregar usuarios que nunca ingresaron
      stats.neverAccessedUsers.forEach(user => {
        allData.push({
          'Tipo': 'NUNCA INGRESÓ',
          'ID Usuario': user.userId,
          'Nombre de Usuario': user.username,
          'Nombre': user.firstName,
          'Apellido': user.lastName,
          'Email': user.email,
          'Fecha de Creación': user.createdAt ? new Date(user.createdAt).toLocaleDateString('es-ES') + ' ' + new Date(user.createdAt).toLocaleTimeString('es-ES') : ''
        });
      });
      
      // Crear y descargar el archivo CSV
      const csvContent = createCSV(allData);
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `dashboard-completo-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exportando todos los datos:', error);
      alert('Error al exportar los datos');
    }
  };

  const createCSV = (data: Array<Record<string, unknown>>) => {
    if (!data || data.length === 0) return '';
    
    const columns = Object.keys(data[0]);
    const header = columns.map(column => {
      const columnMap: { [key: string]: string } = {
        userId: 'ID Usuario',
        username: 'Nombre de Usuario',
        firstName: 'Nombre',
        lastName: 'Apellido',
        email: 'Email',
        suspendedAt: 'Fecha de Suspensión',
        suspendedBy: 'Suspendido Por',
        reason: 'Razón',
        courseCount: 'Cantidad de Cursos',
        courses: 'Cursos',
        createdAt: 'Fecha de Creación',
        lastAccess: 'Último Acceso',
        courseId: 'ID Curso',
        courseName: 'Nombre del Curso',
        courseShortName: 'Nombre Corto del Curso'
      };
      return columnMap[column] || column;
    }).join(',');

    const rows = data.map(item => {
      return columns.map(column => {
        let value = item[column];
        
        if (column === 'courses' && Array.isArray(value)) {
          value = value.map((course: { courseShortName?: string; courseName?: string }) => course.courseShortName || course.courseName || '').join('; ');
        } else if (column === 'suspendedAt' || column === 'createdAt') {
          if (value && typeof value === 'string') {
            const date = new Date(value);
            value = date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES');
          }
        } else if (column === 'lastAccess') {
          if (value && typeof value === 'number' && value !== 0) {
            const date = new Date(value * 1000);
            value = date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES');
          } else {
            value = 'Nunca';
          }
        } else if (value === null || value === undefined) {
          value = '';
        }
        
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    return [header, ...rows].join('\n');
  };

  /*
  const createCourseSuspendedCSV = (data: Array<Record<string, unknown>>) => {
    const rows: string[] = [];
    const header = 'Curso,Nombre del Curso,Código del Curso,ID Usuario,Nombre de Usuario,Nombre,Apellido,Email,Fecha de Suspensión,Suspendido Por,Razón';
    rows.push(header);
    
    data.forEach(course => {
      if (course.suspendedUsers && Array.isArray(course.suspendedUsers)) {
        course.suspendedUsers.forEach((user: any) => {
          const row = [
            course.courseId,
            course.courseName,
            course.courseShortName,
            user.userId,
            user.username,
            user.firstName,
            user.lastName,
            user.email,
            user.suspendedAt ? new Date(user.suspendedAt).toLocaleDateString('es-ES') + ' ' + new Date(user.suspendedAt).toLocaleTimeString('es-ES') : '',
            user.suspendedBy || '',
            user.reason || ''
          ].map(value => {
            const stringValue = String(value || '');
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          }).join(',');
          
          rows.push(row);
        });
      }
    });
    
    return rows.join('\n');
  };
  */

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard de Estadísticas
            </h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={useOptimizedSync}
                    onChange={(e) => setUseOptimizedSync(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Sincronización optimizada
                </label>
              </div>
              <Button
                onClick={syncData}
                disabled={isSyncing}
                className="px-6"
              >
                {isSyncing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sincronizando...
                  </>
                ) : (
                  '🔄 Sincronizar desde Moodle'
                )}
              </Button>
              <Button
                onClick={() => router.back()}
                variant="secondary"
                className="px-4"
              >
                ← Volver
              </Button>
            </div>

          </div>
          
          {/* Status Bar */}
          {stats && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(stats.syncStatus)}`}>
                      {getStatusLabel(stats.syncStatus)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Última sincronización:</span>
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">
                      {stats.lastSync ? formatDate(stats.lastSync) : 'Nunca'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Total usuarios: <span className="font-medium text-gray-900 dark:text-white">{stats.totalUsers}</span>
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Total cursos: <span className="font-medium text-gray-900 dark:text-white">{stats.totalCourses}</span>
                    </span>
                  </div>
                  <Button
                    onClick={() => exportAllData()}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 text-sm"
                  >
                    📁 Exportar Todo
                  </Button>
                </div>
              </div>
              {stats.syncError && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-700 dark:text-red-200">
                    <strong>Error:</strong> {stats.syncError}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 p-4 rounded-md">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Resumen', icon: '📊' },
              { id: 'globallySuspended', label: 'Usuarios Suspendidos Globales', icon: '🚫' },
              { id: 'multipleCourses', label: 'Usuarios con Múltiples Cursos', icon: '📚' },
              { id: 'neverAccessed', label: 'Usuarios que Nunca Ingresaron', icon: '⏰' },
              { id: 'courseSuspended', label: 'Usuarios Suspendidos por Curso', icon: '🎓' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'overview' | 'globallySuspended' | 'multipleCourses' | 'neverAccessed' | 'courseSuspended')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          {activeTab === 'overview' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Resumen General</h2>
                {stats && (
                  <DashboardExport
                    data={[
                      {
                        'Total Usuarios': stats.totalUsers,
                        'Total Cursos': stats.totalCourses,
                        'Usuarios Suspendidos Globalmente': stats.globallySuspendedUsers.length,
                        'Usuarios con Múltiples Cursos': stats.usersWithMultipleCourses.length,
                        'Usuarios que Nunca Ingresaron': stats.neverAccessedUsers.length,
                        'Cursos con Usuarios Suspendidos': stats.courseSuspendedUsers.length,
                        'Última Sincronización': stats.lastSync ? new Date(stats.lastSync).toLocaleString('es-ES') : 'N/A'
                      }
                    ]}
                    filename="resumen-general-dashboard"
                  />
                )}
              </div>
              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-red-50 dark:bg-red-900/30 p-6 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center">
                      <div className="p-2 bg-red-100 dark:bg-red-800 rounded-lg">
                        <span className="text-2xl">🚫</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">Suspendidos Globales</p>
                        <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                          {stats.globallySuspendedUsers.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/30 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                        <span className="text-2xl">📚</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Múltiples Cursos</p>
                        <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {stats.usersWithMultipleCourses.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/30 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
                        <span className="text-2xl">⏰</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Nunca Ingresaron</p>
                        <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                          {stats.neverAccessedUsers.length}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/30 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                        <span className="text-2xl">🎓</span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Cursos con Suspendidos</p>
                        <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                          {stats.courseSuspendedUsers.length}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles</p>
              )}
            </div>
          )}

          {activeTab === 'globallySuspended' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Usuarios Suspendidos Globalmente ({globallySuspendedFilters.filteredData.length})
                </h2>
                <DashboardExport
                  data={globallySuspendedFilters.filteredData}
                  filename="usuarios-suspendidos-globalmente"
                />
              </div>
              
              <DashboardFilters
                filters={globallySuspendedFilters.filters}
                onFiltersChange={globallySuspendedFilters.updateFilters}
                searchPlaceholder="Buscar por nombre, usuario o email..."
                sortOptions={[
                  { value: 'firstName', label: 'Nombre' },
                  { value: 'lastName', label: 'Apellido' },
                  { value: 'username', label: 'Usuario' },
                  { value: 'email', label: 'Email' },
                  { value: 'suspendedAt', label: 'Fecha de Suspensión' }
                ]}
                className="mb-6"
              />

              {globallySuspendedFilters.filteredData.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Fecha de Suspensión
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {globallySuspendedFilters.filteredData.map((user, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                @{user.username}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(user.suspendedAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  {globallySuspendedFilters.hasActiveFilters 
                    ? 'No se encontraron usuarios con los filtros aplicados' 
                    : 'No hay usuarios suspendidos globalmente'
                  }
                </p>
              )}
            </div>
          )}

          {activeTab === 'multipleCourses' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Usuarios con Múltiples Cursos ({multipleCoursesFilters.filteredData.length})
                </h2>
                <DashboardExport
                  data={multipleCoursesFilters.filteredData}
                  filename="usuarios-con-multiples-cursos"
                />
              </div>
              
              <DashboardFilters
                filters={multipleCoursesFilters.filters}
                onFiltersChange={multipleCoursesFilters.updateFilters}
                searchPlaceholder="Buscar por nombre, usuario o email..."
                sortOptions={[
                  { value: 'firstName', label: 'Nombre' },
                  { value: 'lastName', label: 'Apellido' },
                  { value: 'username', label: 'Usuario' },
                  { value: 'email', label: 'Email' },
                  { value: 'courseCount', label: 'Cantidad de Cursos' }
                ]}
                className="mb-6"
              />

              {multipleCoursesFilters.filteredData.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Cantidad de Cursos
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Cursos
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {multipleCoursesFilters.filteredData.map((user, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                @{user.username}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {user.courseCount} cursos
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {user.courses.map((course: { courseShortName: string; courseName: string }, courseIndex: number) => (
                                <div key={courseIndex} className="mb-1">
                                  <span className="font-medium">{course.courseShortName}</span>
                                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                                    - {course.courseName}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  {multipleCoursesFilters.hasActiveFilters 
                    ? 'No se encontraron usuarios con los filtros aplicados' 
                    : 'No hay usuarios con múltiples cursos'
                  }
                </p>
              )}
            </div>
          )}

          {activeTab === 'neverAccessed' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Usuarios que Nunca Ingresaron ({neverAccessedFilters.filteredData.length})
                </h2>
                <DashboardExport
                  data={neverAccessedFilters.filteredData}
                  filename="usuarios-que-nunca-ingresaron"
                />
              </div>
              
              <DashboardFilters
                filters={neverAccessedFilters.filters}
                onFiltersChange={neverAccessedFilters.updateFilters}
                searchPlaceholder="Buscar por nombre, usuario o email..."
                sortOptions={[
                  { value: 'firstName', label: 'Nombre' },
                  { value: 'lastName', label: 'Apellido' },
                  { value: 'username', label: 'Usuario' },
                  { value: 'email', label: 'Email' },
                  { value: 'createdAt', label: 'Fecha de Creación' }
                ]}
                className="mb-6"
              />

              {neverAccessedFilters.filteredData.length ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Fecha de Creación
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {neverAccessedFilters.filteredData.map((user, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                @{user.username}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {user.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(user.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  {neverAccessedFilters.hasActiveFilters 
                    ? 'No se encontraron usuarios con los filtros aplicados' 
                    : 'No hay usuarios que nunca hayan ingresado'
                  }
                </p>
              )}
            </div>
          )}

          {activeTab === 'courseSuspended' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Usuarios Suspendidos por Curso ({courseSuspendedFilters.filteredData.length})
                </h2>
                <DashboardExport
                  data={courseSuspendedFilters.filteredData}
                  filename="usuarios-suspendidos-por-curso"
                />
              </div>
              
              <DashboardFilters
                filters={courseSuspendedFilters.filters}
                onFiltersChange={courseSuspendedFilters.updateFilters}
                searchPlaceholder="Buscar por nombre del curso..."
                sortOptions={[
                  { value: 'courseName', label: 'Nombre del Curso' },
                  { value: 'courseShortName', label: 'Código del Curso' }
                ]}
                className="mb-6"
              />

              {courseSuspendedFilters.filteredData.length ? (
                <div className="space-y-6">
                  {courseSuspendedFilters.filteredData.map((course, courseIndex) => (
                    <div key={courseIndex} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {course.courseName} ({course.courseShortName})
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {course.suspendedUsers.length} usuarios suspendidos
                        </p>
                      </div>
                      <div className="p-4">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Usuario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                  Fecha de Suspensión
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                              {course.suspendedUsers.map((user: { firstName: string; lastName: string; username: string; email: string; suspendedAt: string }, userIndex: number) => (
                                <tr key={userIndex}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        {user.firstName} {user.lastName}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        @{user.username}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                    {user.email}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(user.suspendedAt)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  {courseSuspendedFilters.hasActiveFilters 
                    ? 'No se encontraron cursos con los filtros aplicados' 
                    : 'No hay usuarios suspendidos por curso'
                  }
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 