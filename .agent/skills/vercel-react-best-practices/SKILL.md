---
name: vercel-react-best-practices
description: >
  React and Next.js performance optimization for CleverPrices.
  TRIGGERS: Writing React components, Next.js pages, data fetching, or performance work.
  CRITICAL: This project uses Next.js 16 with React Compiler and Cache Components.
version: "2.0.0"
---

# Vercel React Best Practices

## ⚠️ Next.js 16 Specifics

This project uses **Next.js 16.0.10** with special features:

| Feature                 | Status         | Notes                                    |
| ----------------------- | -------------- | ---------------------------------------- |
| `middleware.ts`         | **DEPRECATED** | Do NOT create/use                        |
| React Compiler          | **ENABLED**    | No manual useMemo/useCallback/React.memo |
| `'use cache'` directive | **PRIMARY**    | Use with `cacheLife()`                   |
| `cacheComponents: true` | **ENABLED**    | In next.config.ts                        |
| Runtime / PKG Mgr       | **BUN**        | Use `bun run`, NOT `npm` or `pnpm`       |

---

## 🚫 BANNED (Never Use)

| Pattern                     | Why                       | Use Instead                              |
| --------------------------- | ------------------------- | ---------------------------------------- |
| `middleware.ts`             | Deprecated in Next 16     | Route handlers, server actions           |
| `useMemo()`                 | React Compiler handles    | Remove it                                |
| `useCallback()`             | React Compiler handles    | Remove it                                |
| `React.memo()`              | React Compiler handles    | Remove it                                |
| `fetchCache` export         | Deprecated                | `'use cache'` directive                  |
| Full SSG for large catalogs | Build timeout             | ISR with `cacheLife()`                   |
| `await import()` in RSC     | Blocks Compiler, SLOW     | Static top-level `import`                |
| `useEffect` State Sync      | Blocks Compiler, Cascades | Render-phase state sync (if (p!=s) setS) |

---

## ✅ REQUIRED Patterns

### Caching (Next.js 16)

```typescript
"use cache";
import { cacheLife } from "next/cache";

export async function getCategoryProducts() {
  cacheLife("category"); // Profile from next.config.ts
  // ... data fetching
}
```

### Zero-Flicker Rendering (Hold-First Pattern)

Avoid user-visible skeletons or flickering "shells" where headers load before content. Instead, use a **Hold-First** approach to ensure the browser holds the current page until the next one is ready.

- **Pattern**: Make the main Page component `async` and `await` all critical data (including the `connection()` signal) at the top level.
- **Why**: Next.js 15+ navigation "holds" the transition while a Server Component is executing. For a premium/Idealo experience, it is better to stay on the current page for 100-300ms than to show a flickering blank shell.
- **Dynamic Signal**: Use `await connection()` from `next/server` to signal dynamic rendering without causing build-time crashes (Next.js 16 requirement).
- **Router Cache**: Always set `staleTimes.dynamic` to `30s` in `next.config.ts`. This ensures that when the data is warmed in Redis, the navigation "hold" is near-instant (<100ms).
- **Implementation**:
  - Main Page component **MUST** be `async`.
  - Await `searchParams` and `connection()` at the top.
  - Do NOT use route-level `loading.tsx` for core catalog pages.

**Benefits**: One-click, seamless transitions where the screen "jumps" to the fully loaded next page, eliminating the cheap-feeling flicker of progressive shells.

### Image Optimization

```tsx
// ✅ Always include sizes prop
<Image
  src={url}
  width={300}
  height={200}
  sizes="(max-width: 768px) 100vw, 300px"
/>
```

---

## Rules by Priority

### 1. Eliminating Waterfalls (CRITICAL)

- `async-parallel` - Use Promise.all() for independent operations
- `async-suspense-boundaries` - Stream content

### 2. Bundle Size (CRITICAL)

- `bundle-barrel-imports` - Import directly, avoid barrel files
- `bundle-dynamic-imports` - Use next/dynamic for heavy components

### 3. Server-Side Performance (HIGH)

- `server-cache-react` - Use `react.cache()` for per-request deduplication of data fetching.
- `server-deduplication` - Wrap shared logic (like `resolveProductFromRoute`) in `cache()` to prevent redundant metadata vs. page DB queries.

### 4. Warm-Static Architecture (CRITICAL)

- **Do NOT rely on build-time SSG** for large catalogs (database is excluded from build).
- **Proactive Hydration**: Trigger the `warm-cache` script after deployments and price updates.
- **Price Freshness**: Category and product pages must have a **60-second stale window** to ensure site-wide price consistency during the 20-minute Keepa update cycle.
- **Safe Warming**: Ensure the warmer monitors `os.loadavg()` to avoid competing with real traffic or Google crawlers.

### 5. Network Compression (CRITICAL)

- **Offload Compression**: Set `compress: false` in `next.config.ts`.
- **External Handler**: All compression (Brotli/Gzip) must be handled by the reverse proxy (Traefik).
- **RSC Payloads**: The proxy **MUST** include `text/x-component` in its allowed compression types. Missing this will result in massive uncompressed data transfers during navigations.

### 6. Bundle Hygiene & Dynamic Imports (CRITICAL)

- **No Double-Bundling**: Never import a component statically at the top of a file if you also plan to import it using `next/dynamic` later in the same file.
- **Shared Dynamic Loaders**: If a heavy component (e.g., Carousel, Chart) is used across multiple pages, move the `dynamic()` definition to a shared file (e.g., `DynamicProductCarousel.tsx`) to ensure it's always loaded via its dynamic chunk and never accidentally pulled into a main bundle via a transitive static import.
- **Type-Only Imports**: Always use `import type` for interfaces, types, and metadata objects from other modules. This ensures the module doesn't accidentally get pulled into the runtime bundle.
- **Lazy Loading Strategy**: Use `LazySection` with a healthy `rootMargin` (e.g., 300px) for below-the-fold content. This prevents heavy React mounting tasks (Long Tasks) from blocking the main thread during initial page load.
- **Package Optimization**: Ensure `optimizePackageImports` in `next.config.ts` includes heavy libraries like `lucide-react` and Radix UI.
- **Modern Target**: Target `ES2022` or higher in `tsconfig.json` to reduce polyfill weight for modern browsers.

---

## Examples

See real implementations in the codebase:

- `src/lib/server/cached-products.ts` - Cache component patterns
- `src/components/HomeContent.tsx` - File-level caching
- `src/components/product/IdealoProductPage.tsx` - Function-level caching
