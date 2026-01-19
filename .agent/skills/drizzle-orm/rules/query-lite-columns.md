# Lite Columns Pattern

When querying products or prices for list views (category pages, search results, deals), use "lite" column selections to exclude heavy fields and reduce read costs.

## Why This Matters

| Query Type                                     | Columns                       | Read Cost |
| ---------------------------------------------- | ----------------------------- | --------- |
| Full `db.query.products.findMany()`            | All (~25 cols + JSON blobs)   | HIGH      |
| `db.select(liteProductColumns).from(products)` | Essential (~18 cols, no JSON) | LOW       |

Heavy fields like `rawData`, `features`, `description` can be 10-50KB per row. Excluding them saves significant bandwidth and read costs.

## Implementation

Define lite column objects in a central location:

```typescript
// Lightweight price columns - excludes rarely-used fields
export const litePriceColumns = {
  id: prices.id,
  productId: prices.productId,
  country: prices.country,
  amazonPrice: prices.amazonPrice,
  newPrice: prices.newPrice,
  usedPrice: prices.usedPrice,
  listPrice: prices.listPrice,
  priceAvg30: prices.priceAvg30,
  priceAvg90: prices.priceAvg90,
  currency: prices.currency,
  lastUpdated: prices.lastUpdated,
  // EXCLUDED: amazonPriceFormatted, warehousePrice, priceMin, priceMax,
  //           pricePerUnit, availability, deliveryTime, deliveryCost, source
};

// Lightweight product columns for list views
export const liteProductColumns = {
  id: products.id,
  asin: products.asin,
  slug: products.slug,
  title: products.title,
  brand: products.brand,
  category: products.category,
  imageUrl: products.imageUrl,
  capacity: products.capacity,
  // ... essential fields only
  // EXCLUDED: rawData, features, description
};
```

## Usage

```typescript
// ✅ Good: Lite columns for list views
const prods = await db.select(liteProductColumns).from(products).where(...);
const prs = await db.select(litePriceColumns).from(prices).where(...);

// ❌ Bad: Full select for list views
const prods = await db.query.products.findMany({ where: ... });
```

## When to Use Full Columns

Only fetch all columns on **single product detail pages** where you need:

- Feature lists (`features`)
- Full description (`description`)
- Specifications JSON (`specifications`)

See [product-registry.ts](file:///Users/oguz/Desktop/Dev/cleverprices/src/lib/product-registry.ts) for the canonical implementation.
