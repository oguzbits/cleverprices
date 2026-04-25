---
title: Layout Patterns
impact: MEDIUM
impactDescription: Common flex and grid patterns
tags: layout, flex, grid
---

## Layout Patterns

### Flex Center

```tsx
<div className="flex items-center justify-center" />
```

### Flex Between

```tsx
<div className="flex items-center justify-between" />
```

### Responsive Grid

```tsx
<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" />
```

### Custom Grid with Fractions

```tsx
<div className="grid grid-cols-[1fr_2fr_1fr]" />
```

### Full Height Layout

```tsx
<div className="flex min-h-screen flex-col">
  <header>...</header>
  <main className="flex-1">...</main>
  <footer>...</footer>
</div>
```

### Responsive Visibility

```tsx
<div className="hidden md:block">Desktop only</div>
<div className="block md:hidden">Mobile only</div>
```
