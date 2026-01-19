---
name: tailwind-v4
description: >
  Tailwind CSS 4 patterns and best practices.
  TRIGGERS: Styling with className, variants, cn(), or CSS variables.
  CRITICAL: No var() in className. Use semantic tokens.
version: "2.0.0"
---

# Tailwind CSS 4 Best Practices

## 🚫 BANNED (Never Use)

| Pattern                 | Why                                  | Use Instead                         |
| ----------------------- | ------------------------------------ | ----------------------------------- |
| `var()` in className    | Tailwind can't process CSS variables | `style` prop for dynamic values     |
| Hex colors in className | Breaks theming, hard to maintain     | Semantic tokens (`text-foreground`) |
| `@apply` in components  | Increases bundle size                | Direct className utilities          |

## ✅ REQUIRED

| Pattern         | When                   | Example                                  |
| --------------- | ---------------------- | ---------------------------------------- |
| `cn()` utility  | Conditional classes    | `cn("base", isActive && "active")`       |
| Semantic tokens | All colors             | `bg-background`, `text-muted-foreground` |
| `style` prop    | Dynamic runtime values | `style={{ '--progress': value }}`        |

---

## Rules by Priority

### Critical (Always Follow)

- [No var() in className](rules/styling-no-var-in-class.md)
- [No Hex Colors](rules/styling-no-hex-colors.md)

### High Impact

- [cn() Utility](rules/styling-cn-utility.md) - Conditional class composition
- [Container Queries](rules/v4-container-queries.md) - Component-level responsive

### Medium Impact

- [Dynamic Values](rules/styling-dynamic-values.md) - Use style prop
- [Layout Patterns](rules/layout-patterns.md) - Flex, grid, visibility
- [States & Responsive](rules/states-responsive.md) - Hover, focus, breakpoints

### Low Impact

- [Spacing](rules/layout-spacing.md) - Padding/margin reference
- [Color Opacity](rules/v4-color-opacity.md) - `/50` syntax

---

## Quick Examples

### ❌ Bad: var() in className

```tsx
<div className={`bg-[var(--color-primary)]`}>  // Won't work!
```

### ✅ Good: style prop

```tsx
<div className="bg-primary" style={{ '--progress': `${value}%` }}>
```

### ❌ Bad: Hex colors

```tsx
<div className="bg-[#1a1a2e] text-[#ffffff]">
```

### ✅ Good: Semantic tokens

```tsx
<div className="bg-background text-foreground">
```
