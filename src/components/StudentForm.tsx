import { useState } from 'react';
import { Button } from './ui/Button';
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
}

export function StudentForm({ onSubmit }: StudentFormProps) {
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
    } catch (err) {
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
      setFormData(prev => ({
        ...prev,
        document: value,
        password: generatedPassword,
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
              label="Nombre de Usuario"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="ej: stefano.santo, test.user"
              required
              className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Usa el formato: nombre.apellido (con punto)
            </p>
          </div>

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
              La contraseña se generará automáticamente
            </p>
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

        <Input
          label="Correo Electrónico"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Ingresa el correo electrónico"
          required
          className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
        />

        {/* Campo de contraseña generada automáticamente */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Contraseña Generada
          </label>
          <div className="relative">
            <Input
              name="password"
              type="text"
              value={formData.password}
              readOnly
              className="w-full pr-12 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-400"
              placeholder="Se generará automáticamente al ingresar el documento"
            />
            <button
              type="button"
              onClick={copyToClipboard}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              title="Copiar contraseña"
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-500 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Formato: Asd(documento)! - Se genera automáticamente al ingresar el documento
          </p>
          {copied && (
            <p className="text-xs text-green-600 dark:text-green-300">
              ✓ Contraseña copiada al portapapeles
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
          className="w-full py-3 text-lg font-semibold"
        >
          Crear Estudiante
        </Button>
      </form>
    </div>
  );
} 