---
description: Propose features, PRDs, and conceptual designs before coding
---

# 💡 Feature Ideation

This workflow prevents rushing into code on complex tasks. It ensures designs are agreed upon early.

## 1. Product Requirements Document (PRD)

If the user asks "How should we implement X?", the AI agent responds by writing a mini-PRD in `implementation_plan.md`. This MUST include:

- Goal
- Target Demographic
- Proposed UI/UX
- Systems Impacted (DB, Routes, Background Workers)

## 2. Technical Validation

- Does this new feature conflict with the "Dynamic-on-Demand" Cache Policy?
- Do we have the data available in the Keepa API or Local Database?

## 3. Mockup Generation

Use the `generate_image` tool to visualize UI structures, widgets, or charts (e.g., "Mockup of a price alert UI modal").

## 4. UI Guidelines Adherence

Apply the `web-design-guidelines` skill. Ensure any new UI fits the "Premium Enthusiast" vibe (subtle gradients, exact spacing, dark mode support).
