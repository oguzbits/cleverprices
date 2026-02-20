# SKILL: CleverPrices Quality Audit

This skill provides a checklist and set of rules for auditing code changes in the CleverPrices project to ensure adherence to architectural, performance, and stability standards.

## 🏁 How to Use

Run this audit whenever you:

1. Finish a feature.
2. Refactor core logic.
3. Review a PR.

## 🏆 The "Golden Rules" Check

### 1. Stability (Rule of Link Equity)

- [ ] If a product or category is missing, do we **301 redirect** to the most relevant parent? (See `architecture/STABILITY_GUIDE.md`)
- [ ] Are we using `resolveProductFromRoute` or similar helper that handles 404s gracefully?

### 2. Performance (O(N) Complexity)

- [ ] **NO for-in-for**: Ensure nested loops over large datasets (products, prices) are avoided. Use Map lookups or single-pass algorithms.
- [ ] **SELECT only what you need**: Are you using `liteProductColumns` or `litePriceColumns`?
- [ ] **Unbounded Parallelism**: Use `p-limit` or chunked loops for API calls/DB writes. Max 5 concurrent operations.

### 3. Next.js 16 / React 19 Patterns

- [ ] **NO `useMemo`, `useCallback`, `React.memo`**: The compiler handles this. Remove them if you see them.
- [ ] **NO `middleware.ts`**: Use `proxy.ts`.
- [ ] **"use cache"**: Is it applied to data fetching functions to ensure SSR speed?
- [ ] **"use client"**: Only applied to interactive components.

### 4. Database Safety

- [ ] **IS_BUILD Guard**: Does the code skip DB operations during the build phase (`if (IS_BUILD) ...`)?
- [ ] **dbReady**: Are you awaiting `dbReady` before executing queries in server functions?

### 5. SEO & URLs

- [ ] **Centralized URLs**: Use `src/lib/utils/url.ts` for all product and category URLs.
- [ ] **Canonical Alignment**: Ensure canonical tags match the sitemap and JSON-LD URLs exactly.

## 🛠️ Performance Baseline

Aim for these targets in production:

- **TTFB**: < 500ms for category pages (cached).
- **LCP**: < 2.5s on mobile.
- **CLS**: < 0.1 (use skeletons for dynamic charts).

---

_Trigger: "review my UI", "audit performance", "check against guidelines", "Is this PR good?"_
