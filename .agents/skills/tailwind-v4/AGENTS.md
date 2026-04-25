# Tailwind CSS 4 Best Practices

**Version 1.0.0**  
Prowler Cloud / CleverPrices  
January 2026

> **Note:**  
> This document is for agents and LLMs to follow when maintaining,  
> generating, or refactoring Tailwind CSS code. Humans may also find it useful.

---

## Abstract

Tailwind CSS 4 patterns and best practices for building maintainable, performant UIs. Contains 9 rules across 3 categories: Critical (no var() in className, no hex colors), High (cn() utility, container queries), and Medium (spacing, responsive patterns). Optimized for AI-assisted code generation and refactoring.

---

## Table of Contents

1. [Critical Rules](#1-critical-rules)
   - 1.1 [Never Use var() in className](#11-never-use-var-in-classname)
   - 1.2 [Never Use Hex Colors](#12-never-use-hex-colors)
2. [High Impact Rules](#2-high-impact-rules)
   - 2.1 [The cn() Utility Pattern](#21-the-cn-utility-pattern)
   - 2.2 [Container Queries (v4)](#22-container-queries-v4)
3. [Medium Impact Rules](#3-medium-impact-rules)
   - 3.1 [Dynamic Values with style Prop](#31-dynamic-values-with-style-prop)
   - 3.2 [Layout Patterns](#32-layout-patterns)
   - 3.3 [States and Responsive](#33-states-and-responsive)
4. [Low Impact Rules](#4-low-impact-rules)
   - 4.1 [Spacing Cheatsheet](#41-spacing-cheatsheet)
   - 4.2 [Color Opacity Modifier](#42-color-opacity-modifier)

---

## 1. Critical Rules

**Impact: CRITICAL**

These rules must always be followed. Violations cause broken styles or maintenance nightmares.

### 1.1 Never Use var() in className

**Impact: CRITICAL (breaks Tailwind's utility class parsing)**

Tailwind cannot process CSS `var()` functions inside utility class brackets.

**Incorrect:**

```tsx
<div className="bg-[var(--color-primary)]" />
<div className="text-[var(--text-color)]" />
```

**Correct:**

```tsx
<div className="bg-primary" />
<div className="text-slate-400" />
```

Define custom colors in `globals.css` using `@theme inline`:

```css
@theme inline {
  --color-primary: var(--primary);
}
```

### 1.2 Never Use Hex Colors

**Impact: CRITICAL (defeats design system)**

Hardcoded hex colors bypass your design system and make theming impossible.

**Incorrect:**

```tsx
<p className="text-[#ffffff]" />
<div className="bg-[#1e293b]" />
```

**Correct:**

```tsx
<p className="text-white" />
<div className="bg-slate-800" />
```

---

## 2. High Impact Rules

**Impact: HIGH**

Strongly recommended patterns that significantly improve code quality.

### 2.1 The cn() Utility Pattern

**Impact: HIGH (essential for conditional styles)**

Use `cn()` for conditional class composition.

**Implementation:**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage:**

```tsx
<button
  className={cn(
    "rounded-md px-4 py-2",
    variant === "primary" && "bg-blue-600 text-white",
    className,
  )}
>
  {children}
</button>
```

### 2.2 Container Queries (v4)

**Impact: HIGH (component-level responsive design)**

Tailwind v4 brings native container queries.

```tsx
<div className="@container">
  <div className="flex flex-col @lg:flex-row">...</div>
</div>
```

Available breakpoints: `@xs` (320px), `@sm` (384px), `@md` (448px), `@lg` (512px), `@xl` (576px).

---

## 3. Medium Impact Rules

**Impact: MEDIUM**

Good practices that improve maintainability.

### 3.1 Dynamic Values with style Prop

For runtime-computed values, use the `style` prop.

**Incorrect:**

```tsx
<div className={`w-[${width}px]`} />
```

**Correct:**

```tsx
<div style={{ width: `${width}px` }} />
```

### 3.2 Layout Patterns

**Flex Center:**

```tsx
<div className="flex items-center justify-center" />
```

**Responsive Grid:**

```tsx
<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" />
```

### 3.3 States and Responsive

**Hover/Focus:**

```tsx
<button className="hover:bg-blue-600 focus:ring-2" />
```

**Responsive:**

```tsx
<div className="w-full md:w-1/2 lg:w-1/3" />
```

---

## 4. Low Impact Rules

**Impact: LOW**

Nice-to-have patterns and quick references.

### 4.1 Spacing Cheatsheet

| Class | Size |
| ----- | ---- |
| `*-1` | 4px  |
| `*-2` | 8px  |
| `*-4` | 16px |
| `*-8` | 32px |

### 4.2 Color Opacity Modifier

```tsx
<div className="bg-blue-500/50" /> // 50% opacity
```

---

## References

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Tailwind CSS v4 Blog](https://tailwindcss.com/blog/tailwindcss-v4)
- [shadcn/ui](https://github.com/shadcn-ui/ui)
