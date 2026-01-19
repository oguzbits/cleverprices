# CleverPrices Agent Guidelines

**This is the Single Source of Truth.** Read this file FIRST before writing any code.

---

## 🏗️ Technology Stack

| Technology         | Version | Key Notes                                      |
| ------------------ | ------- | ---------------------------------------------- |
| **Next.js**        | 16.0.10 | App Router, `cacheComponents: true`            |
| **React**          | 19.2.3  | Server Components, `'use cache'` directive     |
| **React Compiler** | Enabled | Handles `useMemo`, `useCallback`, `React.memo` |
| **Tailwind CSS**   | 4.x     | No `var()` in className                        |
| **Drizzle ORM**    | 0.45.x  | SQLite with Turso/LibSQL                       |
| **Bun**            | Latest  | Runtime and package manager                    |

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

| Resource     | Limit                | Safety                         |
| ------------ | -------------------- | ------------------------------ |
| Turso Reads  | 500M/month           | liteColumns, keyset pagination |
| Turso Writes | 10M/month            | Value-diff before writes       |
| Keepa Tokens | 20/min, 1,200/hr cap | Reserve 100 for enrichment     |
| Vercel Exec  | 60s                  | Streaming + Suspense           |

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

---

## 📚 SKILLS

| Domain        | Skill                                                                                    | Examples                                       |
| ------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Database      | [drizzle-orm](file://.agent/skills/drizzle-orm/SKILL.md)                                 | lite-columns, keyset-pagination, value-diffing |
| React/Next.js | [vercel-react-best-practices](file://.agent/skills/vercel-react-best-practices/SKILL.md) | Cache components                               |
| Styling       | [tailwind-v4](file://.agent/skills/tailwind-v4/SKILL.md)                                 | No var() in class                              |
| SEO           | [modern-seo](file://.agent/skills/modern-seo/SKILL.md)                                   | Titles, descriptions                           |
| UX            | [web-design-guidelines](file://.agent/skills/web-design-guidelines/SKILL.md)             | Accessibility                                  |

**Turso Economics:** [docs/TURSO_OPTIMIZATION.md](file://docs/TURSO_OPTIMIZATION.md)
