# Universal Hub Parity (900M+ Strategy)

## Overview
To resolve persistent indexing mismatches and "Duplicate without user-selected canonical" errors in Google Search Console, CleverPrices enforces a strict **Universal Hub Parity** strategy. This strategy collapses all product variants (New, Used, Renewed, and different physical versions) into a single, stable canonical identity prefixed with `900,000,000`.

## Architectural Rules

### 1. The 900M+ Identity Space
*   **Legacy IDs**: Database primary keys (e.g., `12345`) or legacy variant IDs (e.g., `200,001,234`).
*   **Canonical Hub IDs**: Any product ID >= `900,000,000`.
*   **Formula**: `900,000,000 + family_id` (or `900,000,000 + base_id` for singles).

### 2. Strict URL Generation
All internal links MUST be constructed using the `getProductPath` utility:
```typescript
// src/lib/utils/url.ts
export function getProductPath(id: number | string, slug: string) {
  const numericId = typeof id === 'string' ? parseInt(id) : id;
  const canonicalId = numericId < 900000000 ? 900000000 + numericId : numericId;
  return `/p/${canonicalId}/${slug}`;
}
```
**Never** manually concatenate `/p/${id}/${slug}` in components.

### 3. Rendering & Redirect Enforcement
The PDP rendering engine (`getPDPRenderData`) acts as the final gatekeeper:
1.  **Incoming ID Check**: If the requested ID is `< 900,000,000`, the server immediately performs a **301 Permanent Redirect** to the canonical 900M+ path.
2.  **Breadcrumb Consistency**: Breadcrumbs must use the 900M+ path for the "current" page link.
3.  **Canonical Tag**: The `<link rel="canonical">` must always reflect the 900M+ URL.

### 4. Sitemap Integrity
The sitemap generator must exclusively list 900M+ IDs. Individual variants (200M+) are prohibited from the sitemap to prevent "URL leakage" and crawl budget waste.

### 5. Cache Invalidation
When modifying the ID structure or redirection logic, the `GLOBAL_SALT` in `src/lib/server/cached-products.ts` must be incremented to flush the `unstable_cache` layer across the edge.

## Implementation Checklist
- [x] Update `getProductPath` to enforce prefix.
- [x] Update `ConditionButtons.tsx` to use the utility.
- [x] Audit `ProductVariantSelector.tsx` links.
- [x] Verify `getPDPRenderData` redirect logic.
- [x] Increment `GLOBAL_SALT`.
- [x] Update SEO Skill for AI memory.
