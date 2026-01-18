---
title: Never Use var() in className
impact: CRITICAL
impactDescription: Breaks Tailwind's utility class parsing
tags: styling, css-variables, critical
---

## Never Use var() in className

Tailwind cannot process CSS `var()` functions inside utility class brackets. This results in broken styles or build errors.

**Incorrect (var() in className):**

```tsx
<div className="bg-[var(--color-primary)]" />
<div className="text-[var(--text-color)]" />
```

Tailwind's JIT compiler cannot resolve these at build time.

**Correct (use semantic Tailwind classes):**

```tsx
<div className="bg-primary" />
<div className="text-slate-400" />
```

Define your custom colors in `globals.css` using `@theme inline`:

```css
@theme inline {
  --color-primary: var(--primary);
  --color-idealo-blue: var(--idealo-blue);
}
```

Then use them as first-class utilities: `bg-primary`, `text-idealo-blue`.
