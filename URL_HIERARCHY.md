# RealPriceData - URL Structure Overview

## 🌳 URL Hierarchy Tree

```
realpricedata.com
│
├── / (Homepage)
│
├── /categories (Category Hub - Overview of all categories)
│
├── /electronics (Parent Category)
│   ├── /electronics/hard-drives ⭐
│   ├── /electronics/usb-drives
│   ├── /electronics/microsd-cards
│   └── /electronics/batteries
│
├── /groceries (Parent Category)
│   ├── /groceries/coffee
│   ├── /groceries/protein-powder ⭐
│   ├── /groceries/rice-and-pasta
│   └── /groceries/snacks
│
└── /home (Parent Category)
    ├── /home/laundry-detergent ⭐
    ├── /home/paper-products
    ├── /home/trash-bags
    ├── /home/dishwasher-tabs
    └── /home/diapers

⭐ = Featured on homepage
```

## 📐 URL Pattern

```
Pattern: /{parent-category}/{category}

Components:
- parent-category: Top-level grouping (3 total)
- category: Specific product category (12 total)
```

## 🎯 Example User Journey

```
1. User lands on homepage
   URL: /

2. Clicks "Browse Categories"
   URL: /categories

3. Clicks "Storage & Tech" section
   URL: /storage-and-tech

4. Clicks "Hard Drives & SSDs"
   URL: /storage-and-tech/hard-drives

5. Applies filters (condition=new, sort by price/TB)
   URL: /storage-and-tech/hard-drives?condition=new&sort=price-per-unit
```

## 🔍 SEO Structure

### Breadcrumb Example

```
Home > Storage & Tech > Hard Drives & SSDs
  /    storage-and-tech   hard-drives
```

### URL Optimization

✅ **Good URLs:**

- `/storage-and-tech/hard-drives`
- `/food-and-beverages/protein-powder`
- `/household-essentials/laundry-detergent`

❌ **Avoid:**

- `/categories/storage` (old pattern)
- `/cat/hdd` (too short, not descriptive)
- `/storage-and-tech/hard-drives/new/4tb` (filters in path)

## 📊 Quick Reference

| URL Type        | Example                                       | Purpose                 |
| --------------- | --------------------------------------------- | ----------------------- |
| Homepage        | `/`                                           | Landing page            |
| Category Hub    | `/categories`                                 | Browse all categories   |
| Parent Category | `/storage-and-tech`                           | Category group overview |
| Product Listing | `/storage-and-tech/hard-drives`               | Products with filters   |
| With Filters    | `/storage-and-tech/hard-drives?condition=new` | Filtered products       |

## 🚀 Implementation Files

| File                                   | Purpose                          |
| -------------------------------------- | -------------------------------- |
| `src/lib/categories.ts`                | Category configuration & helpers |
| `src/app/[parent]/page.tsx`            | Parent category page             |
| `src/app/[parent]/[category]/page.tsx` | Product listing page             |
| `src/app/categories/page.tsx`          | Category hub                     |
| `src/components/breadcrumbs.tsx`       | Breadcrumb component             |
| `src/app/sitemap.ts`                   | Auto-generated sitemap           |

## 💡 Key Benefits

1. **SEO-Friendly**: Clear hierarchy, keyword-rich URLs
2. **User-Friendly**: Intuitive navigation, readable URLs
3. **Extensible**: Easy to add new categories or levels
4. **Type-Safe**: Full TypeScript support
5. **Maintainable**: Centralized configuration
