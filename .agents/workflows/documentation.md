---
description: Keep docs, skills, and architectures up to date
---

# 📚 Documentation Maintenace

This workflow ensures development resources remain accurate as CleverPrices evolves.

## 1. Skill Verification

The AI agent relies heavily on `.agent/skills/`.

- Review the following files against recent code changes to prevent drift:
  - `drizzle-orm/SKILL.md`
  - `tailwind-v4/SKILL.md`
  - `vercel-react-best-practices/SKILL.md`
  - `modern-seo/SKILL.md`
  - `web-design-guidelines/SKILL.md`

## 2. Docs Update

Compare `docs/` Markdown files against real implementations.

- _Critical:_ Make sure `CACHE_POLICY.md` aligns with `generateStaticParams` and Redis integration logic.
- Ensure `DOKPLOY_SETUP.md` is strictly accurate before a major VPS change or rebuild.

## 3. Knowledge Base Generation (KIs)

Whenever solving a complex bug or building a new core architecture element:

- Summarize the bug, the root cause, and the architectural fix.
- Instruct the agent to ensure this knowledge is formatted properly for its automatic knowledge generation summarizations.
