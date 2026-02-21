# URL State Management

This guide documents how CleverPrices manages shareable, bookmarkable filter and search states using native Next.js hooks.

## Overview

We avoid third-party libraries like `nuqs` to ensure maximum compatibility with Next.js App Router and Concurrent Rendering. Instead, we use a custom implementation built on top of:

1.  `useSearchParams()`: For reading the current URL parameters.
2.  `useRouter()`: For updating the URL via `router.replace()`.
3.  `useTransition()`: To ensure URL updates are marked as transitions, allowing for concurrent-safe navigation and better UX.

## The `useFilters` Hook

The primary interface for managing category filters is the `useFilters` hook located at `src/lib/hooks/use-filters.ts`.

### Usage

```tsx
import { useFilters } from "@/lib/hooks/use-filters";

export function FilterPanel() {
  const [filters, setFilters] = useFilters();

  const handleBrandChange = (brand: string) => {
    setFilters({ brand });
  };

  return (
    // ... UI
  );
}
```

### Key Behaviors

- **Atomic Updates**: Multiple filter changes passed to `setFilters` are applied in a single `router.replace` call.
- **Full Navigation**: We use `router.replace` with default options (not shallow) to ensure that Server Components re-render and fetch fresh data based on the new filters.
- **Concurrent Safe**: All updates are wrapped in `startTransition()`.
- **Default Simplification**: Parameters matching default values (e.g., `sortBy: "pricePerUnit"`) are automatically removed from the URL to keep it clean.

## Component-Specific Implementations

### Search Inputs

For text search, we use local state combined with a debounce to avoid excessive URL updates while typing.

- **File**: `src/components/category/SearchInput.tsx`
- **Debounce**: 300ms (matching old `nuqs` behavior).

### Sorting

Sortable table headers update `sortBy` and `sortOrder` atomically.

- **File**: `src/components/category/SortableTableHead.tsx`

## Implementation Checklist

When adding a new filterable page or parameter:

1.  Update the `FilterState` type in `src/lib/hooks/use-filters.ts`.
2.  Update the `parseFiltersFromParams` utility to include the new parameter.
3.  Add the parameter handling to the `setFilters` function (normalization and default checking).
4.  Use the `useFilters` hook in the relevant Client Component.

## Why Native?

- **Stability**: Eliminates "double-click" navigation bugs often found in third-party history-patching libraries.
- **Performance**: Zero additional bundle size.
- **Control**: Full control over exactly when and how the URL is updated, especially important for Next.js 16's specific rendering patterns.
