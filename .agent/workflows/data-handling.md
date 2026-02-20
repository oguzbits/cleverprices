---
description: Best practices and methods for fetching, filtering, and joining data in SQLite
---

# 🧠 Optimal Data Handling Workflow

This workflow ensures that database queries and data transformations do not introduce Time To First Byte (TTFB) bottlenecks, particularly regarding SQLite handling. It should be applied whenever modifying or creating new data-fetching logic.

## 1. Avoid Heavy Cross-Joined Filtering & Sorting in SQLite

Due to how SQLite executes joins with dynamically calculated fields, executing complex Math operations or ordering on joined tables can trigger full table scans and slow `FILESORT` operations in memory.

**❌ BAD PATTERN (Slow TTFB):**

- Returning full objects from `products` and `prices` using `innerJoin`.
- Executing a `where` clause mathematical formula (e.g. comparing averages).
- Executing an `orderBy` on a mathematical formula.

**✅ GOOD PATTERN (Fast TTFB - Two-Step Query):**

1. **Lightweight ID Fetch:** Query only the _minimum_ required table (like `prices` or just `products.id`) using a single `select`.
2. **In-Memory Sort:** Pull those lightweight rows into Node.js (V8 engine) and perform math/sorting in memory. Map them to an array of just the target IDs (e.g., `topIds`).
3. **Heavy Data Fetch:** Do the heavy `innerJoin` query using an `inArray(products.id, topIds)` constraint.
4. **Resort:** Sort the resulting full objects back into the correct order based on the `topIds` array.

## 2. Utilize Lean Columns

When querying product listings or category pages, always use the pre-defined stripped-down columns to prevent massive JSON string parsing costs:

- `liteProductColumns`
- `litePriceColumns`
- `superLitePriceColumns` (for variant chips)

Never query `products.specifications` or `products.officialSpecifications` or `prices.historyJson` when assembling a list of products.

## 3. Use Stable Next.js 16 Caching

Replace legacy Next.js cache mechanisms (`unstable_cache`) with the modern React 19 `'use cache'` directive combined with a synchronized `cacheLife('category')` or `cacheLife('products')` profile matching the architecture policy.

## 4. Ensure DB Build Safeties

Every data-fetching function must gracefully exit during the Next.js static build phase. Standardize the following at the very top of your server queries to prevent build-time crashes:

```typescript
import { IS_BUILD } from "@/db";

if (IS_BUILD) return [];
```

## 5. Measure First

If you suspect a TTFB reduction goal is needed, always measure the raw SQLite execution cost locally before adding Suspense or Streaming.
