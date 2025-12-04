'use client'

import { useQueryStates, parseAsArrayOf, parseAsString, parseAsFloat } from 'nuqs'

/**
 * Custom hook for managing product filter state with URL synchronization
 * All filter changes are automatically reflected in the URL query parameters
 */
export function useProductFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      // Search term
      search: parseAsString.withDefault(''),
      
      // Multi-select filters
      condition: parseAsArrayOf(parseAsString).withDefault([]),
      technology: parseAsArrayOf(parseAsString).withDefault([]),
      formFactor: parseAsArrayOf(parseAsString).withDefault([]),
      
      // Capacity range
      minCapacity: parseAsFloat,
      maxCapacity: parseAsFloat,
      
      // Sorting
      sortBy: parseAsString.withDefault('pricePerTB'),
      sortOrder: parseAsString.withDefault('asc'),
    },
    {
      // Use shallow routing to avoid full page reloads
      shallow: true,
      // Clear empty values from URL
      clearOnDefault: true,
    }
  )

  // Helper functions for easier filter manipulation
  const toggleArrayFilter = (key: 'condition' | 'technology' | 'formFactor', value: string) => {
    const currentValues = filters[key] || []
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value]
    
    setFilters({ [key]: newValues.length > 0 ? newValues : null })
  }

  const setSearch = (search: string) => {
    setFilters({ search: search || null })
  }

  const setCapacityRange = (min: number | null, max: number | null) => {
    setFilters({ minCapacity: min, maxCapacity: max })
  }

  const setSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters({ sortBy, sortOrder })
  }

  const clearAllFilters = () => {
    setFilters({
      search: null,
      condition: null,
      technology: null,
      formFactor: null,
      minCapacity: null,
      maxCapacity: null,
      sortBy: 'pricePerTB',
      sortOrder: 'asc',
    })
  }

  return {
    filters,
    setFilters,
    toggleArrayFilter,
    setSearch,
    setCapacityRange,
    setSort,
    clearAllFilters,
  }
}
