---
title: Container Queries (v4)
impact: HIGH
impactDescription: Native container query support in Tailwind v4
tags: v4, container-queries, responsive, layout
---

## Container Queries (v4)

Tailwind v4 brings native container queries. Use them for component-level responsive design.

**Usage:**

```tsx
<div className="@container">
  <div className="flex flex-col @lg:flex-row">
    <div className="w-full @lg:w-1/2">Left</div>
    <div className="w-full @lg:w-1/2">Right</div>
  </div>
</div>
```

The `@lg:flex-row` applies when the _container_ (not viewport) is large.

**Available breakpoints:**

- `@xs` - 20rem (320px)
- `@sm` - 24rem (384px)
- `@md` - 28rem (448px)
- `@lg` - 32rem (512px)
- `@xl` - 36rem (576px)

**When to use:**

- Reusable components that need to adapt to their container size
- Cards, widgets, or modules that appear in different layout contexts

**When NOT to use:**

- Page-level layouts (use viewport breakpoints: `md:`, `lg:`)
