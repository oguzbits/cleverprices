# Production Stability & Deployment Guide

This document captures "hard-won" lessons learned while scaling CleverPrices to production on Self-Hosted Docker (Hetzner) with a bundled SQLite database.

## 1. SQLite on Docker (Performance & Persistence)

When running SQLite in a containerized environment (Dokploy/Docker), the following rules apply:

### The `WAL` Mode Trap

By default, modern SQLite uses **WAL (Write-Ahead Logging)** mode. This mode requires creating two sidecar files (`-wal` and `-shm`) next to the `.db` file upon opening.

- **Symptom**: Search fails with "500 Internal Server Error" or "Read-Only Filesystem" errors if the volume is not mounted correctly.
- **Solution**: The production database should be kept in `WAL` mode for performance, but handled carefully in volumes.
- **Fix**: In `scripts/database/optimize-db.sh`, we use:
  ```bash
  sqlite3 data/cleverprices.db "PRAGMA journal_mode = WAL;"
  ```

---

## 6. Local-First Architecture

CleverPrices uses a unified local-first architecture for maximum performance and low operational cost.

### The Unified Database (`cleverprices.db`)

- **Location**: Persistent Docker volume mounted at `/app/data/cleverprices.db`.
- **Writes**: Performed by the **Maintenance Worker** (Dokploy Cron Task).
- **Reads**: Performed by the **Next.js Web Server** ($0 cost, near-zero latency).
- **Backups**: Periodically synced to Cloudflare R2.

### 6.1 Build-Time Isolation

To maintain high deployment velocity and image portability:

- The `.db` file is **not present** during the `next build` phase.
- This is enforced via `.dockerignore`.
- **Why**: Prerendering 7,000+ pages during build would take 20+ minutes and risk baking stale local data into the production image.
- **Optimization**: We use a **Warm-Static Architecture**. Instead of baking data during build, the `warm-cache` script proactively hydrates the runtime cache after deployments and price updates.
- **The Warmer**: Triggered automatically by `update-prices.ts` and the **Keepa Worker**.

---

## 8. The Performance Baseline

To protect the user experience and SEO rankings:

1. **Safety Cutoff**:
   Implement a `Promise.race` in the `dbReady` logic if syncing from cloud.
2. **Weekly Freshness**:
   Update the production database at least once a week via `db:push-prod`.
3. **1-Minute Price Freshness**:
   All category and product pages must use a **60-second stale window**. This ensures that price discrepancies between pages last no longer than 1 minute, maintaining parity with the 20-minute Keepa update cycle.

---

## 9. Safe Warming (Resource Protection)

To prevent the cache warmer from competing with real user traffic or search engine crawlers:

- **CPU Monitoring**: The `warm-cache` script monitors `os.loadavg()`.
- **Backoff**: If CPU load exceeds 95% of available capacity, the warmer pauses for 10 seconds.
- **Priority**: Users and Googlebot always get priority over background rendering cycles.

## 10. SQLite Performance Tuning

For maximum query speed on the bundled Lite DB, CleverPrices uses several optimization strategies.

### 9.1 PRAGMA Settings

These are configured in `src/db/index.ts`:

| PRAGMA         | Value             | Benefit                                     |
| :------------- | :---------------- | :------------------------------------------ |
| `cache_size`   | `-200000` (200MB) | Huge buffer for repeat reads                |
| `mmap_size`    | `268435456`       | Entire 40MB DB fits in Memory Map (No disk) |
| `busy_timeout` | `5000`            | Prevents lock errors on concurrent access   |

### 9.2 Index Strategy

Indexes are defined in `src/db/schema.ts`. Key principles:

- **Filter columns get indexes**: `category`, `brand`, `technology`.
- **Sort columns get indexes**: `salesRank`, `rating`, `normalizedCapacity`.
- **Composite indexes for common queries**: `(category, salesRank)` for "Popular in Category".

### 9.3 When to Add an Index

Add an index if:

1. A column is used in a `WHERE` clause or `ORDER BY`.
2. The column has high cardinality (many unique values).
3. The query runs frequently (e.g., on every page load).

## **Avoid over-indexing**: Each index increases write time and database size. Only index what you query.

## 10. Hydration & Rendering Patterns

To keep the application fast as it grows, we use specific patterns to defer non-critical rendering.

### 10.1 The "Lazy Server" Pattern

We often need to lazy-load complex sections (like carousels) without losing the SEO benefits of **Server Components**.

- **Structure**:
  ```tsx
  <LazySection rootMargin="0px">
    <CachedCarouselFromServer />
  </LazySection>
  ```
- **Why**: `LazySection` is a small Client Component that uses `IntersectionObserver`. It only renders its `children` when visible. Since the children are passed in from a Server Component parent, they remain server-rendered HTML, but their hydration and image-fetching are deferred until they hit the viewport.

### 10.2 Viewport Conservative Baselines

Instead of using heavy client-side hooks (`useWindowSize`) to determine how many items fit a grid, we use a **Conservative Baseline**.

