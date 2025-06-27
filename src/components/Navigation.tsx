'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useState, useEffect } from 'react';

export default function Navigation() {
  const { user, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Evitar hidratación incorrecta
  if (!mounted) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white dark:bg-blue-950 shadow-sm border-b dark:border-blue-900 transition-colors duration-300 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo y título */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <Image
                src="/asd.jpeg"
                alt="Logo ASD"
                width={40}
                height={40}
                className="rounded-lg bg-white p-1 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-2"
              />
              <span className="font-bold text-lg text-blue-900 dark:text-white tracking-wide transition-colors duration-300">
                AutoCampus
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            <Link
              href="https://campus.asd.edu.ar/login/index.php"
              target="_blank"
              rel="noopener"
              className="bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 py-2 rounded-md font-semibold shadow hover:scale-105 hover:from-blue-800 hover:to-blue-600 transition-all duration-200"
            >
              Ir al Campus
            </Link>
            {user ? (
              <>
                <Link
                  href="/students"
                  className="text-gray-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Alumnos
                </Link>
                <Link
                  href="/courses"
                  className="text-gray-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Cursos
                </Link>
                {user.role === 'admin' && (
                  <>
                    <Link
                      href="/admin/users"
                      className="text-gray-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Usuarios
                    </Link>
                    <Link
                      href="/admin/activities"
                      className="text-gray-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Actividades
                    </Link>
                  </>
                )}
                <div className="flex items-center gap-2 ml-2">
                  <span className="text-xs text-gray-500 dark:text-blue-200 font-medium hidden lg:inline">
                    {user.firstName} {user.lastName}
                  </span>
                  <button
                    onClick={logout}
                    className="text-gray-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/admin/login"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Admin
                </Link>
              </>
            )}
            {/* Toggle dark mode */}
            <button
              onClick={toggleDarkMode}
              className="ml-2 p-2 rounded-full bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
              aria-label="Toggle dark mode"
            >
              <span className="sr-only">Toggle dark mode</span>
              <span className="block transition-transform duration-300">
                {darkMode ? (
                  <svg className="w-5 h-5 text-yellow-300 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                  </svg>
                )}
              </span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors duration-200"
              title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
              {darkMode ? (
                <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.95l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.05l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-blue-900 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-blue-900">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-blue-950">
              <Link
                href="https://campus.asd.edu.ar/login/index.php"
                target="_blank"
                rel="noopener"
                className="block bg-gradient-to-r from-blue-700 to-blue-500 text-white px-4 py-3 rounded-md font-semibold shadow hover:from-blue-800 hover:to-blue-600 transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Ir al Campus
              </Link>
              {user ? (
                <>
                  <Link
                    href="/students"
                    className="block text-gray-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white px-4 py-3 rounded-md text-base font-medium transition-colors hover:bg-gray-100 dark:hover:bg-blue-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Alumnos
                  </Link>
                  <Link
                    href="/courses"
                    className="block text-gray-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white px-4 py-3 rounded-md text-base font-medium transition-colors hover:bg-gray-100 dark:hover:bg-blue-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Cursos
                  </Link>
                  {user.role === 'admin' && (
                    <>
                      <Link
                        href="/admin/users"
                        className="block text-gray-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white px-4 py-3 rounded-md text-base font-medium transition-colors hover:bg-gray-100 dark:hover:bg-blue-900"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Usuarios
                      </Link>
                      <Link
                        href="/admin/activities"
                        className="block text-gray-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white px-4 py-3 rounded-md text-base font-medium transition-colors hover:bg-gray-100 dark:hover:bg-blue-900"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Actividades
                      </Link>
                    </>
                  )}
                  <div className="border-t border-gray-200 dark:border-blue-900 pt-3 mt-3">
                    <div className="px-4 py-2 text-sm text-gray-500 dark:text-blue-200 font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left text-gray-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white px-4 py-3 rounded-md text-base font-medium transition-colors hover:bg-gray-100 dark:hover:bg-blue-900"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="block text-gray-600 dark:text-blue-100 hover:text-blue-700 dark:hover:text-white px-4 py-3 rounded-md text-base font-medium transition-colors hover:bg-gray-100 dark:hover:bg-blue-900"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                  <Link
                    href="/admin/login"
                    className="block bg-blue-600 text-white px-4 py-3 rounded-md text-base font-medium hover:bg-blue-700 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Admin
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
} 