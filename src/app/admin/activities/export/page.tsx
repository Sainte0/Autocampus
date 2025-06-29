'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { ActivityNavigation } from '../../../../components/ActivityNavigation';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';

interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters: {
    action: string;
    status: string;
    userId: string;
  };
  includeDetails: boolean;
}

export default function ActivityExportPage() {
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    dateRange: {
      startDate: '',
      endDate: '',
    },
    filters: {
      action: '',
      status: '',
      userId: '',
    },
    includeDetails: true,
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      window.location.href = '/admin/login';
      return;
    }
  }, [user]);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const params = new URLSearchParams({
        format: exportOptions.format,
        includeDetails: exportOptions.includeDetails.toString(),
        ...(exportOptions.dateRange.startDate && { startDate: exportOptions.dateRange.startDate }),
        ...(exportOptions.dateRange.endDate && { endDate: exportOptions.dateRange.endDate }),
        ...(exportOptions.filters.action && { action: exportOptions.filters.action }),
        ...(exportOptions.filters.status && { status: exportOptions.filters.status }),
        ...(exportOptions.filters.userId && { userId: exportOptions.filters.userId }),
      });

      const response = await fetch(`/api/activities/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al exportar las actividades');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `activities-${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess(`Archivo exportado exitosamente: ${filename}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al exportar las actividades');
    } finally {
      setIsLoading(false);
    }
  };

  const getFileExtension = (format: string) => {
    switch (format) {
      case 'csv':
        return '.csv';
      case 'json':
        return '.json';
      case 'xlsx':
        return '.xlsx';
      default:
        return '.csv';
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'csv':
        return 'Archivo CSV compatible con Excel y otras hojas de cálculo';
      case 'json':
        return 'Archivo JSON con todos los datos estructurados';
      case 'xlsx':
        return 'Archivo Excel nativo con formato y estilos';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Exportar Actividades</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Exporta el registro de actividades en diferentes formatos para análisis externo
          </p>
        </div>

        <ActivityNavigation />

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 rounded-md">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border-l-4 border-green-500 dark:border-green-400 rounded-md">
            <p className="text-green-700 dark:text-green-200">{success}</p>
          </div>
        )}

        {/* Export Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
          {/* Format Selection */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Formato de Exportación</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['csv', 'json', 'xlsx'] as const).map((format) => (
                <div
                  key={format}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    exportOptions.format === format
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                  onClick={() => setExportOptions({ ...exportOptions, format })}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-medium text-gray-900 dark:text-white uppercase">
                      {format}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {getFileExtension(format)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {getFormatDescription(format)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Rango de Fechas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Fecha de Inicio
                </label>
                <Input
                  type="date"
                  value={exportOptions.dateRange.startDate}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    dateRange: { ...exportOptions.dateRange, startDate: e.target.value }
                  })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Fecha de Fin
                </label>
                <Input
                  type="date"
                  value={exportOptions.dateRange.endDate}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    dateRange: { ...exportOptions.dateRange, endDate: e.target.value }
                  })}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Deja vacío para exportar todas las actividades
            </p>
          </div>

          {/* Filters */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Filtros</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Tipo de Acción
                </label>
                <select
                  value={exportOptions.filters.action}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    filters: { ...exportOptions.filters, action: e.target.value }
                  })}
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
                  value={exportOptions.filters.status}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    filters: { ...exportOptions.filters, status: e.target.value }
                  })}
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
                  Usuario (opcional)
                </label>
                <Input
                  value={exportOptions.filters.userId}
                  onChange={(e) => setExportOptions({
                    ...exportOptions,
                    filters: { ...exportOptions.filters, userId: e.target.value }
                  })}
                  placeholder="ID del usuario"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Opciones</h2>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="includeDetails"
                checked={exportOptions.includeDetails}
                onChange={(e) => setExportOptions({
                  ...exportOptions,
                  includeDetails: e.target.checked
                })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="includeDetails" className="text-sm text-gray-700 dark:text-gray-200">
                Incluir detalles completos (datos de cambios, información adicional)
              </label>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Desmarca esta opción para obtener un archivo más compacto con solo información básica
            </p>
          </div>

          {/* Export Button */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={handleExport}
              variant="primary"
              isLoading={isLoading}
              className="w-full py-3 text-lg font-semibold"
            >
              {isLoading ? 'Exportando...' : `Exportar Actividades (${exportOptions.format.toUpperCase()})`}
            </Button>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
              El archivo se descargará automáticamente cuando esté listo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 