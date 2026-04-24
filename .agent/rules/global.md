# CleverPrices Global Agent Rules

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
- **Verified Imports:** You MUST verify every import path and schema field name (`src/db/schema.ts`) before writing code.
- **Incremental Debt Reduction:** NEVER leave hardcoded debug TRACE logs, unused variables, or stale arguments/comments in a file you modify.
- **MANDATORY DRY-RUN:** Mentally lint all code for syntax errors and unused imports before presenting.

## 4. Automatic Formatting & Cleanup
- **Post-Edit Formatting:** After any file modification, you MUST run `bunx prettier --write <TargetFile>`. This ensures changes match the local environment's formatting.
- **Zero-Dead-Code Policy:** Every edit is an opportunity to delete dead code. If you see a variable that isn't used, delete it immediately.

## 5. Graphify & Build Verification
- **Graphify Sync:** Rebuild the graph after modifying core logic (`product-families.ts`, `product-identity.ts`, etc.).
- **Build Guard:** For complex changes, run `bun run build` or `tsc` to ensure the project still compiles before ending the turn.
