import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-3 mb-4 md:mb-0">
            <Image
              src="/asd.jpeg"
              alt="Logo ASD"
              width={40}
              height={40}
              className="rounded-lg bg-white p-1 shadow-md"
            />
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                AutoCampus
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sistema de Gestión de Moodle
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <Link
              href="https://campus.asd.edu.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Campus Virtual ASD
            </Link>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              © 2024 ASD. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 