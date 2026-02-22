---
description: Analyze and improve Fast LCP, TTFB, and React bundle sizes
---

# ⚡ Performance Tuning

This workflow focuses on the physical speed of the application, prioritizing mobile-first rendering optimizations and React Compiler health.

## 1. Compliance Audit (React Doctor)

Always run the React Doctor before large performance pushes to find hidden re-renders and compiler bypasses.

// turbo

```bash
bun run audit:react
```

- **Goal**: Maintain 90+ health score.
- **Check**: Look for "React Compiler: Bypassed" warnings. These indicate manual `useMemo` or complex patterns blocking optimization.
- **Compiler Compliance**: verify code against [vercel-react-best-practices](file:///Users/oguz/Desktop/Dev/cleverprices/.agent/skills/vercel-react-best-practices/SKILL.md) to ensure no `await import()` in RSC or redundant `useEffect` syncing.

## 2. Zero-Flicker Directive (UX Stability)

CleverPrices prioritizes a premium, stable feel (Zero CLS).

- **Rule**: Do NOT use `loading.tsx` or skeletons for core Category and PDP routes.
- **Check**: Ensure data is awaited on the server and passed to the component.
- **Verification**: Use the "Network Throttle" (3G) in Browser Tools. The page should wait, then display fully formed (no height jumping).

## 3. Bundle Analyzer

Spot large dependencies or unnecessary Client Components.

// turbo

```bash
bun run perf:analyze
```

- **Action**: Use `next/dynamic` for heavy visual components (Charts, Modals) that aren't above the fold.
- **Action**: Check if `@sentry/nextjs` is dragging down the client-side bundle; optimize its init if necessary.

## 4. TTFB & Cache Warmth

If TTFB (Time to First Byte) is > 200ms on warm pages:

- **Check**: Is `cacheLife()` applied effectively to the data fetcher?
- **Action**: Run the cache warmer to prime Redis.
  ```bash
  bun run warm-cache
  ```
- **Optimization**: Verify SQLite WAL mode and checkpoint status if DB reads are slow.

## 5. Automated Verification (Lighthouse)

Use the Browser Subagent to run a mobile Lighthouse score check on the local dev server.

- **KPI**: LCP < 2.5s (Mobile).
- **KPI**: TTFB < 100ms (Warm Cache).
- **KPI**: CLS < 0.1.
