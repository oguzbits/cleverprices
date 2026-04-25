---
description: How to safely remove a category from the application
---

This workflow outlines the steps to completely remove a category from the application without causing type errors or build failures.

1.  **Remove from `categories.ts`**:
    - Open `src/lib/categories.ts`.
    - Remove the category slug from the `CategorySlug` type definition.
    - Remove the corresponding entry from the `CATEGORY_MAP` object.

2.  **Remove Content**:
    - Open `src/lib/category-content.ts`.
    - Remove the category's entry from the `categoryContent` object.

3.  **Remove FAQs**:
    - Open `src/lib/category-faqs.ts`.
    - Remove the category's entry from the `categoryFAQs` object.

4.  **Remove Keepa Configuration (if applicable)**:
    - Open `src/lib/keepa/product-discovery.ts`.
    - Check `CATEGORY_BROWSE_NODES` and remove the category entry if it exists.
    - Check `getCategoryKeywords` and remove the category entry if it exists.

5.  **Verify**:
    - Run `bun run build` to ensure there are no TypeScript errors.
