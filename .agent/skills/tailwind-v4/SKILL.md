---
name: tailwind-4
description: >
  Tailwind CSS 4 patterns and best practices.
  Trigger: When styling with Tailwind (className, variants, cn()), especially when dynamic styling or CSS variables are involved (no var() in className).
---

# Tailwind CSS 4 Best Practices

Comprehensive styling guide with 9 rules across 3 categories.

## Quick Reference

### Critical (Always Follow)

- **No var() in className**: Use semantic classes ([Rule](rules/styling-no-var-in-class.md))
- **No Hex Colors**: Use Tailwind color classes ([Rule](rules/styling-no-hex-colors.md))

### High Impact

- **cn() Utility**: Conditional class composition ([Rule](rules/styling-cn-utility.md))
- **Container Queries**: Component-level responsive ([Rule](rules/v4-container-queries.md))

### Medium Impact

- **Dynamic Values**: Use style prop for runtime values ([Rule](rules/styling-dynamic-values.md))
- **Layout Patterns**: Flex, grid, visibility ([Rule](rules/layout-patterns.md))
- **States & Responsive**: Hover, focus, breakpoints ([Rule](rules/states-responsive.md))

### Low Impact

- **Spacing**: Padding/margin reference ([Rule](rules/layout-spacing.md))
- **Color Opacity**: `/50` syntax ([Rule](rules/v4-color-opacity.md))

## Full Compiled Document

For the complete guide with all rules expanded: `AGENTS.md`
