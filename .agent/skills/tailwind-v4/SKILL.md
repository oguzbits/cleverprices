---
name: tailwind-4
description: >
  Tailwind CSS 4 patterns and best practices.
  Trigger: When styling with Tailwind (className, variants, cn()), especially when dynamic styling or CSS variables are involved (no var() in className).
license: Apache-2.0
metadata:
  author: prowler-cloud
  version: "1.0"
  scope: [root, ui]
  auto_invoke: "Working with Tailwind classes"
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, WebFetch, WebSearch, Task
---

## Styling Decision Tree

```
Tailwind class exists?  → className="..."
Dynamic value?          → style={{ width: `${x}%` }}
Conditional styles?     → cn("base", condition && "variant")
Static only?            → className="..." (no cn() needed)
Library can't use class?→ style prop with var() constants
```

## Critical Rules

### Never Use var() in className

```typescript
// ❌ NEVER: var() in className
<div className="bg-[var(--color-primary)]" />
<div className="text-[var(--text-color)]" />

// ✅ ALWAYS: Use Tailwind semantic classes
<div className="bg-primary" />
<div className="text-slate-400" />
```

### Never Use Hex Colors

```typescript
// ❌ NEVER: Hex colors in className
<p className="text-[#ffffff]" />
<div className="bg-[#1e293b]" />

// ✅ ALWAYS: Use Tailwind color classes
<p className="text-white" />
<div className="bg-slate-800" />
```

## The cn() Utility

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Component Patterns

### Basic Component

```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary';
  className?: string; // Allow overrides
  children: React.ReactNode;
}

export function Button({ variant = 'primary', className, children }: ButtonProps) {
  return (
    <button
      className={cn(
        // Base styles (layout, spacing, transitions)
        "inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        // Variants
        variant === 'primary' && "bg-blue-600 text-white hover:bg-blue-700",
        variant === 'secondary' && "bg-slate-100 text-slate-900 hover:bg-slate-200",
        // Overrides (always last)
        className
      )}
    >
      {children}
    </button>
  );
}
```

### Composition (Slots)

For complex components, style internal parts distinctly rather than exposing one className.

```typescript
function Card({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("rounded-lg border bg-white shadow-sm", className)}>{children}</div>
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-6">{children}</div>
}
```

## Tailwind v4 Specifics

### Dynamic Values (jit)

```typescript
// ✅ OK for distinct values
<div className="grid grid-cols-[1fr_500px_1fr]" />
<div className="h-[calc(100vh-4rem)]" />

// ❌ AVOID for colors/spacing that should be standard
<div className="m-[13px]" /> // Use m-3 or m-4
```

### Container Queries

Tailwind 4 brings native container queries.

```typescript
<div className="@container">
  <div className="@lg:flex-row flex-col flex">
    ...
  </div>
</div>
```

### Color Opacity Modifier

```typescript
<div className="bg-blue-500/50" /> // 50% opacity
<div className="text-black/80" />
```

## Layout Cheatsheet

### Flex Center

```typescript
<div className="flex items-center justify-center" />
```

### Grid Auto-Fit

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" />
```

### Spacing

```typescript
// Padding
<div className="p-4" />           // All sides
<div className="px-4 py-2" />     // Horizontal, vertical
<div className="pt-4 pb-2" />     // Top, bottom

// Margin
<div className="m-4" />
<div className="mx-auto" />       // Center horizontally
<div className="mt-8 mb-4" />
```

### Typography

```typescript
<h1 className="text-2xl font-bold text-white" />
<p className="text-sm text-slate-400" />
<span className="text-xs font-medium uppercase tracking-wide" />
```

### Borders & Shadows

```typescript
<div className="rounded-lg border border-slate-700" />
<div className="rounded-full shadow-lg" />
<div className="ring-2 ring-blue-500 ring-offset-2" />
```

### States

```typescript
<button className="hover:bg-blue-600 focus:ring-2 active:scale-95" />
<input className="focus:border-blue-500 focus:outline-none" />
<div className="group-hover:opacity-100" />
```

### Responsive

```typescript
<div className="w-full md:w-1/2 lg:w-1/3" />
<div className="hidden md:block" />
<div className="text-sm md:text-base lg:text-lg" />
```

### Dark Mode

```typescript
<div className="bg-white dark:bg-slate-900" />
<p className="text-gray-900 dark:text-white" />
```

## Arbitrary Values (Escape Hatch)

```typescript
// ✅ OK for one-off values not in design system
<div className="w-[327px]" />
<div className="top-[117px]" />
<div className="grid-cols-[1fr_2fr_1fr]" />

// ❌ Don't use for colors - use theme instead
<div className="bg-[#1e293b]" />  // NO
```
