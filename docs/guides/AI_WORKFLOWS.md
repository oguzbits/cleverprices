# 🤖 AI Agent Playbooks for CleverPrices

This document is your **operating manual** for deploying AI Agents effectively within this specific codebase. It leverages our architecture (Next.js 16, Drizzle, Keepa) to minimize errors and maximize output.

---

## Playbook 1: The "Vertical Slice" Builder (New Features)

**Best for**: Adding pages, components, or entire features (e.g., "Add a Price Alert Modal").

### Step 1: Architect (The "Brain")

**Prompt**:

> "Read `docs/PROJECT_CONTEXT.md` and `docs/AI_GUIDELINES.md`. check `src/lib/drizzle/schema.ts`.
> Plan a new feature: **[Feature Name]**.
> Create a new file `docs/planning/[feature-slug].md` with:
>
> 1. Database schema changes (Drizzle)
> 2. Server Action logic (use `nuqs` for state if needed)
> 3. UI Component structure (shadcn/ui + Tailwind v4)
> 4. URL/Routing strategy (`proxy.ts` vs `page.tsx`)
>    Do not write code yet. Just the plan."

### Step 2: Database (The "Foundation")

**Prompt**:

> "Read `docs/planning/[feature-slug].md` and `.agent/skills/drizzle-orm/SKILL.md`.
> Implement the schema changes in `src/lib/drizzle/schema.ts` and create a migration or push helper script."

### Step 3: UI Implementation (The "Builder")

**Prompt**:

> "Read `docs/planning/[feature-slug].md` and `.agent/skills/tailwind-v4/SKILL.md`.
> Build the UI components in `src/components/features/[feature-name]/`.
> Use `server-only` for data fetching. Use `nuqs` for any URL state."

---

## Playbook 2: The "Data Detective" (Maintenance)

**Best for**: Cleaning up messy raw data (Icecat/Keepa) or fixing regex bugs.

### Context

Our biggest bottleneck is **data quality** (e.g., extracting "CAS latency" from a title string). AI Agents excel here.

**Prompt**:

> "Read `src/lib/drizzle/schema.ts` (specifically `products.specs`).
> Scan `docs/planning/keyword-tracking.csv` to understand our targets.
> Create a script `scripts/maintenance/audit-[field-name].ts` that:
>
> 1. Selects 100 products where `[field]` is null/empty.
> 2. Attempts to regex-extract the value from `title` or `keepa_features`.
> 3. Logs the success rate.
>    Do NOT update the DB yet, just log the potential fixes."

---

## Playbook 3: The "SEO Sprinter" (Content Growth)

**Best for**: Using your mapped keywords to generate high-quality pages.

### Context

We have high-value keywords in `docs/planning/keyword-tracking.csv` but no pages for them.

**Prompt**:

> "Read `docs/planning/keyword-tracking.csv`.
> Pick the highest priority missing keyword (e.g., 'SSD under 100 Euro').
>
> 1. Create a definition in `src/lib/categories.ts` (if it's a category).
> 2. OR Create a blog post in `src/app/blog/[slug]/page.mdx`.
>    Ensure you link to 3 related existing products using their slugs from the DB."

---

## Playbook 4: Refactoring "Tech Debt"

**Best for**: Migrating old scripts or modernizing components.

**Prompt**:

> "Read `.agent/skills/vercel-react-best-practices/SKILL.md`.
> Audit `src/components/product/ProductCard.tsx`.
> Check if it uses `useMemo` or `useCallback` (forbidden by React 19 Compiler).
> Refactor it to remove them and use simple variables/functions instead."

---

## 🛑 What NOT to do with Agents

1.  **"Fix the whole app"**: Never ask an agent to "improve performance" globally. It will hallucinate changes.
    - _Better_: "Optimize the LCP metric for `src/app/p/[slug]/page.tsx`."
2.  **"Update Dependencies"**: Agents often break lockfiles. automated tools (Renovate/Dependabot) are safer.
3.  **"Write text for the homepage"**: Agents are verbose. Write the copy yourself or give them strict character limits.
