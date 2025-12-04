# nuqs Integration Guide

## Overview

This project uses [`nuqs`](https://nuqs.47ng.com/) for managing URL query parameters with type-safe, React-friendly hooks. All filter states are automatically synchronized with the URL, enabling:

- **Shareable URLs** - Users can share filtered views
- **Browser history** - Back/forward buttons work correctly
- **Bookmarkable states** - Filtered views can be bookmarked
- **Type safety** - Full TypeScript support for all query parameters

## Installation

```bash
bun add nuqs
```

## Setup

### 1. Provider Setup

The `NuqsProvider` is already configured in `/src/app/layout.tsx`:

```tsx
import { NuqsProvider } from "@/providers/nuqs-provider";

export default function RootLayout({ children }) {
  return <NuqsProvider>{children}</NuqsProvider>;
}
```

### 2. Custom Hook

We've created a custom hook at `/src/hooks/use-product-filters.ts` that manages all product filter state:

```tsx
import { useProductFilters } from "@/hooks/use-product-filters";

function MyComponent() {
  const { filters, setSearch, toggleArrayFilter, clearAllFilters } =
    useProductFilters();

  // filters.search - string
  // filters.condition - string[] | null
  // filters.technology - string[] | null
  // filters.formFactor - string[] | null
  // filters.minCapacity - number | null
  // filters.maxCapacity - number | null
  // filters.sortBy - string
  // filters.sortOrder - string
}
```

## Available Filters

### Search Filter

```tsx
const { filters, setSearch } = useProductFilters()

<Input
  value={filters.search}
  onChange={(e) => setSearch(e.target.value)}
/>
```

### Array Filters (Multi-select)

```tsx
const { filters, toggleArrayFilter } = useProductFilters()

<Checkbox
  checked={filters.condition?.includes('New') || false}
  onCheckedChange={() => toggleArrayFilter('condition', 'New')}
/>
```

### Numeric Range Filters

```tsx
const { filters, setCapacityRange } = useProductFilters()

<Input
  type="number"
  value={filters.minCapacity ?? ''}
  onChange={(e) => {
    const val = e.target.value ? parseFloat(e.target.value) : null
    setCapacityRange(val, filters.maxCapacity ?? null)
  }}
/>
```

### Sorting

```tsx
const { filters, setSort } = useProductFilters();

const handleSort = (key: string) => {
  const newOrder =
    filters.sortBy === key && filters.sortOrder === "asc" ? "desc" : "asc";
  setSort(key, newOrder);
};
```

### Clear All Filters

```tsx
const { clearAllFilters } = useProductFilters()

<Button onClick={clearAllFilters}>
  Clear All Filters
</Button>
```

## URL Examples

With `nuqs`, filter states are automatically reflected in the URL:

```
# No filters
/us/electronics/hard-drives

# With search
/us/electronics/hard-drives?search=samsung

# With multiple filters
/us/electronics/hard-drives?condition=New&condition=Renewed&technology=SSD&sortBy=price&sortOrder=asc

# With capacity range
/us/electronics/hard-drives?minCapacity=2&maxCapacity=4&condition=New
```

## Benefits

### 1. **Type Safety**

All query parameters are type-checked at compile time:

```tsx
// ✅ Type-safe
filters.condition; // string[] | null
filters.minCapacity; // number | null

// ❌ Won't compile
filters.invalidFilter; // Error: Property doesn't exist
```

### 2. **Automatic URL Sync**

Changes to filters automatically update the URL without page reload:

```tsx
toggleArrayFilter("condition", "New");
// URL updates to: ?condition=New
```

### 3. **History Management**

Browser back/forward buttons work correctly:

```tsx
// User clicks back button
// Filters automatically restore to previous state
```

### 4. **Clean URLs**

Empty or default values are automatically removed from the URL:

```tsx
setSearch(""); // Removes ?search= from URL
clearAllFilters(); // Removes all query params
```

## Advanced Usage

### Creating New Filter Hooks

To create a new filter hook for a different page:

```tsx
// src/hooks/use-category-filters.ts
import { useQueryStates, parseAsString, parseAsArrayOf } from "nuqs";

export function useCategoryFilters() {
  const [filters, setFilters] = useQueryStates(
    {
      category: parseAsString,
      tags: parseAsArrayOf(parseAsString),
    },
    {
      shallow: true,
      clearOnDefault: true,
    }
  );

  return { filters, setFilters };
}
```

### Available Parsers

`nuqs` provides many built-in parsers:

- `parseAsString` - String values
- `parseAsInteger` - Integer numbers
- `parseAsFloat` - Floating point numbers
- `parseAsBoolean` - Boolean values
- `parseAsArrayOf(parser)` - Arrays of any type
- `parseAsStringEnum(['a', 'b'])` - Enum values
- `parseAsTimestamp` - Date/time values

### Default Values

Set default values with `.withDefault()`:

```tsx
{
  sortBy: parseAsString.withDefault('pricePerTB'),
  sortOrder: parseAsString.withDefault('asc'),
}
```

## Migration from useState

### Before (Local State)

```tsx
const [search, setSearch] = useState("");
const [filters, setFilters] = useState<string[]>([]);

// State is lost on page refresh
// Can't share filtered views
// No browser history support
```

### After (nuqs)

```tsx
const { filters, setSearch, toggleArrayFilter } = useProductFilters();

// State persists in URL
// Shareable filtered views
// Full browser history support
// Type-safe
```

## Best Practices

1. **Use custom hooks** - Create domain-specific hooks like `useProductFilters()` instead of using `nuqs` directly
2. **Set defaults** - Use `.withDefault()` for sensible default values
3. **Clear on default** - Use `clearOnDefault: true` to keep URLs clean
4. **Shallow routing** - Use `shallow: true` to avoid full page reloads
5. **Type safety** - Always use TypeScript for full type checking

## Troubleshooting

### Filters not updating URL

Make sure `NuqsProvider` wraps your component tree in the layout.

### Type errors

Ensure you're using the correct parser for your data type:

- Strings → `parseAsString`
- Numbers → `parseAsFloat` or `parseAsInteger`
- Arrays → `parseAsArrayOf(parser)`

### URL not clearing

Use `clearOnDefault: true` in your `useQueryStates` options.

## Resources

- [nuqs Documentation](https://nuqs.47ng.com/)
- [nuqs GitHub](https://github.com/47ng/nuqs)
- [Next.js App Router Guide](https://nuqs.47ng.com/docs/adapters/next-app)

## Examples in This Project

- **Product Filters**: `/src/app/[country]/[parent]/[category]/page.tsx`
- **Filter Hook**: `/src/hooks/use-product-filters.ts`
- **Provider**: `/src/providers/nuqs-provider.tsx`
