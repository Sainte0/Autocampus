'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StudentForm } from '../../components/StudentForm';
import { createUser, enrollUser } from '../../lib/moodle';

export default function StudentsPage() {
  const { user, isLoading, token } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setIsAuthorized(true);
    }
  }, [user, isLoading]);

  const logActivity = async (action: string, details: any) => {
    try {
      await fetch('/api/activities/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ action, details }),
      });
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
  }) => {
    setError(null);
    setSuccess(null);

    try {
      // Create student in Moodle
      const createResponse = await createUser(data);
      
      if (!createResponse.success) {
        throw new Error(createResponse.error || 'Error al crear el estudiante');
      }

      // Log the activity
      await logActivity('create_student', {
        studentUsername: data.username,
        studentName: `${data.firstname} ${data.lastname}`,
        moodleUserId: createResponse.data?.[0]?.id,
      });

      setSuccess(`Estudiante ${data.firstname} ${data.lastname} creado exitosamente`);
      
      // Reset form
      return Promise.resolve();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al crear el estudiante';
      setError(errorMessage);
      throw err;
    }
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
      <div className="max-w-4xl mx-auto">
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
            Crea nuevos alumnos y gestiona sus inscripciones en Moodle
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Conectado como: {user?.firstName} {user?.lastName} (@{user?.username})
          </p>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
            <p className="text-red-700 dark:text-gray-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
            <p className="text-green-700 dark:text-gray-200">{success}</p>
          </div>
        )}
        
        <StudentForm onSubmit={handleCreateStudent} />
      </div>
    </div>
  );
} 