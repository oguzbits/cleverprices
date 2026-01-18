---
title: States and Responsive
impact: MEDIUM
impactDescription: Hover, focus, and breakpoint patterns
tags: states, responsive, hover, focus
---

## States and Responsive

### Hover and Focus

```tsx
<button className="hover:bg-blue-600 focus:ring-2 active:scale-95" />
<input className="focus:border-blue-500 focus:outline-none" />
```

### Group Hover

```tsx
<div className="group">
  <span className="opacity-0 group-hover:opacity-100">Appears on hover</span>
</div>
```

### Responsive Breakpoints

```tsx
<div className="w-full md:w-1/2 lg:w-1/3" />
<div className="text-sm md:text-base lg:text-lg" />
```

| Prefix | Min Width |
| ------ | --------- |
| `sm:`  | 640px     |
| `md:`  | 768px     |
| `lg:`  | 1024px    |
| `xl:`  | 1280px    |
| `2xl:` | 1536px    |

### Dark Mode

```tsx
<div className="bg-white dark:bg-slate-900" />
<p className="text-gray-900 dark:text-white" />
```
