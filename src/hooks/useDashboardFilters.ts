import { useState, useMemo } from 'react';

interface FilterConfig {
  search: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface UseDashboardFiltersProps<T> {
  data: T[];
  searchFields?: (keyof T)[];
  defaultSortBy?: string;
  defaultSortOrder?: 'asc' | 'desc';
}

export function useDashboardFilters<T>({
  data,
  searchFields = [],
  defaultSortBy = 'name',
  defaultSortOrder = 'asc'
}: UseDashboardFiltersProps<T>) {
  const [filters, setFilters] = useState<FilterConfig>({
    search: '',
    sortBy: defaultSortBy,
    sortOrder: defaultSortOrder
  });

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Aplicar filtro de búsqueda
    if (filters.search && searchFields.length > 0) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(item => {
        return searchFields.some(field => {
          const value = item[field];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchTerm);
        });
      });
    }

    // Aplicar ordenamiento
    if (filters.sortBy) {
      result.sort((a, b) => {
        const aValue = a[filters.sortBy as keyof T];
        const bValue = b[filters.sortBy as keyof T];

        // Manejar valores nulos/undefined
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        let comparison = 0;

        // Comparar según el tipo de dato
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else {
          // Convertir a string para comparación
          comparison = String(aValue).localeCompare(String(bValue));
        }

        return filters.sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [data, filters, searchFields]);

  const updateFilters = (newFilters: Partial<FilterConfig>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      sortBy: defaultSortBy,
      sortOrder: defaultSortOrder
    });
  };

  return {
    filters,
    filteredData: filteredAndSortedData,
    updateFilters,
    clearFilters,
    hasActiveFilters: filters.search !== '' || filters.sortBy !== defaultSortBy || filters.sortOrder !== defaultSortOrder
  };
} 