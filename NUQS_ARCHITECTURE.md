# nuqs Architecture

## Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Root Layout                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  NuqsProvider                          │  │
│  │  (Enables nuqs throughout the app)                    │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │           Product Category Page                  │  │  │
│  │  │                                                   │  │  │
│  │  │  const { filters, setSearch, ... } =             │  │  │
│  │  │    useProductFilters()                           │  │  │
│  │  │                                                   │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐             │  │  │
│  │  │  │ Search Input │  │ FilterPanel  │             │  │  │
│  │  │  │              │  │              │             │  │  │
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

## Data Flow

```
User Action → Hook Function → nuqs → URL Update → Browser History
                                ↓
                          State Update
                                ↓
                          Component Re-render
                                ↓
                          Filtered Results
```

### Example: User Clicks "New" Checkbox

```
1. User clicks checkbox
   ↓
2. toggleArrayFilter('condition', 'New') called
   ↓
3. nuqs updates URL: ?condition=New
   ↓
4. filters.condition updates to ['New']
   ↓
5. Component re-renders with new filters
   ↓
6. Products filtered to show only "New" items
```

## File Structure

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

## State Management Comparison

### Traditional useState

```
Component State (Memory)
         ↓
    Lost on refresh
    Can't share
    No history
```

### With nuqs

```
Component State ←→ URL Query Params
         ↓              ↓
    Persists      Shareable
    Bookmarkable  History support
```

## URL State Examples

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

## Hook API

```typescript
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

} = useProductFilters()
```

## Benefits Visualization

```
┌─────────────────────────────────────────────────────────┐
│                    User Benefits                         │
├─────────────────────────────────────────────────────────┤
│ 📤 Share filtered views with others                     │
│ 🔖 Bookmark specific filter combinations                │
│ ⬅️ ➡️ Browser back/forward works correctly              │
│ 🔄 Filters survive page refresh                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Developer Benefits                      │
├─────────────────────────────────────────────────────────┤
│ ✅ Type-safe query parameters                           │
│ 🎯 No manual URL parsing/serialization                  │
│ 🧹 Cleaner code, less boilerplate                       │
│ 🔧 Automatic state synchronization                      │
│ 📝 Better developer experience                          │
└─────────────────────────────────────────────────────────┘
```

## Performance

```
Traditional Approach:
User changes filter → setState → Re-render → Manual URL update
                                              (if implemented)

With nuqs:
User changes filter → nuqs hook → URL update + State update → Re-render
                                   (Atomic, automatic)
```

## Type Safety Flow

```typescript
// Define parsers with types
const filters = useQueryStates({
  search: parseAsString,           // → string
  condition: parseAsArrayOf(...),  // → string[] | null
  minCapacity: parseAsFloat,       // → number | null
})

// TypeScript knows the types!
filters.search      // ✅ string
filters.condition   // ✅ string[] | null
filters.minCapacity // ✅ number | null
filters.invalid     // ❌ Type error!
```
