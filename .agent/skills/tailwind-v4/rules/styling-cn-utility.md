---
title: The cn() Utility Pattern
impact: HIGH
impactDescription: Essential for conditional and composable styles
tags: styling, utility, cn, clsx, tailwind-merge
---

## The cn() Utility Pattern

Use `cn()` for conditional class composition. It merges Tailwind classes intelligently.

**Implementation:**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Usage in components:**

```tsx
function Button({ variant, className, children }) {
  return (
    <button
      className={cn(
        // Base styles
        "inline-flex items-center justify-center rounded-md px-4 py-2",
        // Variant styles
        variant === "primary" && "bg-blue-600 text-white",
        variant === "secondary" && "bg-slate-100 text-slate-900",
        // External overrides (always last)
        className,
      )}
    >
      {children}
    </button>
  );
}
```

**When NOT to use cn():**

- Static-only classes (no conditions): just use `className="..."`.
- Single conditional: can use simple ternary inline.
