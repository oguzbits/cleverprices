---
title: Dynamic Values with style Prop
impact: MEDIUM
impactDescription: Use style prop for truly dynamic values
tags: styling, dynamic, jit
---

## Dynamic Values with style Prop

For values computed at runtime (e.g., from props or state), use the `style` prop instead of arbitrary value syntax.

**Incorrect (dynamic in className):**

```tsx
// This WON'T work - Tailwind can't see the value at build time
<div className={`w-[${width}px]`} />
```

**Correct (style prop for dynamic):**

```tsx
<div style={{ width: `${width}px` }} />
```

**Correct (arbitrary values for static one-offs):**

```tsx
// OK for distinct static values not in design system
<div className="w-[327px]" />
<div className="top-[117px]" />
<div className="grid-cols-[1fr_500px_1fr]" />
```

**Decision tree:**

```
Tailwind class exists?  → className="..."
Dynamic value?          → style={{ width: `${x}%` }}
Conditional styles?     → cn("base", condition && "variant")
Static only?            → className="..." (no cn() needed)
```
