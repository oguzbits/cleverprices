# Tailwind CSS 4 Best Practices

A structured repository of Tailwind CSS 4 patterns and best practices optimized for AI agents and LLMs.

## Structure

- `rules/` - Individual rule files (one per rule)
  - `styling-*.md` - Styling rules
  - `layout-*.md` - Layout rules
  - `v4-*.md` - Tailwind v4 specific features
- `metadata.json` - Document metadata (version, organization, abstract)
- **`AGENTS.md`** - Compiled output with all rules expanded
- **`SKILL.md`** - Quick reference index

## Rule File Structure

Each rule file follows this structure:

```markdown
---
title: Rule Title Here
impact: CRITICAL | HIGH | MEDIUM | LOW
impactDescription: Optional description
tags: tag1, tag2, tag3
---

## Rule Title Here

Brief explanation of the rule and why it matters.

**Incorrect (description):**
\`\`\`tsx
// Bad code example
\`\`\`

**Correct (description):**
\`\`\`tsx
// Good code example
\`\`\`
```

## Impact Levels

- `CRITICAL` - Always follow, major issues if violated
- `HIGH` - Strongly recommended
- `MEDIUM` - Good practice
- `LOW` - Nice to have

## When to Apply

Reference these guidelines when:

- Writing new React components with Tailwind
- Reviewing code for styling consistency
- Refactoring existing Tailwind code
- Migrating from Tailwind v3 to v4
