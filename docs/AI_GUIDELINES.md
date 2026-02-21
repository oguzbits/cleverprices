# AI Agent Guidelines & Rulebook

## 🚨 MANDATORY PROTOCOL

**STOP.** Before answering any request, you must:

1.  **Read `docs/PROJECT_CONTEXT.md`**: This is the Single Source of Truth for architecture and constraints.
2.  **Check `docs/`**: Look for specific guides like `architecture/STABILITY_GUIDE.md` relevant to the task.
3.  **Inspect `.agent/skills/`**: Use `list_dir` to find reusable patterns (e.g., `modern-seo`, `drizzle-orm`).

---

## 🗺️ Documentation Map

### Core Context (Start Here)

- **[PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md)**: Architecture, Constraints, and Features.
- **[architecture/DATA_INTEGRITY.md](architecture/DATA_INTEGRITY.md)**: Database schema rules, validation, and health scoring.

### Architecture & Design

- **[architecture/LANDING_PAGE.md](architecture/LANDING_PAGE.md)**: Landing page component structure.
- **[architecture/GEO_STRATEGY.md](architecture/GEO_STRATEGY.md)**: Internationalization strategy.
- **[architecture/PDP_GUARDRAILS.md](architecture/PDP_GUARDRAILS.md)**: Performance rules for Product Detail Pages.
- **[architecture/CACHE_POLICY.md](architecture/CACHE_POLICY.md)**: **CRITICAL**: Rules for absolute price consistency & cache TTLs.
- **[architecture/STABILITY_GUIDE.md](architecture/STABILITY_GUIDE.md)**: **MANDATORY**: Soft 404, SEO Triad, and UX persistence rules.

### Operations & Runbooks

- **[ops/CHEATSHEET.md](ops/CHEATSHEET.md)**: Common commands for dev, db, and deployment.
- **[ops/DOKPLOY_SETUP.md](ops/DOKPLOY_SETUP.md)**: Server provisioning and Dokploy configuration.
- **[STABILITY_GUIDE.md](STABILITY_GUIDE.md)**: **CRITICAL**: SQLite WAL mode, memory mapping, and build isolation.
- **[ops/WORKER.md](ops/WORKER.md)**: Background jobs, price syncing, and Keepa API usage.
- **[ops/BUNDLE_ANALYSIS.md](ops/BUNDLE_ANALYSIS.md)**: How to analyze JS bundle size.

### Planning & Roadmaps

- **[planning/MASTER_ROADMAP.md](planning/MASTER_ROADMAP.md)**: High-level project goals.
- **[planning/CATALOG_EXPANSION.md](planning/CATALOG_EXPANSION.md)**: Strategy for new categories.

### Guides & Patterns

- **[guides/URL_STATE.md](guides/URL_STATE.md)**: Native URL state management patterns.
- **[guides/image-optimization.md](guides/image-optimization.md)**: CDN strategy and image loader rules.

---

## 🚫 BANNED PATTERNS (Strict)

### Next.js 16

| ❌ Never Use        | ✅ Use Instead                 |
| ------------------- | ------------------------------ |
| `middleware.ts`     | `proxy.ts` (Native Next.js 16) |
| `useMemo()`         | React Compiler handles         |
| `useCallback()`     | React Compiler handles         |
| `React.memo()`      | React Compiler handles         |
| `fetchCache` export | `'use cache'` directive        |

### Database & Data

| ❌ Never Use                         | ✅ Use Instead                           |
| ------------------------------------ | ---------------------------------------- |
| `OFFSET` pagination                  | Keyset pagination                        |
| `SELECT *`                           | `liteProductColumns`, `litePriceColumns` |
| `db.delete(table)` without `--force` | CLI safety flag                          |
| Unbounded `Promise.all()`            | Bounded parallelism (max 5-10)           |
| Writes without diffing               | Value-based diffing                      |

### Styling

| ❌ Never Use         | ✅ Use Instead  |
| -------------------- | --------------- |
| `var()` in className | `style` prop    |
| Hex colors           | Semantic tokens |

---

## ⚡ ALGORITHM COMPLEXITY REQUIREMENTS

| Operation        | Max Complexity         | Example             |
| ---------------- | ---------------------- | ------------------- |
| Hot Read (Redis) | O(1)                   | Slug-based lookup   |
| Table iteration  | O(N)                   | Keyset pagination   |
| Index lookups    | O(log N)               | Indexed columns     |
| Batch processing | O(N)                   | Bounded parallelism |
| Writes           | O(K) where K = changes | Value-diffing       |

---

## 🧠 Memory Bank (Rules)

- **Do not generate images**.
- **Do not use `useMemo`/`useCallback`** (React Compiler handles this).
- **Update documentation** immediately after changing architecture or adding features.
