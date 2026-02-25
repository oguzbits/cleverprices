---
description: Comprehensive framework and repository-specific debugging guidelines
---

# 🐛 Debugging Workflow

This workflow provides a structured approach to debugging issues in the CleverPrices repository, taking into account our specific, modern tech stack.

## Repository Specifications & Context

Before diving into logs, remember the core technologies running CleverPrices:

- **Framework**: Next.js 16 (App Router)
- **Rendering**: React Compiler & Cache Components. Strict adherence to React 19 standards.
- **Database**: Drizzle ORM connected to local-first SQLite.
- **Caching**: Redis acts as a memory-first read layer for high-speed delivery.
- **Styling**: Tailwind CSS v4 (No `var()` in `className`, use semantic tokens).
- **Architecture**: Idealo-style architecture for category pages (dynamic, faceted routing).

---

## 1. Development Environment & Logs

Start by running the local development server and observing the terminal. Do not ignore deprecation warnings.
// turbo

```bash
bun dev
```

- Watch for **React Compiler** warnings or errors in the terminal.
- Check the **Next.js build logs** for layout/page de-optimizations or hydration mismatch warnings.

## 2. Diagnosing Rendering & Cache Issues (Next.js 16)

Given our usage of React Compiler and Cache Components, caching behavior is a common source of bugs.

- **Client vs. Server Context**: Verify boundaries. Are you using `use client` where server features are needed?
- **React Doctor**: If you suspect a React-specific issue (e.g., infinite loops, stale state), use the `react-doctor` skill to validate the components.
- **Prerendering Restrictions**: Avoid using non-deterministic functions like `crypto.randomUUID()` in the top-level scope of Server Components during rendering, as it can break Next.js static generation.

## 3. Database & Drizzle ORM Debugging (SQLite)

Issues with data fetching, missing products, or incorrect relationships should be debugged here.

- **Check Local DB**: We use local SQLite as the persistent store. Verify the local database file has the expected schema and data.
- **Circuit Breaker**: If you see `DatabaseBusyError`, it means the circuit breaker tripped due to persistent SQLite locks. Check if a background worker is saturating I/O.
- **Query Logging**: Drizzle allows logging SQL queries. If a query returns unexpected results, log the raw SQL.
- **Join Limit**: Verify that queries do not exceed the **3-join limit**. Use the Hydration Pattern for complex data.
- **Migrations**: If you encounter `table already exists` or missing column errors, verify that schema definitions match the current state.
  // turbo

```bash
bun db:push
```

## 4. Redis Caching Layer Issues

Redis is our memory-first read layer. Stale data is often caused by cache invalidation failures.

- **Bypass Cache**: Temporarily bypass Redis calls in development to check if the underlying SQLite database has the correct data.
- **Cache Keys**: Ensure Redis cache keys uniquely represent the data.

## 5. Styling & UI Issues (Tailwind CSS v4)

For layout shifts, missing styles, or responsive design bugs:

- **No `var()` in `className`**: Tailwind v4 in this project strictly forbids `var(--color)` in className. Use semantic tokens.
- **Verify Variants**: Ensure `cn()` and `clsx()` are effectively merging Tailwind classes without conflicts.
- **Design Guidelines**: If the UI feels odd, refer to the `web-design-guidelines` skill.

## 6. Category Page Architecture (Idealo-style)

Category pages have complex facet/routing logic.

- **Slugs & Identifiers**: Check how `[categorySlug]` and dynamic parameters are generated and parsed. Verify that product URLs are clean and deterministic.
- **Build-Time Resilience**: Ensure that dynamic routes handle cases where the DB might not be fully populated during build-time (e.g., `generateStaticParams` returning placeholders).
