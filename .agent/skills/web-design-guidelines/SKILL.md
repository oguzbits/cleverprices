---
name: web-design-guidelines
description: >
  Review UI code for Web Interface Guidelines compliance.
  TRIGGERS: "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices".
version: "2.0.0"
metadata:
  author: vercel
  argument-hint: <file-or-pattern>
---

# Web Interface Guidelines

Review files for compliance with Vercel's Web Interface Guidelines.

## 🚫 BANNED (Never Use)

| Pattern                       | Why                     | Use Instead                |
| ----------------------------- | ----------------------- | -------------------------- |
| Missing alt text              | Accessibility violation | Descriptive alt for images |
| Low contrast text             | WCAG failure            | 4.5:1 ratio minimum        |
| No focus indicators           | Keyboard nav broken     | Visible focus rings        |
| Click handlers on non-buttons | Accessibility issue     | Use `<button>` or `<a>`    |

## ✅ REQUIRED

| Element             | Target                   | Notes                                     |
| ------------------- | ------------------------ | ----------------------------------------- |
| Semantic HTML       | Always                   | Use correct elements (nav, main, section) |
| Keyboard navigation | All interactive elements | Tab order, focus management               |
| Color contrast      | 4.5:1 minimum            | Use accessible color pairs                |
| Loading states      | Async content            | Skeletons, spinners                       |

---

## How to Audit

1. Fetch the latest guidelines:

   ```
   https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
   ```

2. Read the specified files

3. Check against all rules

4. Output findings in `file:line` format

---

### IdealoProductCard (Canonical Card)

- [ ] Image alt includes product title.
- [ ] Legal price asterisk is present (via `LegalPrice` component).
- [ ] `IdealoLivePrice` is used for real-time price synchronization.
- [ ] Hover effects provide clear visual feedback without shifting layout.

### Carousel Components

- [ ] Navigation arrows are keyboard accessible.
- [ ] `scroll-snap` is used for smooth mobile interactions.
- [ ] `priorityLoad` is applied to the first 2-3 items to optimize LCP.
- [ ] Mobile scroll indicator is visible.

### Filters

- [ ] All inputs have labels
- [ ] Checkboxes are keyboard accessible
- [ ] Clear filters button is discoverable
