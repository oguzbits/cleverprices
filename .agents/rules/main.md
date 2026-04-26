---
trigger: always_on
---

# CleverPrices Global Agent Rules (Audited & Finalized)

These rules apply to EVERY prompt. They represent the architectural and design "North Star" of the project.

## 1. Technical Stack & SSR

- **Next.js 16 + React Compiler:** Always use the latest patterns. Avoid legacy `defaultProps`.
- **Pure SSR (Non-Negotiable):** We do not use `loading.tsx` for core routes. Googlebot must receive full HTML in the first hop to prevent indexing errors. Resolve "blocking route" errors via build-time Suspense boundaries while preserving runtime SSR.
- **Local-First Data:** The persistent store is SQLite; the memory-first read layer is Redis. Always use `dbReady()` wrappers and honor `CACHE_VERSION` for invalidation.

## 2. Product Identity & SEO

- **Clean Slugs, Rich Titles:** Follow the "Idealo-style" naming strategy (specifically for RAM and CPUs).
- **Canonical Stability:** Products must use single-hop canonical resolution for ASIN-suffix URLs.
- **Indexing Gating:** Only index high-quality pages (specCount > 3).

## 3. Strict Code Integrity (Zero-Error Delivery)

- **Verified Imports:** You MUST verify file paths and schema fields (`src/db/schema.ts`) before writing code.
- **Strict Typing:** NEVER use `as any` if the property exists in the domain interface or database schema. Propose interface extensions if data is truly dynamic.
- **Incremental Cleanup:** Every edit MUST remove unused variables, constants, and hardcoded TRACE logs.
- **Documentation Integrity:** You MUST update or remove JSDoc/comments when changing function signatures or logic. No stale documentation.
- **MANDATORY DRY-RUN:** Mentally lint all code for syntax errors and unused imports before presenting.

## 4. Automatic Formatting & Sync

- **Post-Edit Cleanup:** After any file modification, you MUST run:
  1. `bunx eslint --fix <TargetFile>` (to remove unused imports/vars)
  2. `bunx prettier --write <TargetFile>` (to format)
- **Automated Verification:** You MUST run `bun x tsc --noEmit` and `bun run lint` at the end of every turn involving code changes to ensure zero regressions.
- **Graphify Sync:** Rebuild the graph after modifying core logic (`product-families.ts`, `product-identity.ts`, etc.) using: `$(cat graphify-out/.graphify_python) -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`
- **Bun First:** Always use `bun` or `bunx` instead of `npm`, `npx`, or `yarn` for script execution and dependency management.

## 5. Pre-Deployment Guard

- **Build Check:** For complex changes, run `bun run build` or `tsc` to ensure the project still compiles before ending the turn.
