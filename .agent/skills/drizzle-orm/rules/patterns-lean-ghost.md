# Lean & Ghost Architecture

## Overview

The "Lean & Ghost" architecture is a two-tier data fetching strategy designed to handle large product catalogs (2,000+ products per category) with sub-100ms response times.

### 1. The Lean Tier (Filtering & Sorting)

- **Goal**: Fetch enough data for all products in a category to perform server-side filtering, facet counting, and sorting.
- **Implementation**:
  - Use a highly optimized `getLeanCategoryProducts` call.
  - Fetch only primitive fields: `id`, `title`, `brand`, `price`, `popularityScore`, etc.
  - **Never** fetch specifications, official specifications, or variation attributes in this tier.
  - Cache this tier using `cacheLife("category")`.

### 2. The Ghost Tier (Hydration)

- **Goal**: Hydrate only the visible subset (e.g., 24 products) with full details.
- **Implementation**:
  - After pagination, take the 24 `id`s.
  - Use `getProductsByIds` to fetch full records for exactly those 24 items.
  - This ensures heavy JSON blobs (specs, official specs) are only deserialized for visible items.

### 3. Family Grouping (Hub Cards)

- **Goal**: Consolidate product variants into a single "Hub" card to improve scannability.
- **Implementation**:
  - In the **Lean Tier**, group products by `parentAsin`.
  - Create a synthetic "parentView" object for each family.
  - The Hub card must adopt the _best_ metrics (e.g., lowest price) of its members for sorting.
  - Apply an explicit tie-breaker in sorting: Hub cards always rank above their specific variants if they share the same best score.

## Benefits

- **Memory Efficiency**: Avoids loading 2,000+ heavy objects into the server's RAM.
- **Ultra-Fast TTFB**: Reducing the data payload processed during the main request improves the Time to First Byte.
- **UI Consistency**: By using a single `mapRawToLocalizedProduct` function for both tiers, the UI stays consistent (titles, slugs, attributes).

## Example Pattern

```typescript
// tier 1: LEAN
const leanProducts = await getLeanCategoryProducts(categorySlug, country);

// Filter and sort in memory
const filtered = leanProducts.filter(...)
const sorted = sort(filtered);
const visibleIds = sorted.slice(0, 24).map(p => p.id);

// tier 2: GHOST (Hydration)
const hydrated = await getLocalizedProductsByIds(visibleIds, categorySlug, country);
```
