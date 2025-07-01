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

  const copyAllData = async () => {
    const allData = `DATOS DEL ALUMNO INSCRITO

Nombre: ${receiptData?.studentFirstName} ${receiptData?.studentLastName}
Email: ${receiptData?.studentEmail}
Documento: ${receiptData?.studentDocument}

CURSO: ${receiptData?.courseName} (${receiptData?.courseShortName})

CREDENCIALES DE ACCESO:
Usuario: ${receiptData?.studentUsername}
Contraseña: ${receiptData?.studentPassword}

Fecha de inscripción: ${receiptData?.enrollmentDate ? new Date(receiptData.enrollmentDate).toLocaleString('es-ES') : 'N/A'}
Inscrito por: ${user?.firstName} ${user?.lastName}`;

    try {
      await navigator.clipboard.writeText(allData);
      setCopiedField('all');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Error copying all data:', error);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto">
        {/* Print Header */}
        <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Datos del Alumno Inscrito</h1>
          <p className="text-gray-600">Fecha: {new Date().toLocaleDateString('es-ES')}</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden print:shadow-none">
          {/* Simple Header */}
          <div className="bg-green-500 text-white p-6 print:bg-green-500">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">✅ Alumno Inscrito Exitosamente</h1>
              <p className="text-green-100">Curso: {receiptData.courseName}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Student Info - Simple Format */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                📋 Datos del Alumno
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">Nombre:</span>
                  <span className="text-gray-900">{receiptData.studentFirstName} {receiptData.studentLastName}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">Email:</span>
                  <span className="text-gray-900">{receiptData.studentEmail}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="font-medium text-gray-700">Documento:</span>
                  <span className="text-gray-900">{receiptData.studentDocument}</span>
                </div>
              </div>
            </div>

            {/* Course Info */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                📚 Curso
              </h2>
              <div className="p-3 bg-blue-50 rounded">
                <p className="font-medium text-gray-900">{receiptData.courseName}</p>
                <p className="text-sm text-gray-600">Código: {receiptData.courseShortName}</p>
              </div>
            </div>

            {/* Credentials - Easy to Copy */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                🔑 Credenciales de Acceso
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 rounded border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Usuario:</span>
                    <button
                      onClick={() => copyToClipboard(receiptData.studentUsername, 'username')}
                      className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      {copiedField === 'username' ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <div className="bg-white p-2 rounded border font-mono text-lg">
                    {receiptData.studentUsername}
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 rounded border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Contraseña:</span>
                    <button
                      onClick={() => copyToClipboard(receiptData.studentPassword, 'password')}
                      className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      {copiedField === 'password' ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <div className="bg-white p-2 rounded border font-mono text-lg">
                    {receiptData.studentPassword}
                  </div>
                </div>
              </div>
            </div>

            {/* Copy All Button */}
            <div className="mb-6">
              <button
                onClick={copyAllData}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                {copiedField === 'all' ? '✓ Datos Copiados' : '📋 Copiar Todos los Datos'}
              </button>
              <p className="text-sm text-gray-600 mt-2 text-center">
                Copia todos los datos para enviar al alumno por mensaje privado
              </p>
            </div>

            {/* Simple Notice */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Copia los datos y envíalos al alumno por WhatsApp, email o mensaje privado.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 print:hidden">
              <button
                onClick={printReceipt}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium"
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={goBack}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded font-medium"
              >
                ← Volver
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <ReceiptContent />
    </Suspense>
  );
} 