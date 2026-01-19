"use server";

import { client } from "@/db";
import { allCategories, type CategorySlug } from "@/lib/categories";
import { searchProducts } from "@/lib/product-registry";

export interface SearchCategory {
  name: string;
  path?: string;
  slug: CategorySlug;
  searchTerm?: string;
}

export interface SearchProduct {
  slug: string;
  title: string;
  categoryName: string;
}

export interface SearchResults {
  categories: SearchCategory[];
  products: SearchProduct[];
}

// 1. Static Top Brands Mapping (Super Fast Path, Bypass DB)
const TOP_BRANDS: Record<string, { name: string; categories: string[] }> = {
  apple: {
    name: "Apple",
    categories: ["smartphones", "notebooks", "tablets", "smartwatches"],
  },
  samsung: {
    name: "Samsung",
    categories: [
      "smartphones",
      "ssds",
      "speicherkarten",
      "monitors",
      "smartwatches",
      "tvs",
    ],
  },
  sony: {
    name: "Sony",
    categories: ["consoles", "cameras", "headphones", "tvs"],
  },
  bose: { name: "Bose", categories: ["headphones", "speakers"] },
  nintendo: { name: "Nintendo", categories: ["consoles"] },
  western: {
    name: "Western Digital",
    categories: ["ssds", "external-storage"],
  },
  wd: { name: "Western Digital", categories: ["ssds", "external-storage"] },
  sandisk: {
    name: "SanDisk",
    categories: ["speicherkarten", "external-storage", "ssds"],
  },
  crucial: { name: "Crucial", categories: ["ssds", "ram"] },
  intel: { name: "Intel", categories: ["cpu", "ssds"] },
};

export async function performSearch(
  query: string,
  limit: number = 10,
): Promise<SearchResults> {
  if (!query || query.length < 2) return { categories: [], products: [] };

  const s = query.toLowerCase().trim();
  const topBrand = TOP_BRANDS[s];

  try {
    let brandMatchedCategories: SearchCategory[] = [];

    // 1. Check Fast Path (Top Brands)
    if (topBrand) {
      brandMatchedCategories = topBrand.categories
        .map((catSlug): SearchCategory | null => {
          const cat = allCategories[catSlug as keyof typeof allCategories];
          if (!cat || cat.hidden) return null;
          const parent = cat.parent
            ? allCategories[cat.parent as CategorySlug]
            : null;
          const categoryPath = parent
            ? `${parent.name} › ${cat.name}`
            : cat.name;
          return {
            name: topBrand.name,
            path: categoryPath,
            slug: cat.slug as CategorySlug,
            searchTerm: topBrand.name,
          };
        })
        .filter((c): c is SearchCategory => c !== null);
    } else {
      // 2. Dynamic Brand-Category Mapping (Proactive mapping like Idealo)
      const brandCategoriesResult = await client.execute({
        sql: `
          SELECT brand, category, COUNT(*) as count 
          FROM products 
          WHERE brand LIKE ? 
          GROUP BY brand, category 
          ORDER BY count DESC 
          LIMIT 5
        `,
        args: [`${query}%`],
      });

      brandMatchedCategories = brandCategoriesResult.rows
        .map((row: any): SearchCategory | null => {
          const cat = allCategories[row.category as keyof typeof allCategories];
          if (!cat || cat.hidden) return null;

          const parent = cat.parent
            ? allCategories[cat.parent as CategorySlug]
            : null;
          const categoryPath = parent
            ? `${parent.name} › ${cat.name}`
            : cat.name;

          return {
            name: row.brand as string,
            path: categoryPath,
            slug: cat.slug as CategorySlug,
            searchTerm: row.brand as string,
          };
        })
        .filter((c): c is SearchCategory => c !== null);
    }

    // 3. Match Categories by Name/Alias (Static List)
    const exactCategories: SearchCategory[] = Object.values(allCategories)
      .filter(
        (c) =>
          !c.hidden &&
          (c.name.toLowerCase().includes(s) ||
            c.aliases?.some((a) => a.toLowerCase().includes(s))),
      )
      .slice(0, 3)
      .map((c) => {
        const parent = c.parent
          ? allCategories[c.parent as CategorySlug]
          : null;
        return {
          name: c.name,
          path: parent ? (parent.name as string) : undefined,
          slug: c.slug as CategorySlug,
        };
      });

    // 4. Match Products (Database FTS)
    const productResults = await searchProducts(query, 40);

    // 5. Build Combined Result List (Strict limit based on parameter)
    const seenCategorySlugs = new Set<string>();
    const categorySuggestions: SearchCategory[] = [];

    // A. Brand-in-Category matches (Highest Priority)
    // We allow categories to take up to 70% of the limit
    const maxCategories = Math.ceil(limit * 0.7);

    brandMatchedCategories.forEach((c) => {
      if (categorySuggestions.length < maxCategories) {
        seenCategorySlugs.add(c.slug);
        categorySuggestions.push(c);
      }
    });

    // B. Exact Category Name matches
    exactCategories.forEach((c) => {
      if (
        !seenCategorySlugs.has(c.slug) &&
        categorySuggestions.length < maxCategories + 1
      ) {
        seenCategorySlugs.add(c.slug);
        categorySuggestions.push(c);
      }
    });

    // C. Products with Intelligent Grouping (Up to 'limit' total items)
    const seenFamilies = new Set<string>();
    const matchedProducts: SearchProduct[] = [];

    // Calculate how many products we can show (limit - categories, but at least 2 if they exist)
    const categoryCount = categorySuggestions.length;
    const maxProducts = Math.max(2, limit - categoryCount);

    for (const p of productResults) {
      if (
        matchedProducts.length >= maxProducts ||
        matchedProducts.length + categoryCount >= limit
      )
        break;

      const familyKey = p.parentAsin || p.title.toLowerCase().trim();
      if (!seenFamilies.has(familyKey)) {
        seenFamilies.add(familyKey);
        matchedProducts.push({
          slug: p.slug,
          title: p.title,
          categoryName:
            allCategories[p.category as keyof typeof allCategories]?.name ||
            p.category,
        });
      }
    }

    return {
      categories: categorySuggestions,
      products: matchedProducts,
    };
  } catch (error) {
    console.error("Search Action Error:", error);
    return { categories: [], products: [] };
  }
}
