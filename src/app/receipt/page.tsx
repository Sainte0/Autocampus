'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

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
  const { darkMode } = useTheme();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

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

  const generatePDF = async () => {
    if (!receiptRef.current) return;

    setGeneratingPDF(true);
    
    try {
      // Importar html2pdf dinámicamente solo en el cliente
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Crear una copia del elemento para el PDF
      const element = receiptRef.current.cloneNode(true) as HTMLElement;
      
      // Aplicar estilos específicos para PDF
      element.style.width = '210mm';
      element.style.minHeight = '297mm';
      element.style.margin = '0';
      element.style.padding = '20mm';
      element.style.backgroundColor = darkMode ? '#1f2937' : '#ffffff';
      element.style.color = darkMode ? '#f9fafb' : '#111827';
      
      // Ocultar botones en el PDF
      const buttons = element.querySelectorAll('button');
      buttons.forEach(button => {
        button.style.display = 'none';
      });

      // Configuración del PDF
      const opt = {
        margin: 0,
        filename: `recibo_${receiptData?.studentFirstName}_${receiptData?.studentLastName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          backgroundColor: darkMode ? '#1f2937' : '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };

      // Generar el PDF
      await html2pdf().set(opt).from(element).save();
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Inténtalo de nuevo.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const goBack = () => {
    router.push('/courses');
  };

  if (isLoading || !receiptData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Main Content */}
        <div 
          ref={receiptRef}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
        >
          {/* Simple Header */}
          <div className="bg-green-500 text-white p-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">✅ Alumno Inscrito Exitosamente</h1>
              <p className="text-green-100">Curso: {receiptData.courseName}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Student Info - Simple Format */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                📋 Datos del Alumno
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Nombre:</span>
                  <span className="text-gray-900 dark:text-white">{receiptData.studentFirstName} {receiptData.studentLastName}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                  <span className="text-gray-900 dark:text-white">{receiptData.studentEmail}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Documento:</span>
                  <span className="text-gray-900 dark:text-white">{receiptData.studentDocument}</span>
                </div>
              </div>
            </div>

            {/* Course Info */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                📚 Curso
              </h2>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded">
                <p className="font-medium text-gray-900 dark:text-white">{receiptData.courseName}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Código: {receiptData.courseShortName}</p>
              </div>
            </div>

            {/* Credentials - Easy to Copy */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                🔑 Credenciales de Acceso
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Usuario:</span>
                    <button
                      onClick={() => copyToClipboard(receiptData.studentUsername, 'username')}
                      className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      {copiedField === 'username' ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <div className="bg-white dark:bg-gray-700 p-2 rounded border border-gray-300 dark:border-gray-600 font-mono text-lg">
                    {receiptData.studentUsername}
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 rounded border border-yellow-200 dark:border-yellow-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Contraseña:</span>
                    <button
                      onClick={() => copyToClipboard(receiptData.studentPassword, 'password')}
                      className="text-sm bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      {copiedField === 'password' ? '✓ Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <div className="bg-white dark:bg-gray-700 p-2 rounded border border-gray-300 dark:border-gray-600 font-mono text-lg">
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
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
                Copia todos los datos para enviar al alumno por mensaje privado
              </p>
            </div>

            {/* Simple Notice */}
            <div className="bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-500 p-4 rounded mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>💡 Tip:</strong> Copia los datos y envíalos al alumno por WhatsApp, email o mensaje privado.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={generatePDF}
                disabled={generatingPDF}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400 text-white px-4 py-2 rounded font-medium transition-colors duration-200"
              >
                {generatingPDF ? '🔄 Generando PDF...' : '📄 Descargar PDF'}
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