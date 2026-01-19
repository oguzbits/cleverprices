# CleverPrices Agent Guidelines

**This is the Single Source of Truth.** Read this FIRST before writing any code.

---

## 🏗️ Technology Stack

| Technology         | Version | Key Notes                                                    |
| ------------------ | ------- | ------------------------------------------------------------ |
| **Next.js**        | 16.0.10 | App Router, `cacheComponents: true`                          |
| **React**          | 19.2.3  | Server Components, `'use cache'` directive                   |
| **React Compiler** | Enabled | Handles `useMemo`, `useCallback`, `React.memo` automatically |
| **Tailwind CSS**   | 4.x     | See `.agent/skills/tailwind-v4/`                             |
| **Drizzle ORM**    | 0.45.x  | See `.agent/skills/drizzle-orm/`                             |

---

## 🚫 BANNED PATTERNS (Never Use)

### Next.js 16 Deprecated

| ❌ Banned           | ✅ Use Instead                        |
| ------------------- | ------------------------------------- |
| `middleware.ts`     | Route handlers, server actions        |
| `useMemo()`         | React Compiler handles this           |
| `useCallback()`     | React Compiler handles this           |
| `React.memo()`      | React Compiler handles this           |
| `fetchCache` export | `'use cache'` at file/component level |

### Caching Notes

| Pattern                 | Status     | Notes                                                                        |
| ----------------------- | ---------- | ---------------------------------------------------------------------------- |
| `'use cache'` directive | ✅ Primary | Use with `cacheLife('profile')`                                              |
| `unstable_cache()`      | ⚠️ Legacy  | Still used for function-level caching, but prefer `'use cache'` for new code |
| `React.cache()`         | ✅ OK      | For per-request deduplication                                                |

### Database Anti-Patterns

| ❌ Banned                                   | ✅ Use Instead                           |
| ------------------------------------------- | ---------------------------------------- |
| `OFFSET` pagination                         | Keyset pagination (`WHERE id > lastId`)  |
| `SELECT *` or `.findMany()` without columns | `liteProductColumns`, `litePriceColumns` |
| `db.delete(table)` without `--force`        | Require CLI safety flag                  |
| Unbounded `Promise.all()`                   | Bounded parallelism (max 5-10)           |
| Writes without value-diffing                | Fetch current state, compare, then write |

---

## ✅ REQUIRED PATTERNS

### Caching (Next.js 16)

```typescript
"use cache";
import { cacheLife } from "next/cache";

export async function getCategoryProducts() {
  cacheLife("category"); // Uses profile from next.config.ts
  // ... data fetching
}
```

### Database Queries

Use **liteColumns** for list views (see `.agent/skills/drizzle-orm/rules/query-lite-columns.md`):

```typescript
// ✅ Good: Lite columns for category/search pages
const prods = await db.select(liteProductColumns).from(products);
const prs = await db.select(litePriceColumns).from(prices);

// ❌ Bad: Full select (wastes reads on heavy JSON fields)
const prods = await db.query.products.findMany();
```

### CLI Scripts

All destructive scripts MUST support:

- `--dry-run`: Preview without executing
- `--force`: Required for deletions/overwrites

---

## 🔒 RESOURCE LIMITS

| Resource             | Free Tier Limit        | Safety Rule                        |
| -------------------- | ---------------------- | ---------------------------------- |
| **Turso Reads**      | 500M rows/month        | Use liteColumns, keyset pagination |
| **Turso Writes**     | 10M rows/month         | Value-diff before writes           |
| **Keepa Tokens**     | 20/min, 1,200/hour cap | Reserve 100 for enrichment         |
| **Vercel Execution** | 60s (Hobby)            | Use streaming + Suspense           |

---

## 📋 PRE-IMPLEMENTATION CHECKLIST

Before writing code, verify:

- [ ] Read the relevant skill file?
- [ ] Using `'use cache'` + `cacheLife()` for new caching code?
- [ ] Not using deprecated patterns (middleware, useMemo, etc.)?
- [ ] Using `liteColumns` for list views, full columns only for detail pages?
- [ ] Algorithm is O(N) or better? (No OFFSET, no N+1 queries)
- [ ] Script has `--dry-run` and `--force` flags?
- [ ] Parallelism bounded to max 5-10?

---

## 📚 SKILL REFERENCES

| Domain          | Skill Location                                       |
| --------------- | ---------------------------------------------------- |
| Database        | `.agent/skills/drizzle-orm/SKILL.md`                 |
| React/Next.js   | `.agent/skills/vercel-react-best-practices/SKILL.md` |
| Tailwind CSS    | `.agent/skills/tailwind-v4/SKILL.md`                 |
| SEO             | `.agent/skills/modern-seo/SKILL.md`                  |
| Web Design      | `.agent/skills/web-design-guidelines/SKILL.md`       |
| Turso Economics | `docs/TURSO_OPTIMIZATION.md`                         |
