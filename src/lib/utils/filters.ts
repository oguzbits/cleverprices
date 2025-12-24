/**
 * Filter utility functions
 * Reusable logic for managing filter state
 */

/**
 * Toggle a value in an array filter
 * Returns new array with value added or removed
 */
export function toggleArrayValue<T>(array: T[] | null, value: T): T[] | null {
  if (!array || array.length === 0) {
    return [value];
  }

  if (array.includes(value)) {
    const filtered = array.filter((v) => v !== value);
    return filtered.length > 0 ? filtered : null;
  }

  return [...array, value];
}

/**
 * Check if a value exists in an array filter
 */
export function hasFilterValue<T>(array: T[] | null, value: T): boolean {
  return array?.includes(value) ?? false;
}

/**
 * Get count of active filters
 */
export function getActiveFilterCount(filters: Record<string, any>): number {
  return Object.values(filters).filter((value) => {
    if (value === null || value === undefined || value === "") return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }).length;
}

/**
 * Apply filters to an array of items
 * Generic filter function that works with any object type
 */
export function applyFilters<T extends Record<string, any>>(
  items: T[],
  filters: Record<string, any>,
  matcher: (item: T, key: string, value: any) => boolean,
): T[] {
  return items.filter((item) => {
    return Object.entries(filters).every(([key, value]) => {
      // Skip empty/null filters
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return true;
      }
      return matcher(item, key, value);
    });
  });
}