- **Standard**: Always set `priority` for only the first **2 items** (`index < 2`).
- **Effect**:
  - **Mobile**: First row is prioritized perfectly.
  - **Desktop**: First row is halfway prioritized; the browser's native lazy-loader handles the remaining 2 visible items instantly.
- **Benefit**: No "Hydration Mismatch" errors and zero dependency on client-side measurement hooks.

### 10.3 Balanced Typography (CLS vs. Brand)

We use `display: "swap"` for fonts to ensure brand consistency (Inter) while relying on Next.js's automatic font-metric matching to minimize Cumulative Layout Shift.

- **Pattern**: `display: "swap"` in `RootLayoutWrapper.tsx`.
- **Preload**: Set `preload: true` to ensure the font is requested early in the critical path.

### 10.4 CSS-First Interactivity

Avoid using JavaScript for purely visual elements like "hiding scrollbars" on carousels.

- **Solution**: Use the `.scrollbar-hide` utility class in CSS.

---

## 11. Network Performance & Compression

CleverPrices offloads all response compression to the **Traefik** reverse proxy to maintain low CPU overhead on the Next.js process and support high-performance **Brotli** compression.

### 11.1 The "Offloaded Compression" Strategy

- **Next.js Config**: `compress: false` is set in `next.config.ts`.
- **Reason**: Next.js internal compression is performed by the Node.js process, which is less efficient than the multi-threaded Go-based Traefik compression middleware.

### 11.2 The RSC Compression Trap

Modern Next.js applications rely heavily on **React Server Component (RSC)** payloads for navigation.

- **Content-Type**: `text/x-component`.
- **Discovery**: Most default Traefik or Nginx compression configs only include standard types (HTML, JS, CSS).
- **Critical Fix**: The Traefik `compress` middleware **MUST** explicitly include `text/x-component` in the `includedcontenttypes` list. Failing to do this results in large, uncompressed data transfers during page navigations, significantly hurting performance.

### 11.3 Bundle Hygiene & Main Thread Optimization

To ensure a "Premium/Idealo" feel with no stutters (TBT < 50ms):

- **Modern JS Target**: The `tsconfig.json` target is set to **ES2022**. This ensures clean, modern syntax and saves ~15-20 KiB by avoiding legacy polyfills.
- **Lazy Mounting & Hydration**: Use `LazySection` with a **300px rootMargin**. This ensures that heavy components (like Carousels) are mounted _before_ they enter the viewport, but _after_ the critical above-the-fold content is interactive.
- **Dynamic Consolidation**: Avoid "Double Bundling". Use **Shared Dynamic Loaders** (like `DynamicProductCarousel.tsx`) for components used across multiple pages to ensure they consistently live in a dynamic chunk, preventing transitive static paths from pulling them into the main bundle.
- **Sentry Tuning**: Sentry is configured to exclude `Replay`, `Worker`, and `ShadowDom` modules to keep the initial JS execution task under the 50ms "blocking" threshold.

---

## 12. Zero-Loading Navigation Architecture

To achieve an **Idealo-like** experience where navigations feel instant and "never blink," CleverPrices uses a **Shell-First Rendering** pattern.

### 12.1 The "Shell-First" Pattern

Instead of making the entire Page component `async` and awaiting data at the top (which blocks navigation), we split the rendering:

1.  **Synchronous Shell**: The main Page component handles elements that don't depend on heavy data (Metadata, Breadcrumbs, Shared UI). This ensures the Next.js router can **commit the navigation immediately**, updating the URL.
2.  **Asynchronous Content**: Heavy data-dependent components (Product Lists, Filter Panels) are moved into internal `async` components wrapped in `<Suspense fallback={null}>`.
3.  **Non-Blocking Promises**: Pass the `searchParams` promise directly to consumers. Awaiting it in the entry "Shell" triggers a server-side block that "freezes" the browser during navigation.

### 12.2 Router Cache Strategy

We explicitly enable `staleTimes` in `next.config.ts`:

```ts
experimental: {
  staleTimes: {
    dynamic: 30, // Prevents "Frozen UI" on back/forward
    static: 300,
  }
}
```

### 12.3 Failures to Avoid

Significant regressions have occurred when attempting to "simplify" this logic. Always consult [FAILED_ATTEMPTS.md](./archive/FAILED_ATTEMPTS.md) before modifying:

- **Do not** use manual `router.prefetch()` in hover events.
- **Do not** disable `staleTimes` for dynamic routes.
- **Do not** await heavy data in the component that acts as the navigation entry point.

### 12.4 Build Guardrails: "Blocking Routes"

In Next.js 16, accessing dynamic server data (like `connection()`, `cookies()`, or `searchParams`) outside of a `<Suspense>` boundary will crash the build.

- **Rule**: Every `async` component or component using dynamic functions **MUST** have a `Suspense` ancestor.
- **Safety Net**: The root `Suspense` boundary in `src/app/layout.tsx` is mandatory. Do not remove it to "optimize" for TBT; instead, optimize child components to be synchronous.
- **`use cache` Interaction**: Components using the `use cache` directive are particularly sensitive during build-time pruning. Ensure they are correctly suspended.
