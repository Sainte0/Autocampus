import { useState } from 'react';
import { Input } from './ui/Input';

interface StudentFormProps {
  onSubmit: (studentData: {
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    document: string;
  }) => Promise<void>;
  token?: string;
}

interface DuplicateResults {
  usernameExists: boolean;
  emailExists: boolean;
  nameExists: boolean;
  errors: string[];
  existingUsers: Array<{
    firstname: string;
    lastname: string;
    username: string;
    email: string;
  }>;
}

export function StudentForm({ onSubmit, token }: StudentFormProps) {
  const [formData, setFormData] = useState({
    username: '',
    firstname: '',
    lastname: '',
    email: '',
    document: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateResults, setDuplicateResults] = useState<DuplicateResults | null>(null);

  const checkDuplicates = async () => {
    if (!formData.email || !formData.firstname || !formData.lastname || !formData.document) {
      setError('Por favor, complete todos los campos antes de verificar duplicados');
      return;
    }

    setCheckingDuplicates(true);
    setError(null);
    setDuplicateResults(null);

    try {
      const response = await fetch('/api/users/check-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          firstname: formData.firstname,
          lastname: formData.lastname,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setDuplicateResults(data.results);
        if (data.hasDuplicates) {
          setError(`Se encontraron duplicados: ${data.results.errors.join(', ')}`);
        } else {
          setError(null);
        }
      } else {
        setError(data.error || 'Error al verificar duplicados');
      }
    } catch (err) {
      console.error('Error al verificar duplicados:', err);
      setError('Error al verificar duplicados');
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        ...formData,
        document: formData.document,
      });
      setFormData({
        username: '',
        firstname: '',
        lastname: '',
        email: '',
        document: '',
        password: '',
      });
      setDuplicateResults(null);
    } catch (err) {
      console.error('Error al crear el estudiante:', err);
      setError(err instanceof Error ? err.message : 'Error al crear el estudiante');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'document') {
      // Generar contraseña automáticamente cuando se ingresa el documento
      const generatedPassword = `Asd${value}!`;
      
      // Generar usuario automáticamente si ya tenemos el apellido
      let generatedUsername = '';
      if (formData.lastname && value) {
        // Convertir apellido a minúsculas y remover acentos
        const cleanLastName = formData.lastname
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remover acentos
          .replace(/[^a-z0-9]/g, ''); // Solo letras y números
        
        // Generar usuario con formato: documento.apellido
        generatedUsername = `${value}.${cleanLastName}`;
      }
      
      setFormData(prev => ({
        ...prev,
        document: value,
        password: generatedPassword,
        username: generatedUsername,
      }));
    } else if (name === 'lastname') {
      // Generar usuario automáticamente cuando se ingresa el apellido
      let generatedUsername = '';
      if (value && formData.document) {
        // Convertir apellido a minúsculas y remover acentos
        const cleanLastName = value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remover acentos
          .replace(/[^a-z0-9]/g, ''); // Solo letras y números
        
        // Generar usuario con formato: documento.apellido
        generatedUsername = `${formData.document}.${cleanLastName}`;
      }
      
      setFormData(prev => ({
        ...prev,
        lastname: value,
        username: generatedUsername,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formData.password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  const copyUsernameToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formData.username);
      setCopiedUsername(true);
      setTimeout(() => setCopiedUsername(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Crear Nuevo Estudiante</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 dark:border-red-400 rounded-md">
          <p className="text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Input
              label="Número de Documento"
              name="document"
              value={formData.document}
              onChange={handleChange}
              placeholder="Ingresa el número de documento"
              required
              className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              El usuario y contraseña se generarán automáticamente
            </p>
          </div>

          <div className="space-y-2">
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="ej: estudiante@ejemplo.com"
              required
              className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Nombre"
            name="firstname"
            value={formData.firstname}
            onChange={handleChange}
            placeholder="Ingresa el nombre"
            required
            className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
          />

          <Input
            label="Apellido"
            name="lastname"
            value={formData.lastname}
            onChange={handleChange}
            placeholder="Ingresa el apellido"
            required
            className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
          />
        </div>

        {/* Botón de verificación de duplicados */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={checkDuplicates}
            disabled={checkingDuplicates || !formData.email || !formData.firstname || !formData.lastname || !formData.document}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
          >
            {checkingDuplicates ? 'Verificando...' : 'Verificar Duplicados'}
          </button>
        </div>

        {/* Mostrar resultados de duplicados */}
        {duplicateResults && (
          <div className={`p-4 rounded-lg border ${
            duplicateResults.usernameExists || duplicateResults.emailExists || duplicateResults.nameExists
              ? 'bg-red-50 dark:bg-red-900/30 border-red-500 dark:border-red-400'
              : 'bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-400'
          }`}>
            <h4 className={`font-medium mb-2 ${
              duplicateResults.usernameExists || duplicateResults.emailExists || duplicateResults.nameExists
                ? 'text-red-800 dark:text-red-200'
                : 'text-green-800 dark:text-green-200'
            }`}>
              {duplicateResults.usernameExists || duplicateResults.emailExists || duplicateResults.nameExists
                ? 'Se encontraron duplicados:'
                : 'No se encontraron duplicados'}
            </h4>
            {duplicateResults.errors.length > 0 && (
              <ul className="list-disc list-inside space-y-1">
                {duplicateResults.errors.map((error: string, index: number) => (
                  <li key={index} className={`text-sm ${
                    duplicateResults.usernameExists || duplicateResults.emailExists || duplicateResults.nameExists
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-green-700 dark:text-green-300'
                  }`}>{error}</li>
                ))}
              </ul>
            )}
            {duplicateResults.existingUsers.length > 0 && (
              <div className="mt-3">
                <h5 className={`font-medium mb-2 ${
                  duplicateResults.usernameExists || duplicateResults.emailExists || duplicateResults.nameExists
                    ? 'text-red-800 dark:text-red-200'
                    : 'text-green-800 dark:text-green-200'
                }`}>Usuarios existentes:</h5>
                <div className="space-y-1">
                  {duplicateResults.existingUsers.map((user, index: number) => (
                    <div key={index} className="text-sm bg-white dark:bg-gray-700 p-2 rounded border border-gray-200 dark:border-gray-600">
                      <span className="text-gray-900 dark:text-gray-100">
                        <strong>{user.firstname} {user.lastname}</strong> (@{user.username}) - {user.email}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Credenciales generadas automáticamente */}
        {(formData.username || formData.password) && (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
              Credenciales Generadas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Input
                  label="Nombre de Usuario"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Se genera automáticamente"
                  required
                  readOnly
                  className="w-full bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                />
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Formato: documento.apellido
                  </p>
                  {formData.username && (
                    <button
                      type="button"
                      onClick={copyUsernameToClipboard}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium"
                    >
                      {copiedUsername ? '¡Copiado!' : 'Copiar usuario'}
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Input
                  label="Contraseña"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Contraseña generada automáticamente"
                  required
                  readOnly
                  className="w-full bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600"
                />
                <div className="flex items-center space-x-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Formato: Asd{formData.document}!
                  </p>
                  {formData.password && (
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-medium"
                    >
                      {copied ? '¡Copiado!' : 'Copiar contraseña'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || (duplicateResults ? (duplicateResults.usernameExists || duplicateResults.emailExists || duplicateResults.nameExists) : false)}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
        >
          {loading ? 'Creando estudiante...' : 'Crear Estudiante'}
        </button>
      </form>
    </div>
  );
} 