# Category Performance Architecture: Lean & Ghost

## The Problem: The 2MB Ceiling

Next.js 16 and Redis caches have a practical limit on object sizes. Serializing and deserializing 2,000 products—each containing heavy HTML/JSON specifications and long titles—is slow (high TTFB) and memory-intensive.

## The Solution: Lean & Ghost Workflow

We split category data fetching into two specialized tiers:

### 1. The "Lean" Core (Filtering)

The `getLeanCategoryProducts` function serves as the high-speed engine for the category.

- **Payload**: Contains only primitive data (ID, price, brand, popularity, specific category tokens like 'socket' or 'capacity').
- **Size**: ~150KB for 2,000 products (down from ~2.5MB).
- **Purpose**: All filtering, facet counting (sidebar numbers), and sorting happen on this set.
- **Database Optimization**: Powered by `getRawProductsByCategory` which selects only `filteringProductColumns`, bypassing expensive sibling lookups and JSON parsing for the initial product set.
- **TTFB Impact**: Extremely low, as Redis/Memory can parse this instantly.

### 2. The "Ghost" Product Hydration

Once the 24 products for the current page are identified, we perform a surgical hydration.

- **Function**: `getLocalizedProductsByIds`.
- **Logic**: It fetches the full DB records only for those 24 IDs and maps them using the unified `mapRawToLocalizedProduct` logic.
- **Consistency**: This ensures that regardless of which tier fetched the data, the product identity (slug, title) is identical to the canonical Product Detail Page (PDP).

## Implementation Rules

1. **Source of Truth**: All mapping logic must live in `mapRawToLocalizedProduct` in `src/lib/server/category-products.ts`.
2. **Limit**: Never fetch more than 2,000 products for a category.
3. **Cache Versioning**: Use the `version` buster (e.g., `v60`) to force re-ingestion when mapping logic changes.

## Performance Targets

- **TTFB (Warm)**: < 100ms
- **RSC Payload**: < 50KB for the initial product list.
- **Memory Consumption**: Stable even during heavy concurrent crawling of multiple categories.
