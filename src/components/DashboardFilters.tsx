    'use client';

import { useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface DashboardFiltersProps {
  filters: {
    search: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  onFiltersChange: (filters: { search: string; sortBy: string; sortOrder: 'asc' | 'desc' }) => void;
  searchPlaceholder?: string;
  sortOptions?: FilterOption[];
  showSearch?: boolean;
  showSort?: boolean;
  className?: string;
}

export default function DashboardFilters({
  filters,
  onFiltersChange,
  searchPlaceholder = "Buscar...",
  sortOptions = [
    { value: 'name', label: 'Nombre' },
    { value: 'email', label: 'Email' },
    { value: 'username', label: 'Usuario' },
    { value: 'date', label: 'Fecha' }
  ],
  showSearch = true,
  showSort = true,
  className = ""
}: DashboardFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleSortChange = (value: string) => {
    onFiltersChange({ ...filters, sortBy: value });
  };

  const handleSortOrderChange = (value: 'asc' | 'desc') => {
    onFiltersChange({ ...filters, sortOrder: value });
  };

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filtros</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {isExpanded ? 'Ocultar' : 'Mostrar'} filtros
          </button>
          {(filters.search || filters.sortBy !== 'name' || filters.sortOrder !== 'asc') && (
            <button
              onClick={clearFilters}
              className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {showSearch && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Buscar
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {showSort && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ordenar por
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Orden
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleSortOrderChange(e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="asc">Ascendente</option>
                  <option value="desc">Descendente</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 