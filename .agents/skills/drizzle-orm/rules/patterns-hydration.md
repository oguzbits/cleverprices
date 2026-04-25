# Hydration Pattern & Join-Depth Policy

To maintain O(1) read performance and prevent SQLite lock-up on high-concurrency category pages, CleverPrices enforces a "Max 3 Joins" policy.

## 🚫 The 3-Join Limit

Queries should never join more than 3 tables in a single SQL statement. Deep joins in SQLite can lead to:

1.  **Increased Latency**: Multi-way joins are computationally expensive.
2.  **Row Locking**: Longer-running read queries can block background price updates.

## ✅ The Hydration Pattern

Instead of deep joins, fetch the primary data set first and "hydrate" supplementary data in parallel or through O(1) lookups.

### Anti-Pattern (Deep Join)

```typescript
// ❌ DO NOT DO THIS
const data = await db
  .select()
  .from(products)
  .leftJoin(prices, eq(products.id, prices.productId))
  .leftJoin(brands, eq(products.brandId, brands.id))
  .leftJoin(categories, eq(products.categoryId, categories.id))
  .leftJoin(reviews, eq(products.id, reviews.productId)) // 4th Join!
  .where(eq(products.category, "ssd"));
```

### Preferred Pattern (Hydration)

```typescript
// ✅ DO THIS
// 1. Fetch main products with essential joins (< 3)
const baseProducts = await db
  .select(liteProductColumns)
  .from(products)
  .leftJoin(prices, eq(products.id, prices.productId))
  .where(eq(products.category, "ssd"));

// 2. Hydrate supplementary data (e.g., from Cache or a specific lookup)
const enrichedProducts = await Promise.all(
  baseProducts.map(async (p) => {
    const reviews = await getReviewsForProduct(p.id); // O(1) or Cache
    return { ...p, reviews };
  }),
);
```

## Stability Shield Integration

All queries using the hydration pattern should still be wrapped in `withRetry` or called via high-level data utilities that handle retries and bot-shielding.

- **Human Users**: Perform full hydration.
- **Bots/Crawlers**: Skip heavy hydration steps to save resources.
