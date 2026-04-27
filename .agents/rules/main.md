---
trigger: always_on
---

# CleverPrices Global Agent Rules (Audited & Finalized)

These rules represent the architectural and design "North Star" of the project. They apply to EVERY prompt.

## 1. Core Architectural Strategy (The "Pure SSR" Commandments)

- **Pure SSR (Non-Negotiable):** All data fetching for core routes (PDP, Search, Home) MUST be performed using blocking `await` in the top-level Page segment.
  - **FORBIDDEN:** `loading.tsx` and `Suspense` in dynamic segments (causes white flashes).
  - **FORBIDDEN:** `next/server` `connection()` in PDP routes (triggers early streaming).
- **Technical Stack:** Next.js 16 + React Compiler. Avoid legacy `defaultProps`.
- **Local-First Data:** SQLite is the persistent store; Redis is the memory-first read layer. Always use `dbReady()` wrappers and honor `CACHE_VERSION`.
- **Cache Isolation (CRITICAL):** Only use `"use cache"` and `cacheLife` in dedicated `src/lib/server/cached-*.ts` files or at the top-level Page segment. NEVER in core utility libs returning `Map`, `Set`, or complex objects (serialization failure risk).
- **Batching & TTFB:** Use `mergeLivePricesSelective` for all product IDs in a single call. Never sequential `await` for multiple price pools.

## 2. Coding & Implementation Standard (The "Writing" Phase)

- **Strict Integrity:**
  - **Verified Imports:** Check file paths and `src/db/schema.ts` before writing.
  - **Strict Typing:** NEVER use `as any`. Propose interface extensions instead.
  - **Incremental Cleanup:** Every edit MUST remove unused variables, constants, and hardcoded TRACE logs.
  - **Documentation:** Update or remove JSDoc/comments when changing signatures. No stale docs.
- **Product Identity:** Follow the "Idealo-style" naming strategy (Clean Slugs, Rich Titles).
- **Indexing Gating:** Only index high-quality pages (`specCount > 3`).

## 3. Software Craftsmanship & Reusability (The "Clean Code" Standard)

- **Component Atomicity:** Prioritize small, focused components. Distinguish between **Primitives** (reusable, logic-less UI) and **Features** (domain-specific orchestration).
- **Utility-First Architecture:** Extract non-UI logic (formatting, calculations, transformations) into pure, testable functions. Keep components focused on rendering.
- **DRY (Don't Repeat Yourself):** Centralize shared domain logic. If a pattern (price calculation, brand mapping, etc.) is used in more than one place, it MUST have a single source of truth.
- **Clean Code Standards:**
  - **Readability First:** Prioritize descriptive naming and explicit logic over "clever" or abbreviated code.
  - **Logical Focus:** Keep functions and components focused on a single responsibility. Decompose complex logic into smaller, manageable units.
- **Semantic Accessibility:** Use appropriate HTML5 semantic tags (`<article>`, `<section>`, `<nav>`, `<aside>`). Semantic HTML is the foundation of our SEO strategy.

## 4. Post-Edit Cleanup & Sync (MANDATORY AFTER EVERY MODIFICATION)

After any file modification, you MUST run this sequence:

1. **Formatting:** `bunx eslint --fix <TargetFile>` followed by `bunx prettier --write <TargetFile>`.
2. **Graphify Sync:** Rebuild the graph after modifying core logic:
   `$(cat graphify-out/.graphify_python) -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"`
3. **Automated Verification:** Run `bun x tsc --noEmit` and `bun run lint` to ensure zero regressions.

## 5. Verification of Deployment ("Deployment Truth")

- **Build ID Check:** Every production build injects `NEXT_PUBLIC_BUILD_ID`.
  - **Verify:** Inspect `<html data-build-id="...">` or check the `X-Build-ID` response header.
  - **Match HEAD:** Deployed commit MUST match local `HEAD`. If it does not match, use `/deploy`.
- **Deployment Ghosting Resolution:** If a deployment "stalls" (old version still serving):
  1. `application-cleanQueues`
  2. `application-stop` -> `application-start` (Force Docker Swarm to kill orphaned containers).

## 6. Pre-Deployment Guard (The "Final Gate")

- **Mandatory Build Check:** For ANY change involving `"use cache"`, `cacheLife`, or core SSR logic, you MUST run `bun run build` locally and achieve Exit Code 0 before committing or deploying.
- **Bun First:** Use `bun` or `bunx` exclusively (no `npm`, `yarn`, or `npx`).
