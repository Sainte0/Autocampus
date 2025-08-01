'use client';

import { Button } from './ui/Button';

interface ExportData {
  [key: string]: unknown;
}

interface DashboardExportProps {
  data: ExportData[];
  filename: string;
  disabled?: boolean;
}

export default function DashboardExport({ data, filename, disabled = false }: DashboardExportProps) {
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    try {
      // Determinar si es la sección de usuarios suspendidos por curso
      const isCourseSuspendedSection = data[0] && data[0].courseId && data[0].suspendedUsers;
      
      let csvContent = '';
      
      if (isCourseSuspendedSection) {
        // Formato especial para usuarios suspendidos por curso
        csvContent = exportCourseSuspendedData(data);
      } else {
        // Formato estándar para otras secciones
        csvContent = exportStandardData(data);
      }
      
      // Crear y descargar el archivo
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${filename}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Error exportando CSV:', error);
      alert('Error al exportar el archivo CSV');
    }
  };

  const exportStandardData = (data: ExportData[]) => {
    // Obtener las columnas del primer objeto
    const columns = Object.keys(data[0]);
      
      // Crear el encabezado CSV
      const header = columns.map(column => {
        // Convertir nombres de columnas a español y más legibles
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

      // Crear las filas CSV
      const rows = data.map(item => {
        return columns.map(column => {
          let value = item[column];
          
          // Manejar casos especiales
          if (column === 'courses' && Array.isArray(value)) {
            // Para cursos, mostrar solo los nombres cortos separados por punto y coma
            value = value.map((course: { courseShortName?: string; courseName?: string }) => course.courseShortName || course.courseName || '').join('; ');
          } else if (column === 'suspendedAt' || column === 'createdAt') {
            // Formatear fechas
            if (value && typeof value === 'string') {
              const date = new Date(value);
              value = date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES');
            }
          } else if (column === 'lastAccess') {
            // Formatear último acceso
            if (value && typeof value === 'number' && value !== 0) {
              const date = new Date(value * 1000); // Convertir timestamp a fecha
              value = date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES');
            } else {
              value = 'Nunca';
            }
          } else if (value === null || value === undefined) {
            value = '';
          }
          
          // Escapar comillas y envolver en comillas si contiene comas
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',');
      });

      // Combinar encabezado y filas
      return [header, ...rows].join('\n');
  };

  const exportCourseSuspendedData = (data: ExportData[]) => {
    // Para usuarios suspendidos por curso, crear una fila por cada usuario suspendido
    const rows: string[] = [];
    
    // Encabezado
    const header = 'Curso,Nombre del Curso,Código del Curso,ID Usuario,Nombre de Usuario,Nombre,Apellido,Email,Fecha de Suspensión,Suspendido Por,Razón';
    rows.push(header);
    
    // Procesar cada curso
    data.forEach(course => {
      if (course.suspendedUsers && Array.isArray(course.suspendedUsers)) {
        course.suspendedUsers.forEach((user: { userId: number; username: string; firstName: string; lastName: string; email: string; suspendedAt?: string; suspendedBy?: string; reason?: string }) => {
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

  return (
    <Button
      onClick={exportToCSV}
      disabled={disabled || !data || data.length === 0}
      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm"
    >
      📊 Exportar CSV
    </Button>
  );
} 