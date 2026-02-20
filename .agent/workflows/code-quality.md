---
description: Comprehensive Code Quality checks
---

# 🛡️ Code Quality Checks

This workflow ensures the codebase maintains high standards, type safety, and adheres to React best practices via our `react-doctor` skill.

## 1. Type Safety

Run the TypeScript compiler to catch type mismatch errors before runtime.
// turbo

```bash
bun run check || tsc --noEmit
```

## 2. Formatting & Linting

Ensure the code conforms to ESLint and Prettier rules.
// turbo

```bash
bun run check
bun run lint
```

## 3. React Doctor Validation

We use a specialized `react-doctor` skill to validate React 19 / Next.js 16 compiler requirements.

Step: **Run React Doctor Review**

- The assistant should proactively run the `react-doctor` skill on recently modified React UI components.
- Fix issues regarding `useMemo`, `useCallback`, async component limits, and unnecessary client boundaries.

## 4. Unused Imports & Deprecations

Regularly clean up the codebase. Look for deprecated packages or APIs.

```bash
bunx depcheck
```
