"use client";

import { parseAsArrayOf, parseAsFloat, parseAsString, useQueryStates } from "nuqs";
import { useTransition } from "react";
import { FilterPanel } from "./FilterPanel";

interface FilterPanelClientProps {
  categorySlug: string;
  unitLabel: string;
  initialFilters: {
    condition: string[];
    technology: string[];
    formFactor: string[];
    minCapacity: number | null;
    maxCapacity: number | null;
  };
}

/**
 * Client component wrapper for FilterPanel that manages URL state
 * This is the only client-side logic needed for filtering
 */
export function FilterPanelClient({
  categorySlug,
  unitLabel,
  initialFilters,
}: FilterPanelClientProps) {
  const [, startTransition] = useTransition();
  const [filters, setFilters] = useQueryStates(
    {
      condition: parseAsArrayOf(parseAsString).withDefault(
        initialFilters.condition,
      ),
      technology: parseAsArrayOf(parseAsString).withDefault(
        initialFilters.technology,
      ),
      formFactor: parseAsArrayOf(parseAsString).withDefault(
        initialFilters.formFactor,
      ),
      minCapacity: parseAsFloat,
      maxCapacity: parseAsFloat,
    },
    {
      shallow: false,
      throttleMs: 500,
      clearOnDefault: true,
      startTransition, // Use React Transition to avoid flicker
    },
  );

  const toggleArrayFilter = (
    key: string,
    value: string,
  ) => {
    const filterKey = key as "condition" | "technology" | "formFactor";
    const currentValues = filters[filterKey] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    setFilters({ [filterKey]: newValues.length > 0 ? newValues : null });
  };

  const setCapacityRange = (min: number | null, max: number | null) => {
    setFilters({ minCapacity: min, maxCapacity: max });
  };

  return (
    <FilterPanel
      filters={filters}
      onFilterChange={toggleArrayFilter}
      onCapacityChange={setCapacityRange}
      unitLabel={unitLabel}
      categorySlug={categorySlug}
    />
  );
}
