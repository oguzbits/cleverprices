---
description: Analyze and improve Fast LCP, TTFB, and React bundle sizes
---

# ⚡ Performance Tuning

This workflow focuses on the physical speed of the application, prioritizing mobile-first rendering optimizations.

## 1. Apply React Vercel Best Practices

Utilize the `vercel-react-best-practices` skill during development.

- The assistant should proactively cross-reference components against this skill.
- Goals: Leverage React Cache, deduplicate fetch requests, and minimize "use client" components.

## 2. Bundle Analyzer

Run the Next.js Bundle Analyzer to spot large dependencies dragging down metrics.

```bash
ANALYZE=true bun run build
```

## 3. Metric Checks (LCP & TTFB)

If a user requests a performance fix, address the core trio:

- **Images:** Ensure `next/image` is used optimally. Product images must not block LCP.
- **SQL:** Trace slow SQLite queries impacting TTFB.
- **Caching:** Ensure Redis is catching the request before the DB.

## 4. Lighthouse Audit

Use the Browser Subagent to open DevTools, run a Lighthouse score check on the local dev server, and retrieve the metrics.
