# nuqs Integration

**nuqs** is a type-safe URL query parameter management library for Next.js that enables shareable, bookmarkable filter states.

## Quick Start

### Installation

```bash
bun add nuqs
```

### Setup

The `NuqsProvider` is configured in `/src/app/layout.tsx`:

```tsx
import { NuqsProvider } from "@/providers/nuqs-provider";

export default function RootLayout({ children }) {
  return <NuqsProvider>{children}</NuqsProvider>;
}
```

### Usage

```tsx
import { useProductFilters } from "@/hooks/use-product-filters";

export default function ProductsPage() {
  const { filters, setSearch, toggleArrayFilter, clearAllFilters } =
    useProductFilters();

  return (
    <div>
      {/* Search */}
      <Input
        value={filters.search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Multi-select filter */}
      <Checkbox
        checked={filters.condition?.includes("New") || false}
        onCheckedChange={() => toggleArrayFilter("condition", "New")}
      />

      {/* Clear all */}
      <Button onClick={clearAllFilters}>Clear Filters</Button>
    </div>
  );
}
```

---

## Architecture

### Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Root Layout                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  NuqsProvider                          │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           Product Category Page                  │  │  │
│  │  │                                                   │  │  │
│  │  │  const { filters, setSearch, ... } =             │  │  │
│  │  │    useProductFilters()                           │  │  │
│  │  │                                                   │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐             │  │  │
│  │  │  │ Search Input │  │ FilterPanel  │             │  │  │
│  │  │  │ filters.     │  │ Checkboxes   │             │  │  │
│  │  │  │   search     │  │ Range inputs │             │  │  │
│  │  │  └──────────────┘  └──────────────┘             │  │  │
│  │  │                                                   │  │  │
│  │  │  ┌──────────────────────────────────────────┐   │  │  │
│  │  │  │        Product Table                      │   │  │  │
│  │  │  │  (Filtered & sorted based on URL state)  │   │  │  │
│  │  │  └──────────────────────────────────────────┘   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ↓
                    ┌───────────────┐
                    │      URL      │
                    │  ?condition=  │
                    │  &technology= │
                    │  &sortBy=     │
                    └───────────────┘
```

### Data Flow

```
User Action → Hook Function → nuqs → URL Update → Browser History
                                ↓
                          State Update
                                ↓
                          Component Re-render
                                ↓
                          Filtered Results
```

### File Structure

```
src/
├── app/
│   ├── layout.tsx                    # ✅ NuqsProvider wrapper
│   └── [country]/
│       └── [parent]/
│           └── [category]/
│               └── page.tsx          # ✅ Uses useProductFilters()
│
├── hooks/
│   └── use-product-filters.ts       # ✅ Custom nuqs hook
│
└── providers/
    └── nuqs-provider.tsx            # ✅ NuqsAdapter wrapper
```

---

## API Reference

### Hook Return Values

```tsx
const {
  // Current filter values (synced with URL)
  filters: {
    search: string,
    condition: string[] | null,
    technology: string[] | null,
    formFactor: string[] | null,
    minCapacity: number | null,
    maxCapacity: number | null,
    sortBy: string,
    sortOrder: string,
  },

  // Update functions
  setSearch: (value: string) => void,
  toggleArrayFilter: (key, value) => void,
  setCapacityRange: (min, max) => void,
  setSort: (key, order) => void,
  clearAllFilters: () => void,
} = useProductFilters();
```

### Common Patterns

#### Text Input

```tsx
<Input value={filters.search} onChange={(e) => setSearch(e.target.value)} />
```

#### Checkbox (Multi-select)

```tsx
<Checkbox
  checked={filters.condition?.includes("New") || false}
  onCheckedChange={() => toggleArrayFilter("condition", "New")}
/>
```

#### Number Range

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

#### Sorting

```tsx
const handleSort = (key: string) => {
  const newOrder =
    filters.sortBy === key && filters.sortOrder === "asc" ? "desc" : "asc";
  setSort(key, newOrder);
};
```

#### Clear All Filters

```tsx
<Button onClick={clearAllFilters}>Clear All Filters</Button>
```

### Filter Types

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

---

## URL Examples

### No Filters

```
/us/electronics/hard-drives
```

### With Search

```
/us/electronics/hard-drives?search=samsung
```

### Multiple Filters

```
/us/electronics/hard-drives?condition=New&condition=Renewed&technology=SSD&sortBy=pricePerTB&sortOrder=asc
```

### Full Filter Set

```
/us/electronics/hard-drives?
  search=samsung&
  condition=New&
  technology=SSD&
  formFactor=M.2%20NVMe&
  minCapacity=2&
  maxCapacity=4&
  sortBy=pricePerTB&
  sortOrder=asc
```

---

## Benefits

### For Users

✅ **Shareable URLs** - Share filtered product views with others  
✅ **Bookmarkable** - Save specific filter combinations  
✅ **Browser History** - Back/forward buttons work correctly  
✅ **Persistent State** - Filters survive page refresh

### For Developers

✅ **Type Safe** - Compile-time type checking  
✅ **Less Boilerplate** - No manual URL parsing/serialization  
✅ **Better DX** - Clean, declarative API  
✅ **Automatic Sync** - No manual state management needed

---

## Advanced Usage

### Creating Custom Filter Hooks

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
    },
  );

  return { filters, setFilters };
}
```

### Available Parsers

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

### Type Safety

```typescript
// Define parsers with types
const filters = useQueryStates({
  search: parseAsString, // → string
  condition: parseAsArrayOf(...), // → string[] | null
  minCapacity: parseAsFloat, // → number | null
});

// TypeScript knows the types!
filters.search; // ✅ string
filters.condition; // ✅ string[] | null
filters.minCapacity; // ✅ number | null
filters.invalid; // ❌ Type error!
```

---

## Best Practices

✅ **DO**

- Use custom hooks for domain-specific filters
- Set sensible defaults with `.withDefault()`
- Use `clearOnDefault: true` to keep URLs clean
- Use `shallow: true` to avoid full page reloads
- Always use TypeScript for full type checking

❌ **DON'T**

- Manually parse/serialize URL params
- Use `useState` for filter state that should persist
- Forget to wrap app with `NuqsProvider`
- Mix nuqs with other URL state management

---

## Troubleshooting

| Issue                    | Solution                          |
| ------------------------ | --------------------------------- |
| Filters not updating URL | Check `NuqsProvider` is in layout |
| Type errors              | Use correct parser for data type  |
| URL not clearing         | Add `clearOnDefault: true`        |
| State not persisting     | Ensure using nuqs hooks           |

---

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

---

## Resources

- [nuqs Documentation](https://nuqs.47ng.com/)
- [nuqs GitHub](https://github.com/47ng/nuqs)
- [Next.js App Router Guide](https://nuqs.47ng.com/docs/adapters/next-app)

## Project Files

- **Provider**: [nuqs-provider.tsx](file:///Users/oguz/Desktop/Dev/cleverprices/src/providers/nuqs-provider.tsx)
- **Hook**: [use-product-filters.ts](file:///Users/oguz/Desktop/Dev/cleverprices/src/hooks/use-product-filters.ts)
- **Example**: [Product Category Page](file:///Users/oguz/Desktop/Dev/cleverprices/src/app/[country]/[parent]/[category]/page.tsx)
