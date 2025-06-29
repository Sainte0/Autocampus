'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface ReceiptData {
  studentUsername: string;
  studentName: string;
  studentEmail: string;
  studentFirstName: string;
  studentLastName: string;
  studentDocument: string;
  studentPassword: string;
  courseId: number;
  courseName: string;
  courseShortName: string;
  enrollmentDate: string;
  enrollmentId: string;
}

function ReceiptContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      
      // Get receipt data from URL parameters
      const data = searchParams.get('data');
      if (data) {
        try {
          const decodedData = JSON.parse(decodeURIComponent(data));
          setReceiptData(decodedData);
        } catch (error) {
          console.error('Error parsing receipt data:', error);
          router.push('/courses');
        }
      } else {
        router.push('/courses');
      }
    }
  }, [user, isLoading, searchParams, router]);

  const copyToClipboard = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  const goBack = () => {
    router.push('/courses');
  };

  if (isLoading || !receiptData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando recibo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto">
        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AutoCampus - Recibo de Inscripción</h1>
          <p className="text-gray-600">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
        </div>

        {/* Receipt Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden print:shadow-none">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 print:bg-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">✅ Inscripción Exitosa</h1>
                <p className="text-blue-100">El estudiante ha sido inscrito correctamente al curso</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">#{receiptData.enrollmentId}</div>
                <div className="text-blue-100 text-sm">ID de Inscripción</div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Course Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Información del Curso
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre del Curso
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {receiptData.courseName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Código del Curso
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {receiptData.courseShortName}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Información del Estudiante
              </h2>
              <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre Completo
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {receiptData.studentFirstName} {receiptData.studentLastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {receiptData.studentEmail}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Documento
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {receiptData.studentDocument}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Credentials Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Credenciales de Acceso
              </h2>
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded-lg p-6">
                <div className="space-y-4">
                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Usuario
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3">
                        <code className="text-lg font-mono text-gray-900 dark:text-white">
                          {receiptData.studentUsername}
                        </code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(receiptData.studentUsername, 'username')}
                        className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                      >
                        {copiedField === 'username' ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contraseña
                    </label>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3">
                        <code className="text-lg font-mono text-gray-900 dark:text-white">
                          {receiptData.studentPassword}
                        </code>
                      </div>
                      <button
                        onClick={() => copyToClipboard(receiptData.studentPassword, 'password')}
                        className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                      >
                        {copiedField === 'password' ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enrollment Details */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Detalles de la Inscripción
              </h2>
              <div className="bg-orange-50 dark:bg-orange-900/30 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fecha de Inscripción
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {new Date(receiptData.enrollmentDate).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Inscrito por
                    </label>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {user?.firstName} {user?.lastName} (@{user?.username})
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-500 dark:border-yellow-400 p-4 rounded-md mb-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-500 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Información Importante
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                    <p>
                      <strong>Guarda estas credenciales de forma segura.</strong> El estudiante necesitará el usuario y contraseña para acceder al curso en Moodle.
                    </p>
                    <p className="mt-1">
                      Se recomienda enviar estas credenciales al estudiante por un medio seguro y privado.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 print:hidden">
              <button
                onClick={printReceipt}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                <span>Imprimir Constancia de Inscripción</span>
              </button>
              <button
                onClick={goBack}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Volver a Cursos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando recibo...</div>}>
      <ReceiptContent />
    </Suspense>
  );
} 