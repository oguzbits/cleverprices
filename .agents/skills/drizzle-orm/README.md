# Drizzle ORM Best Practices

A structured repository of Drizzle ORM patterns optimized for AI agents and LLMs.

## Structure

- `rules/` - Individual rule files (one per rule)
  - `schema-*.md` - Schema definition rules
  - `query-*.md` - Query optimization rules
  - `patterns-*.md` - Common patterns
  - `config-*.md` - Configuration rules
- `metadata.json` - Document metadata
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

Brief explanation.

**Incorrect:**
\`\`\`typescript
// Bad code
\`\`\`

**Correct:**
\`\`\`typescript
// Good code
\`\`\`
```

## When to Apply

Reference these guidelines when:

- Defining Drizzle schemas
- Writing database queries
- Optimizing query performance
- Setting up migrations
