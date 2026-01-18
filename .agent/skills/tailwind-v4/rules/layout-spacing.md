---
title: Spacing Cheatsheet
impact: LOW
impactDescription: Quick reference for padding/margin
tags: layout, spacing, margin, padding
---

## Spacing Cheatsheet

### Padding

```tsx
<div className="p-4" />           // All sides (1rem)
<div className="px-4 py-2" />     // Horizontal 1rem, vertical 0.5rem
<div className="pt-4 pb-2" />     // Top 1rem, bottom 0.5rem
<div className="pl-6 pr-4" />     // Left 1.5rem, right 1rem
```

### Margin

```tsx
<div className="m-4" />           // All sides
<div className="mx-auto" />       // Center horizontally
<div className="mt-8 mb-4" />     // Top 2rem, bottom 1rem
<div className="ml-auto" />       // Push to right
```

### Gap (Flex/Grid)

```tsx
<div className="flex gap-4" />           // 1rem gap
<div className="grid gap-x-4 gap-y-2" /> // Different x/y gaps
```

### Scale Reference

| Class | Size          |
| ----- | ------------- |
| `*-1` | 0.25rem (4px) |
| `*-2` | 0.5rem (8px)  |
| `*-4` | 1rem (16px)   |
| `*-6` | 1.5rem (24px) |
| `*-8` | 2rem (32px)   |
