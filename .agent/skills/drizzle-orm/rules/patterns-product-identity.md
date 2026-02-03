# Product Identity & O(1) Fetching

## Problem

Calculating product identity (canonical slugs, family consensus) for a single product page was taking $O(N^2)$ time because it fetched all $N$ siblings in an ASIN family and ran a complexity-heavy loop over them just to generate one slug.

## Solution: Complexity-Aware Fetching

Always strive for **Indexed O(1) lookups** for detail pages and metadata.

### 1. Indexed Lookup (O(1))

When the product ID is known (standard in CleverPrices URLs), fetch ONLY that row.

```typescript
// ✅ High Speed O(1)
const product = await db.query.products.findFirst({
  where: eq(products.id, id),
  columns: liteProductColumns,
  with: { prices: { columns: litePriceColumns } },
});

// Pass empty siblings to signal "O(1) mode" to the mapper
return mapDbProduct(product, []);
```

### 2. Mapper Intelligence

The `mapDbProduct` utility should be smart enough to:

1. **Trust DB Slugs**: If `siblings` is empty, use the `slug` and `officialTitle` columns stored in the database.
2. **Standardize Slugs**: Ensure slugs generated in O(1) mode still follow the canonical format (e.g., `ID_-title`) to maintain URL consistency.

### 3. Progressive Enrichment (Deduplicated)

If the UI needs siblings (e.g., for a variant picker), fetch them in a separate parallel step or inside the component, NOT as a dependency for the main product load.

```typescript
// page.tsx
const resolution = await resolveProductFromRoute(slug); // Uses react.cache deduplication

// Parallel fetch ONLY if needed for UI
const [variants, related] = await Promise.all([
  getProductVariants(resolution.product),
  getRelatedProducts(resolution.product),
]);
```

## Consensus Rule

Identity consensus (repairing titles/slugs based on family) should ONLY be performed when:

1. Rendering a **Hub Page** (Alle Varianten).
2. Generating a **Variant Selection** menu.
3. Performing a **Maintenance Task** (Worker enrichment).

For metadata and single pages, **O(1) is the requirement**.
