# nuqs Quick Reference

## Installation

```bash
bun add nuqs
```

## Basic Setup

### 1. Wrap app with provider

```tsx
// app/layout.tsx
import { NuqsProvider } from "@/providers/nuqs-provider";

export default function Layout({ children }) {
  return <NuqsProvider>{children}</NuqsProvider>;
}
```

### 2. Use in components

```tsx
import { useProductFilters } from "@/hooks/use-product-filters";

export default function Page() {
  const { filters, setSearch, toggleArrayFilter } = useProductFilters();
  return <div>...</div>;
}
```

## Common Patterns

### Text Input

```tsx
<Input value={filters.search} onChange={(e) => setSearch(e.target.value)} />
```

### Checkbox (Single)

```tsx
<Checkbox
  checked={filters.condition?.includes("New") || false}
  onCheckedChange={() => toggleArrayFilter("condition", "New")}
/>
```

### Number Input (Range)

```tsx
<Input
  type="number"
  value={filters.minCapacity ?? ""}
  onChange={(e) => {
    const val = e.target.value ? parseFloat(e.target.value) : null;
    setCapacityRange(val, filters.maxCapacity ?? null);
  }}
/>
```

### Sort Button

```tsx
<Button
  onClick={() => {
    const newOrder = filters.sortOrder === "asc" ? "desc" : "asc";
    setSort("pricePerTB", newOrder);
  }}
>
  Sort
</Button>
```

### Clear All

```tsx
<Button onClick={clearAllFilters}>Clear Filters</Button>
```

## Filter Types

| Filter       | Type       | Example URL                     |
| ------------ | ---------- | ------------------------------- |
| Search       | `string`   | `?search=samsung`               |
| Condition    | `string[]` | `?condition=New&condition=Used` |
| Technology   | `string[]` | `?technology=SSD`               |
| Form Factor  | `string[]` | `?formFactor=M.2%20NVMe`        |
| Min Capacity | `number`   | `?minCapacity=2`                |
| Max Capacity | `number`   | `?maxCapacity=4`                |
| Sort By      | `string`   | `?sortBy=pricePerTB`            |
| Sort Order   | `string`   | `?sortOrder=asc`                |

## Available Parsers

```tsx
import {
  parseAsString,
  parseAsInteger,
  parseAsFloat,
  parseAsBoolean,
  parseAsArrayOf,
  parseAsStringEnum,
  parseAsTimestamp,
} from "nuqs";

// With defaults
parseAsString.withDefault("default value");
parseAsInteger.withDefault(0);
parseAsArrayOf(parseAsString).withDefault([]);
```

## Hook Return Values

```tsx
const {
  filters, // All current filter values
  setFilters, // Set multiple filters at once
  toggleArrayFilter, // Toggle value in array filter
  setSearch, // Update search query
  setCapacityRange, // Set min/max capacity
  setSort, // Update sort config
  clearAllFilters, // Reset all to defaults
} = useProductFilters();
```

## Filter Object Structure

```tsx
filters = {
  search: string,              // e.g., "samsung"
  condition: string[] | null,  // e.g., ["New", "Renewed"]
  technology: string[] | null, // e.g., ["SSD"]
  formFactor: string[] | null, // e.g., ["M.2 NVMe"]
  minCapacity: number | null,  // e.g., 2
  maxCapacity: number | null,  // e.g., 4
  sortBy: string,              // e.g., "pricePerTB"
  sortOrder: string,           // e.g., "asc" or "desc"
}
```

## Common Operations

### Check if filter is active

```tsx
const isNewSelected = filters.condition?.includes("New") || false;
```

### Get filter count

```tsx
const activeFilters = [
  filters.search,
  filters.condition?.length,
  filters.technology?.length,
  filters.minCapacity,
  filters.maxCapacity,
].filter(Boolean).length;
```

### Apply filters to data

```tsx
let filtered = products;

if (filters.search) {
  filtered = filtered.filter((p) =>
    p.name.toLowerCase().includes(filters.search.toLowerCase())
  );
}

if (filters.condition?.length) {
  filtered = filtered.filter((p) => filters.condition!.includes(p.condition));
}

if (filters.minCapacity) {
  filtered = filtered.filter((p) => p.capacity >= filters.minCapacity!);
}
```

### Sort data

```tsx
filtered.sort((a, b) => {
  const key = filters.sortBy as keyof Product;
  const aVal = a[key];
  const bVal = b[key];

  if (typeof aVal === "number" && typeof bVal === "number") {
    return filters.sortOrder === "asc" ? aVal - bVal : bVal - aVal;
  }

  return filters.sortOrder === "asc"
    ? String(aVal).localeCompare(String(bVal))
    : String(bVal).localeCompare(String(aVal));
});
```

## Debugging

### Log current filters

```tsx
console.log("Current filters:", filters);
```

### Log URL

```tsx
console.log("Current URL:", window.location.href);
```

### Check if filter is in URL

```tsx
const params = new URLSearchParams(window.location.search);
console.log("condition param:", params.getAll("condition"));
```

## Tips

✅ **DO**

- Use custom hooks for domain-specific filters
- Set sensible defaults with `.withDefault()`
- Use `clearOnDefault: true` to keep URLs clean
- Use TypeScript for type safety

❌ **DON'T**

- Manually parse/serialize URL params
- Use `useState` for filter state
- Forget to wrap app with `NuqsProvider`
- Mix nuqs with other URL state management

## Troubleshooting

| Issue                    | Solution                              |
| ------------------------ | ------------------------------------- |
| Filters not updating URL | Check `NuqsProvider` is in layout     |
| Type errors              | Use correct parser for data type      |
| URL not clearing         | Add `clearOnDefault: true`            |
| State not persisting     | Ensure using nuqs hooks, not useState |

## Files

- **Provider**: `/src/providers/nuqs-provider.tsx`
- **Hook**: `/src/hooks/use-product-filters.ts`
- **Example**: `/src/app/[country]/[parent]/[category]/page.tsx`
- **Docs**: `/NUQS_GUIDE.md`
- **Architecture**: `/NUQS_ARCHITECTURE.md`

## Resources

- [nuqs Docs](https://nuqs.47ng.com/)
- [GitHub](https://github.com/47ng/nuqs)
- [Next.js App Router](https://nuqs.47ng.com/docs/adapters/next-app)
