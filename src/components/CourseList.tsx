import { useState } from 'react';
import { MoodleCourse } from '../types/moodle';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { searchUsers } from '../lib/moodle';

interface CourseListProps {
  courses: MoodleCourse[];
  onEnroll: (courseId: number, username: string) => Promise<{ success: boolean; error?: string }>;
}

interface FoundUser {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
}

// Función para extraer las siglas del nombre del curso
const extractCourseAcronym = (shortname: string): string => {
  // Buscar patrones al inicio de la descripción como "DCYC3-24/09/2024", "AMJ1-LUN-10/03/2025", "EEA1_Mie15.30HS_29/01/2025", "eba1_25/02/2025"
  
  // Patrón 1: Siglas seguidas de guión (DCYC3-24/09/2024, AMJ1-LUN-10/03/2025)
  const dashPattern = shortname.match(/^([A-Z]{2,4}\d*)-/);
  if (dashPattern) {
    return dashPattern[1].toUpperCase();
  }
  
  // Patrón 2: Siglas seguidas de guión bajo (EEA1_Mie15.30HS_29/01/2025)
  const underscorePattern = shortname.match(/^([A-Z]{2,4}\d*)_/);
  if (underscorePattern) {
    return underscorePattern[1].toUpperCase();
  }
  
  // Patrón 3: Siglas en minúsculas seguidas de guión bajo (eba1_25/02/2025)
  const lowercasePattern = shortname.match(/^([a-z]{2,4}\d*)_/);
  if (lowercasePattern) {
    return lowercasePattern[1].toUpperCase();
  }
  
  // Patrón 4: Buscar al inicio cualquier combinación de letras y números (2-4 caracteres)
  const generalPattern = shortname.match(/^([A-Za-z]{2,4}\d*)/);
  if (generalPattern) {
    return generalPattern[1].toUpperCase();
  }
  
  return '';
};

// Función para determinar si un curso está activo
const isCourseActive = (fullname: string): boolean => {
  // Un curso se considera activo si contiene "[🟢 Activo]" o no contiene indicadores de finalización
  if (fullname.includes('[🟢 Activo]')) {
    return true;
  }
  
  if (fullname.includes('[🔴 Finalizado]') || 
      fullname.includes('[Finalizado]') || 
      fullname.toLowerCase().includes('finalizado') || 
      fullname.toLowerCase().includes('terminado') ||
      fullname.toLowerCase().includes('completado')) {
    return false;
  }
  
  // Por defecto, si no hay indicadores claros, consideramos activo
  return true;
};

