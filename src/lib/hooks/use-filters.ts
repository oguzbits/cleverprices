"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useTransition } from "react";

/**
 * Filter state shape — mirrors the old nuqs-based hook exactly.
 */
export interface FilterState {
  condition: string[];
  technology: string[];
  formFactor: string[];
  brand: string[];
  cores: string[];
  socket: string[];
  capacity: string[];
  minCapacity: number | null;
  maxCapacity: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  search: string;
  sort: string;
  view: string;
}

const ARRAY_KEYS: (keyof FilterState)[] = [
  "condition",
  "technology",
  "formFactor",
  "brand",
  "cores",
  "socket",
  "capacity",
];

const FLOAT_KEYS: (keyof FilterState)[] = ["minCapacity", "maxCapacity"];
const INT_KEYS: (keyof FilterState)[] = ["minPrice", "maxPrice"];

const DEFAULTS: FilterState = {
  condition: [],
  technology: [],
  formFactor: [],
  brand: [],
  cores: [],
  socket: [],
  capacity: [],
  minCapacity: null,
  maxCapacity: null,
  minPrice: null,
  maxPrice: null,
  search: "",
  sort: "popular",
  view: "grid",
};

function parseFiltersFromParams(params: URLSearchParams): FilterState {
  const state = { ...DEFAULTS };

  for (const key of ARRAY_KEYS) {
    const values = params.getAll(key as string);
    (state as any)[key] = values.length > 0 ? values : [];
  }

  for (const key of FLOAT_KEYS) {
    const val = params.get(key as string);
    (state as any)[key] = val ? parseFloat(val) : null;
  }

  for (const key of INT_KEYS) {
    const val = params.get(key as string);
    (state as any)[key] = val ? parseInt(val, 10) : null;
  }

  state.search = params.get("search") || "";
  state.sort = params.get("sort") || "popular";
  state.view = params.get("view") || "grid";

  return state;
}

type SetFilters = (
  updates: Partial<{
    [K in keyof FilterState]: FilterState[K] | null;
  }>,
) => void;

/**
 * Hook to manage filter state via URL search parameters.
 * Uses native Next.js useSearchParams + useRouter (no nuqs dependency).
 *
 * Returns [filters, setFilters] — same API as the old nuqs-based hook.
 * setFilters triggers a full navigation (shallow: false equivalent)
 * so that server components re-render with the new params.
 */
export const useFilters = (): [FilterState, SetFilters] => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );

  const setFilters: SetFilters = useCallback(
    (updates) => {
      startTransition(() => {
        const newParams = new URLSearchParams(searchParams.toString());

        for (const [key, value] of Object.entries(updates)) {
          // Remove old values for this key
          newParams.delete(key);

          if (value === null || value === undefined) {
            // null = clear the param
            continue;
          }

          if (Array.isArray(value)) {
            // Empty array = clear
            if (value.length === 0) continue;
            // Multi-value params
            for (const v of value) {
              newParams.append(key, v);
            }
          } else if (typeof value === "number") {
            newParams.set(key, value.toString());
          } else if (typeof value === "string") {
            // Empty string = clear for search, but keep for sort/view
            if (value === "" && key === "search") continue;
            // Don't write default values to keep URLs clean
            if (
              key in DEFAULTS &&
              value === (DEFAULTS as any)[key] &&
              key !== "sort" &&
              key !== "view"
            ) {
              continue;
            }
            newParams.set(key, value);
          }
        }

        // Clean up default values to keep URLs short
        if (newParams.get("sort") === "popular") newParams.delete("sort");
        if (newParams.get("view") === "grid") newParams.delete("view");

        const query = newParams.toString();
        const newUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;

        // Full navigation (not shallow) so server components re-render
        router.replace(newUrl, { scroll: false });
      });
    },
    [searchParams, router, startTransition],
  );

  return [filters, setFilters];
};
