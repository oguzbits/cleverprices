---
description: Master audit for performance, SEO, React, and data health benchmarks
---

# 🏆 Project Benchmarks Audit

This is the holistic "Check Engine" workflow. It combines various disciplines to ensure CleverPrices meets its strict operational benchmarks.

## 1. Performance Benchmarks

We compete on speed. Mobile users expect immediate loads.

- **LCP (Largest Contentful Paint)**: Must be under 2.5s.
  - _Check:_ Are Hero images unoptimized? Is the SQLite DB blocking the initial render? (Refer to `/performance`).
- **TTFB (Time To First Byte)**: Must be fast via Redis/Static Generation.
  - _Check:_ Ensure `generateStaticParams` uses the DoD (Dynamic-on-Demand) policy to avoid slow build-time hydration.

## 2. React / Code Quality Benchmarks

CleverPrices uses Next.js 16 and React Compiler.

- **Rule Adherence**: The codebase must pass the `react-doctor` skill checks.
  - No unnecessary `useMemo` or `useCallback`.
  - No "use client" boundaries placed too high in the component tree.
- **Types**: Zero `tsc --noEmit` errors. (Refer to `/code-quality`).

## 3. SEO & Semantic Benchmarks

If we don't rank, we don't earn.

- **Rules**: Must pass the `modern-seo` skill.
  - One `<h1>` per page.
  - Clean URL slugs (`/produkt/canonical-name`).
  - No old routes appearing in `sitemap.xml`. (Refer to `/seo`).

## 4. Data Health Benchmarks

If product data is corrupt, the user loses trust.

- **Check**: Run `bun run quality:report` and `bun run sif:audit`.
  - Orphaned variants or inactive parent models must be culled. (Refer to `/maintenance`).

## Execution

When asked to run `/benchmarks`, the AI Agent should execute a comprehensive scan encompassing the localized tests in `bun test src`, the React compiler rules, bundled size reports, and SEO metadata verifications.
