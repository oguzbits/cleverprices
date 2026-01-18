---
title: Never Use Hex Colors
impact: CRITICAL
impactDescription: Defeats design system, hard to maintain
tags: styling, colors, design-system, critical
---

## Never Use Hex Colors

Hardcoded hex colors bypass your design system and make theming impossible.

**Incorrect (hex colors in className):**

```tsx
<p className="text-[#ffffff]" />
<div className="bg-[#1e293b]" />
<span className="border-[#0066cc]" />
```

**Correct (use Tailwind color classes):**

```tsx
<p className="text-white" />
<div className="bg-slate-800" />
<span className="border-idealo-blue" />
```

If you need a custom color, define it in your CSS theme:

```css
@theme inline {
  --color-brand-orange: #f97316;
}
```

Then use: `bg-brand-orange`, `text-brand-orange`.
