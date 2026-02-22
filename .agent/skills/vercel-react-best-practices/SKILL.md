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

### Zero-Flicker Rendering (Cohesive SSR)

Avoid user-visible skeletons (pulse elements) or route-level `loading.tsx` for core landing pages (Category/PDP).

- **Pattern**: Await data on the server and render the complete view.
- **Why**: Layout stability (Zero CLS) and a premium "Idealo-style" stability are preferred over incremental streaming.
- **Implementation**:
  - Delete `loading.tsx` for the route.
  - Await the main data fetching in the page component.
  - No `Suspense` placeholders that cause layout shifts.

**Benefits**: Smooth transitions, zero layout shift, and immediate stability.

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
- **Safe Warming**: Ensure the warmer monitors `os.loadavg()` to avoid competing with real traffic or Google crawlers.

### 5. Network Compression (CRITICAL)

- **Offload Compression**: Set `compress: false` in `next.config.ts`.
- **External Handler**: All compression (Brotli/Gzip) must be handled by the reverse proxy (Traefik).
- **RSC Payloads**: The proxy **MUST** include `text/x-component` in its allowed compression types. Missing this will result in massive uncompressed data transfers during navigations.

---

## Examples

See real implementations in the codebase:

- `src/lib/server/cached-products.ts` - Cache component patterns
- `src/components/HomeContent.tsx` - File-level caching
- `src/components/product/IdealoProductPage.tsx` - Function-level caching
