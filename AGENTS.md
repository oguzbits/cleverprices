# CleverPrices Agent Guidelines

**This is the Single Source of Truth.** Read this file FIRST before writing any code.

---

## 🏗️ Technology Stack

| Technology         | Version | Key Notes                                                         |
| ------------------ | ------- | ----------------------------------------------------------------- |
| **Next.js**        | 16.0.10 | App Router, `cacheComponents: true` **ENABLED** In next.config.ts |
| Runtime / PKG Mgr  | **BUN** | Use `bun run`, NOT `npm` or `pnpm`                                |
| **React**          | 19.2.3  | Server Components, `'use cache'` directive                        |
| **React Compiler** | Enabled | Handles `useMemo`, `useCallback`, `React.memo`                    |
| **Tailwind CSS**   | 4.x     | No `var()` in className                                           |
| **Drizzle ORM**    | 0.45.x  | Local SQLite (Persistent Source of Truth)                         |
| **Redis**          | Latest  | Memory-First Data Layer (Primary Fetch for Hot Data)              |
| **Bun**            | Latest  | Primary Runtime and Package Manager (MANDATORY)                   |

---

## 🚫 BANNED PATTERNS

### Next.js 16

| ❌ Never Use        | ✅ Use Instead                 |
| ------------------- | ------------------------------ |
| `middleware.ts`     | Route handlers, server actions |
| `useMemo()`         | React Compiler handles         |
| `useCallback()`     | React Compiler handles         |
| `React.memo()`      | React Compiler handles         |
| `fetchCache` export | `'use cache'` directive        |

### Database

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

All data operations MUST meet these complexity requirements:

| Operation        | Max Complexity         | Example             |
| ---------------- | ---------------------- | ------------------- |
| Hot Read (Redis) | O(1)                   | Slug-based lookup   |
| Table iteration  | O(N)                   | Keyset pagination   |
| Index lookups    | O(log N)               | Indexed columns     |
| Batch processing | O(N)                   | Bounded parallelism |
| Writes           | O(K) where K = changes | Value-diffing       |

### ❌ BANNED Algorithms

| Complexity | Example                      | Why Banned             |
| ---------- | ---------------------------- | ---------------------- |
| O(N²)      | OFFSET pagination            | Exponential read costs |
| O(N\*M)    | Nested loops without index   | Cartesian explosion    |
| Unbounded  | `while (true)` without limit | Resource exhaustion    |

### ✅ REQUIRED Checks

Before implementing any loop or batch operation:

1. **What's the Big-O?** If > O(N log N), refactor.
2. **Is there a limit?** Every loop needs an exit condition.
3. **Is there parallelism?** Cap at 5-10 concurrent.
4. **Is there a dry-run?** Test without side effects.

---

## ✅ REQUIRED PATTERNS

### Caching

```typescript
"use cache";
import { cacheLife } from "next/cache";

export async function getData() {
  cacheLife("category");
  // ...
}
```

### Database Queries

```typescript
// Use lite columns for list views
const prods = await db.select(liteProductColumns).from(products);
```

### CLI Scripts

```typescript
const isDryRun = process.argv.includes("--dry-run");
const isForce = process.argv.includes("--force");

if (!isForce && !isDryRun) {
  console.error("❌ Requires --force");
  process.exit(1);
}
```

---

## 🔒 RESOURCE LIMITS

| Resource        | Limit                 | Safety                 |
| --------------- | --------------------- | ---------------------- |
| DB Storage      | NVMe Capacity         | history compression    |
| Keepa Tokens    | 20/min, 1,200/hr cap  | Reserve for enrichment |
| Production Exec | 10s (def) / 60s (max) | Streaming + Suspense   |

---

## 📋 PRE-IMPLEMENTATION CHECKLIST

Before writing code:

- [ ] Read the relevant skill?
- [ ] Using `'use cache'` + `cacheLife()`?
- [ ] Not using deprecated patterns?
- [ ] Using `liteColumns` for lists?
- [ ] Algorithm O(N) or better?
- [ ] Script has `--dry-run` and `--force`?
- [ ] Parallelism bounded?
- [ ] Running command from PROJECT ROOT? (CRITICAL for path resolution)

---

## 📚 SKILLS

| Domain        | Skill                                                                              | Examples                                       |
| ------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------- |
| Database      | [drizzle-orm](file://.agent/skills/drizzle-orm/SKILL.md)                           | lite-columns, keyset-pagination, value-diffing |
| React/Next.js | [nextjs-best-practices](file://.agent/skills/vercel-react-best-practices/SKILL.md) | Cache components                               |
| Styling       | [tailwind-v4](file://.agent/skills/tailwind-v4/SKILL.md)                           | No var() in class                              |
| SEO           | [modern-seo](file://.agent/skills/modern-seo/SKILL.md)                             | Titles, descriptions                           |
| UX            | [web-design-guidelines](file://.agent/skills/web-design-guidelines/SKILL.md)       | Accessibility                                  |

**DB Performance:** [docs/SQLITE_OPTIMIZATION.md](file://docs/SQLITE_OPTIMIZATION.md)