export function CourseList({ courses, onEnroll }: CourseListProps) {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAcronym, setSelectedAcronym] = useState<string>('all');
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [foundUsers, setFoundUsers] = useState<FoundUser[]>([]);

  // Extraer siglas únicas de los cursos
  const courseAcronyms = Array.from(new Set(
    courses.map(course => extractCourseAcronym(course.shortname)).filter(acronym => acronym)
  )).sort();

  // Filtrar y ordenar cursos
  const filteredAndSortedCourses = courses
    .filter(course => {
      const matchesSearch = course.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.shortname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           extractCourseAcronym(course.shortname).toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAcronym = selectedAcronym === 'all' || extractCourseAcronym(course.shortname) === selectedAcronym;
      
      const matchesActiveFilter = !showOnlyActive || isCourseActive(course.fullname);
      
      return matchesSearch && matchesAcronym && matchesActiveFilter;
    })
    .sort((a, b) => {
      // Primero ordenar por estado activo/inactivo
      const aActive = isCourseActive(a.fullname);
      const bActive = isCourseActive(b.fullname);
      
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      // Luego ordenar alfabéticamente por nombre
      return a.fullname.localeCompare(b.fullname);
    });

  const handleEnroll = async (courseId: number) => {
    if (!username.trim()) {
      setError('Por favor, ingrese un nombre de usuario');
      return;
    }

    if (!selectedCourse) {
      setError('Por favor, seleccione un curso');
      return;
    }

    console.log('Iniciando inscripción:', { courseId, username: username.trim() });

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await onEnroll(courseId, username.trim());
      console.log('Respuesta de inscripción:', response);
      
      if (response.success) {
        setSuccess('Usuario inscrito exitosamente en el curso');
        setUsername(''); // Limpiar el campo de usuario
        setSelectedCourse(null); // Limpiar la selección del curso
      } else {
        setError(response.error || 'Error al inscribir al usuario');
      }
    } catch (error) {
      console.error('Error en handleEnroll:', error);
      setError(error instanceof Error ? error.message : 'Error al inscribir al usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async () => {
    if (!username.trim()) {
      setError('Por favor, ingrese un término de búsqueda');
      return;
    }

    try {
      setSearchingUsers(true);
      setError(null);
      setFoundUsers([]);

      const response = await searchUsers(username.trim());
      
      if (response.success && response.data) {
        setFoundUsers(response.data);
        if (response.data.length === 0) {
          setError('No se encontraron usuarios con ese término');
        }
      } else {
        setError(response.error || 'Error al buscar usuarios');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error al buscar usuarios');
    } finally {
      setSearchingUsers(false);
    }
  };

  const selectUser = (user: FoundUser) => {
    setUsername(user.username);
    setFoundUsers([]);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 space-y-8">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Inscribir Alumno en Curso</h2>
        
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

        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Seleccionar Curso
            </label>
            <select
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-400"
              value={selectedCourse || ''}
              onChange={(e) => {
                const courseId = Number(e.target.value);
                console.log('Curso seleccionado:', courseId);
                setSelectedCourse(courseId);
              }}
            >
              <option value="">Selecciona un curso</option>
              {filteredAndSortedCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.fullname}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Nombre de Usuario del Alumno
            </label>
            <div className="flex gap-2">
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa el nombre de usuario o busca por nombre/email"
                className="flex-1 p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
              />
              <Button
                onClick={handleSearchUsers}
                variant="secondary"
                isLoading={searchingUsers}
                className="px-4"
              >
                Buscar
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ingresa el nombre de usuario exacto o busca por nombre/email para encontrar usuarios existentes
            </p>
            
            {foundUsers.length > 0 && (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Usuarios encontrados:</p>
                <div className="space-y-1">
                  {foundUsers.map((user, index) => (
                    <button
                      key={index}
                      onClick={() => selectUser(user)}
                      className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-sm text-gray-900 dark:text-gray-100"
                    >
                      <div className="font-medium">{user.username}</div>
                      <div className="text-gray-600 dark:text-gray-400">{user.firstname} {user.lastname} ({user.email})</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={() => selectedCourse && handleEnroll(selectedCourse)}
            variant="primary"
            isLoading={loading}
            className="w-full py-3 text-lg font-semibold"
            disabled={!selectedCourse || !username.trim()}
          >
            Inscribir Alumno
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Buscar Curso
            </label>
            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, código o siglas..."
                className="w-full p-3 pl-9 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Filtrar por Siglas
            </label>
            <select
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-400"
              value={selectedAcronym}
              onChange={(e) => setSelectedAcronym(e.target.value)}
            >
              <option value="all">Todas las siglas</option>
              {courseAcronyms.map((acronym) => (
                <option key={acronym} value={acronym}>
                  {acronym}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Estado del Curso
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showOnlyActive}
                  onChange={(e) => setShowOnlyActive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-200">
                  Solo activos
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Botón para limpiar filtros */}
        {(searchTerm || selectedAcronym !== 'all' || !showOnlyActive) && (
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setSearchTerm('');
                setSelectedAcronym('all');
                setShowOnlyActive(true);
              }}
              variant="secondary"
              className="px-4 py-2"
            >
              Limpiar Filtros
            </Button>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Cursos Disponibles</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredAndSortedCourses.length} {filteredAndSortedCourses.length === 1 ? 'curso' : 'cursos'} encontrados
            </span>
          </div>
          <div className="grid gap-6">
            {filteredAndSortedCourses.map((course) => {
              const acronym = extractCourseAcronym(course.shortname);
              const isActive = isCourseActive(course.fullname);
              
              // Limpiar el nombre del curso removiendo los indicadores de estado al inicio
              const cleanCourseName = course.fullname
                .replace(/^\[🟢 Activo\]\s*-\s*/, '') // Remover "[🟢 Activo] - "
                .replace(/^\[🔴 Finalizado\]\s*-\s*/, '') // Remover "[🔴 Finalizado] - "
                .replace(/^\[Finalizado\]\s*-\s*/, ''); // Remover "[Finalizado] - "
              
              return (
                <div
                  key={course.id}
                  className={`group relative bg-white border rounded-xl hover:border-blue-500 hover:shadow-lg transition-all duration-200 overflow-hidden ${
                    isActive 
                      ? 'border-gray-200' 
                      : 'border-gray-300 bg-gray-50 dark:bg-gray-700'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                    isActive 
                      ? 'from-blue-50 to-transparent' 
                      : 'from-gray-50 to-transparent'
                  }`} />
                  <div className="relative p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          {acronym && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {acronym}
                            </span>
                          )}
                          {!isActive && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                              🔴 Finalizado
                            </span>
                          )}
                          {isActive && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              🟢 Activo
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900 truncate">
                          {cleanCourseName}
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">
                          {course.shortname}
                        </p>
                        <div className="mt-3 flex items-center space-x-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            ID: {course.id}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <svg
                          className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredAndSortedCourses.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-2 text-gray-500">No se encontraron cursos que coincidan con los filtros</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 