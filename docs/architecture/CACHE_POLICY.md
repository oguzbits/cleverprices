# Cache & Freshness Policy (Single Source of Truth)

## 🎯 Objective

To ensure **Absolute Price Consistency** across all pages of CleverPrices. A product must NEVER show a different price on a Category page than it does on a Product Detail Page (PDP).

## 🛡️ The "Golden Rule"

> [!IMPORTANT]
> **Inner Cache (Data) must always be fresher than Outer Cache (Pages).**
> If you change a TTL for a page, you MUST ensure the underlying data layer is synchronized or faster.

## 🕒 TTL Configuration (Standardized)

All cache profiles are defined in [next.config.ts](../../next.config.ts).

| Profile    | Layer       | Revalidate | Stale | Expire | Use Case                               |
| ---------- | ----------- | ---------- | ----- | ------ | -------------------------------------- |
| `prices`   | **Data**    | 10m (600s) | 600s  | 1h     | Shared price fetching (`live-data.ts`) |
| `category` | **Page**    | 15m (900s) | 900s  | 1d     | `/[categorySlug]` pages                |
| `product`  | **Page**    | 15m (900s) | 900s  | 1d     | `/p/[slug]` pages                      |
| `dynamic`  | **Overlay** | 10m (600s) | 600s  | 1h     | Search results, filtered views         |
| `static`   | **Meta**    | 24h        | 24h   | 30d    | Sitemaps, categories list              |

## 🛠️ Implementation Guardrails

### 1. Price Consistency Check

Whenever modifying a page component:

- Ensure it uses `cacheLife("category")` or `cacheLife("product")`.
- Verify that sub-data fetching (via `live-data.ts`) uses `cacheLife("prices")`.

### 2. Synchronization Window

The maximum discrepancy window between any two views is **15 minutes**. This aligns with our 20-minute price update cycle from Keepa.

### 3. Absolute Priority

If a build or a change introduces a risk of "Stale Hijacking" (where a page stays cached with old prices while others update), it must be rejected.

## 🏗️ Static Generation Strategy

### Warm-Static Architecture

CleverPrices uses a **"Warm-Static"** model for PDPs and Category pages.

- **Build Phase**: The database is intentionally **excluded** from the Docker build context (via `.dockerignore`) to favor thin, portable images. `generateStaticParams` returns placeholders.
- **Warming Phase**: After every deployment or price update (Keepa Worker), we trigger the `warm-cache` script.
- **Runtime**:
  1. The page is proactively rendered in the background by the warmer.
  2. It is frozen into the **Cache Life Layer** (15 minutes).
  3. Real users (and Google) always hit **Static Cache** with < 40ms TTFB.

This strategy combines the speed of SSG with the freshness of a dynamic app, without the long build times.
