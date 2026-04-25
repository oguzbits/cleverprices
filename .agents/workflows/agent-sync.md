---
description: Keep AI Agent Skills and workflows synchronized with the codebase
---

# 🤖 Agent Synchronization

This workflow ensures the AI Assistant remains effective by keeping its internal rules (`.agent/skills/`) and workflows (`.agent/workflows/`) up-to-date with reality.

## 1. Skill Parity Check

The AI must review its own instructions.

- Compare `.agent/skills/drizzle-orm/SKILL.md` against recent `src/db/schema/` changes.
- Compare `.agent/skills/vercel-react-best-practices/SKILL.md` against Next.js 15/16 upgrades in `package.json`.
- Compare `.agent/skills/tailwind-v4/SKILL.md` against global CSS structures.

## 2. Workflow Parity Check

Ensure the Slash Commands (`/deploy`, `/qa-testing`, etc.) are using commands that still exist.

- Read `package.json` scripts.
- If a script is removed or changed (e.g., `bun run worker:local` changes to something else), the Agent must proactively suggest updating the corresponding `.md` file in `.agent/workflows/`.

## 3. Architecture Alignment

The agent relies on `docs/` like `DOKPLOY_SETUP.md` or `CACHE_POLICY.md` to understand the infrastructure.

- If the project migrates, say from Hetzner to AWS, the Agent must rewrite these docs and purge obsolete Knowledge Items (KIs).

## 4. Execution

When requested to run `/agent-sync`, the AI should:

1. Scan `package.json` dependencies.
2. Read the aforementioned Skills and Workflows.
3. Propose edits via its implementation plan if drift is detected.
