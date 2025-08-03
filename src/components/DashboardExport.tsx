'use client';

import { Button } from './ui/Button';

interface ExportData {
  [key: string]: unknown;
}

interface DashboardExportProps {
  data: ExportData[];
  filename: string;
  disabled?: boolean;
  exportType?: 'neverAccessed' | 'multipleCourses' | 'globallySuspended' | 'courseSuspended' | 'overview';
}

export default function DashboardExport({ data, filename, disabled = false, exportType }: DashboardExportProps) {
  const exportToCSV = () => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    try {
      let csvContent = '';
      
      // Determinar el tipo de exportación basado en el exportType o en la estructura de datos
      if (exportType === 'courseSuspended' || (data[0] && data[0].courseId && data[0].suspendedUsers)) {
        csvContent = exportCourseSuspendedData(data);
      } else if (exportType === 'neverAccessed' || (data[0] && data[0].createdAt && !data[0].courseCount)) {
        csvContent = exportNeverAccessedData(data);
      } else if (exportType === 'multipleCourses' || (data[0] && data[0].courseCount)) {
        csvContent = exportMultipleCoursesData(data);
      } else if (exportType === 'globallySuspended' || (data[0] && data[0].suspendedAt && !data[0].courseId)) {
        csvContent = exportGloballySuspendedData(data);
      } else {
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

  const exportNeverAccessedData = (data: ExportData[]) => {
    // Para "Nunca ingresados": Sacar id, fecha de creación, agregar curso inscripto
    const columns = ['username', 'firstName', 'lastName', 'email', 'enrolledCourse'];
    
    const header = columns.map(column => {
      const columnMap: { [key: string]: string } = {
        username: 'DNI',
        firstName: 'Nombre',
        lastName: 'Apellido',
        email: 'Email',
        enrolledCourse: 'Curso Inscripto'
      };
      return columnMap[column] || column;
    }).join(',');

    const rows = data.map(item => {
      return columns.map(column => {
        let value = item[column];
        
        if (column === 'enrolledCourse') {
          // Buscar el curso en el que está inscripto (asumiendo que hay información de cursos)
          // Por ahora, dejamos vacío ya que no tenemos esa información en los datos actuales
          value = 'Por determinar';
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

  const exportMultipleCoursesData = (data: ExportData[]) => {
    // Para "Múltiples cursos": Nombre de usuario -> DNI, sacar ID, hacer cursos más amigables
    const columns = ['username', 'firstName', 'lastName', 'email', 'courseCount', 'courses'];
    
    const header = columns.map(column => {
      const columnMap: { [key: string]: string } = {
        username: 'DNI',
        firstName: 'Nombre',
        lastName: 'Apellido',
        email: 'Email',
        courseCount: 'Cantidad de Cursos',
        courses: 'Cursos Inscriptos'
      };
      return columnMap[column] || column;
    }).join(',');

    const rows = data.map(item => {
      return columns.map(column => {
        let value = item[column];
        
        if (column === 'courses' && Array.isArray(value)) {
          // Hacer los cursos más amigables: mostrar solo el nombre corto y el nombre completo
          value = value.map((course: { courseShortName?: string; courseName?: string }) => {
            const shortName = course.courseShortName || '';
            const fullName = course.courseName || '';
            return shortName && fullName ? `${shortName} - ${fullName}` : shortName || fullName;
          }).join(' | ');
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

  const exportGloballySuspendedData = (data: ExportData[]) => {
    // Para "Suspendidos globales": Nombre de usuario -> DNI, sacar ID
    const columns = ['username', 'firstName', 'lastName', 'email', 'suspendedAt'];
    
    const header = columns.map(column => {
      const columnMap: { [key: string]: string } = {
        username: 'DNI',
        firstName: 'Nombre',
        lastName: 'Apellido',
        email: 'Email',
        suspendedAt: 'Fecha de Suspensión'
      };
      return columnMap[column] || column;
    }).join(',');

    const rows = data.map(item => {
      return columns.map(column => {
        let value = item[column];
        
        if (column === 'suspendedAt') {
          if (value && typeof value === 'string') {
            const date = new Date(value);
            value = date.toLocaleDateString('es-ES') + ' ' + date.toLocaleTimeString('es-ES');
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

  const exportCourseSuspendedData = (data: ExportData[]) => {
    // Para "Usuarios suspendidos por curso": Nombre de usuario -> DNI
    const rows: string[] = [];
    
    // Encabezado
    const header = 'Curso,Nombre del Curso,Código del Curso,DNI,Nombre,Apellido,Email,Fecha de Suspensión,Suspendido Por,Razón';
    rows.push(header);
    
    // Procesar cada curso
    data.forEach(course => {
      if (course.suspendedUsers && Array.isArray(course.suspendedUsers)) {
        course.suspendedUsers.forEach((user: { userId: number; username: string; firstName: string; lastName: string; email: string; suspendedAt?: string; suspendedBy?: string; reason?: string }) => {
          const row = [
            course.courseId,
            course.courseName,
            course.courseShortName,
            user.username, // DNI
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