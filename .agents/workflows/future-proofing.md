---
description: Dependency audits and forward-looking architecture
---

# 🔮 Future-Proofing

This workflow keeps the CleverPrices stack modern, secure, and ready for scaling.

## 1. Dependency Analysis

Check for outdated core packages that might introduce security risks or deprecations.

```bash
bun outdated
```

- Evaluate `Next.js`, `React`, and `Drizzle ORM` versions closely.

## 2. React 19 / Compiler Adherence

React 19 conventions (like omitting `forwardRef`, switching to standard `ref` props, avoiding `useMemo` where the compiler handles it) are being actively adopted.

- Run `react-doctor` to trace where old React paradigms are still applied.

## 3. Tech Debt Tracking

Regularly review `TODO:` and `FIXME:` comments across the `src/` directory.

## 4. Environment Variables

Verify `.env.example` has parity with actual required deployment variables. Missing env vars frequently break the `worker` or Dokploy pipelines.
