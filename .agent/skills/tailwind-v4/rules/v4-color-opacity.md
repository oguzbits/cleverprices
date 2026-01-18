---
title: Color Opacity Modifier
impact: LOW
impactDescription: Cleaner syntax for semi-transparent colors
tags: v4, colors, opacity
---

## Color Opacity Modifier

Use the `/` syntax to apply opacity to any color.

**Syntax:**

```tsx
<div className="bg-blue-500/50" />   // 50% opacity
<div className="text-black/80" />    // 80% opacity
<div className="border-white/20" />  // 20% opacity
```

**Replaces verbose alternatives:**

```tsx
// Before (verbose)
<div className="bg-blue-500 bg-opacity-50" />

// After (clean)
<div className="bg-blue-500/50" />
```

Works with any color utility: `bg-`, `text-`, `border-`, `ring-`, `fill-`, `stroke-`.
