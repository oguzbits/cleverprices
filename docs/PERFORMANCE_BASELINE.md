# Performance Baseline

Documented performance targets and resource budgets for CleverPrices.

---

## Core Web Vitals Targets

| Metric                              | Target  | Current | Notes                             |
| ----------------------------------- | ------- | ------- | --------------------------------- |
| **LCP** (Largest Contentful Paint)  | < 2.5s  | TBD     | Hero image, fonts                 |
| **CLS** (Cumulative Layout Shift)   | < 0.1   | TBD     | Reserve space for dynamic content |
| **INP** (Interaction to Next Paint) | < 200ms | TBD     | Defer non-critical JS             |
| **PageSpeed Score**                 | 90+     | TBD     | Mobile & Desktop                  |

---

## Turso Resource Budget

### Monthly Limits (Free Tier)

| Resource | Limit     | Safety Threshold                   |
| -------- | --------- | ---------------------------------- |
| Reads    | 500M rows | Use liteColumns, keyset pagination |
| Writes   | 10M rows  | Value-diff, abort if > 500K/run    |

### Per-Operation Budget

| Operation                      | Reads | Writes | Notes                                  |
| ------------------------------ | ----- | ------ | -------------------------------------- |
| `update-prices.ts` (per run)   | ~50K  | ~10K   | Value-diffing reduces writes           |
| `enrich-products.ts` (per run) | ~30K  | ~50K   | History inserts                        |
| `deploy-data.ts --delta`       | ~10K  | ~20K   | Incremental sync                       |
| `pull-data.ts`                 | ~2.5M | 0      | Full table pull (rare)                 |
| Homepage load                  | ~500  | 0      | Cached after first hit                 |
| Category page                  | ~1K   | 0      | Cached via ISR                         |
| Product page                   | ~2-10 | 0      | O(1) indexed fetch + parallel variants |

### Monthly Projection

| Script          | Frequency      | Monthly Reads | Monthly Writes     |
| --------------- | -------------- | ------------- | ------------------ |
| update-prices   | 24x/day        | 36M           | 7.2M               |
| enrich-products | 24x/day        | 21.6M         | - (skip if seeded) |
| Organic traffic | 10K visits/day | 30M (cached)  | 0                  |
| **Total**       |                | **~90M**      | **~7.2M**          |

> ⚠️ Stay well under 500M reads and 10M writes.

---

## Keepa Token Budget

| Resource           | Limit        | Safety                         |
| ------------------ | ------------ | ------------------------------ |
| Token regeneration | 20/min       | Wait if < 10 tokens            |
| Hourly cap         | 1,200 tokens | Reserve 100 for enrichment     |
| Products per token | 1-5 (varies) | Batch 50 products per API call |

### Per-Script Allocation

| Script          | Tokens/Run | Products/Run | Notes               |
| --------------- | ---------- | ------------ | ------------------- |
| update-prices   | ~150       | 300-500      | Stale products only |
| enrich-products | ~100       | 100-200      | Unseeded only       |

---

## Platform Limits (Docker/Node.js)

| Resource             | Limit                     | Mitigation                        |
| -------------------- | ------------------------- | --------------------------------- |
| Serverless Timeout   | 10s (Default) / 60s (Max) | Streaming, Suspense               |
| Function Invocations | 1 Million / month         | Caching with `use cache`          |
| Active CPU Time      | 4 Hours / month           | Efficient algorithms, liteColumns |
| Bandwidth            | 100 GB / month            | Image optimization, CDN           |
| Build Time           | 45 min / deployment       | ISR, skip heavy SSG               |
| Edge Function Size   | 1 MB                      | Minimal dependencies              |

---

## Measurement Schedule

| Metric             | Tool                  | Frequency                    |
| ------------------ | --------------------- | ---------------------------- |
| PageSpeed          | PageSpeed Insights    | Weekly                       |
| Bundle Size        | @next/bundle-analyzer | Per deploy                   |
| Turso Usage        | Turso Dashboard       | Daily (during quota concern) |
| Dokploy Monitoring | Dokploy Dashboard     | Weekly                       |
