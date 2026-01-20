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
    categories: ["smartphones", "tablets", "smartwatches", "notebooks"],
  },
  samsung: {
    name: "Samsung",
    categories: [
      "smartphones",
      "tvs",
      "ssds",
      "monitors",
      "smartwatches",
      "speicherkarten",
    ],
  },
  xiaomi: { name: "Xiaomi", categories: ["smartphones"] },
  asus: {
    name: "ASUS",
    categories: ["gpu", "monitors", "notebooks", "motherboards", "routers"],
  },
  intel: { name: "Intel", categories: ["cpu", "ssds"] },
  lenovo: { name: "Lenovo", categories: ["notebooks"] },
  sandisk: {
    name: "SanDisk",
    categories: ["speicherkarten", "ssds", "external-storage"],
  },
  gigabyte: { name: "Gigabyte", categories: ["gpu", "motherboards"] },
  msi: {
    name: "MSI",
    categories: ["gpu", "motherboards", "monitors", "notebooks"],
  },
  western: { name: "Western Digital", categories: ["hard-drives", "ssds"] },
  wd: {
    name: "Western Digital",
    categories: ["hard-drives", "ssds", "external-storage"],
  },
  crucial: { name: "Crucial", categories: ["ram", "ssds", "external-storage"] },
  seagate: { name: "Seagate", categories: ["hard-drives", "external-storage"] },
  hp: { name: "HP", categories: ["notebooks", "computer", "laserdrucker"] },
  lexar: { name: "Lexar", categories: ["speicherkarten", "ssds", "ram"] },
  lg: { name: "LG", categories: ["tvs", "monitors"] },
  jbl: { name: "JBL", categories: ["headphones", "speakers"] },
  google: { name: "Google", categories: ["smartphones"] },
  acer: { name: "Acer", categories: ["notebooks", "monitors"] },
  nintendo: { name: "Nintendo", categories: ["consoles"] },
  playstation: { name: "Playstation", categories: ["consoles"] },
  sony: {
    name: "Sony",
    categories: ["tvs", "systemkameras", "headphones", "consoles"],
  },
  corsair: {
    name: "Corsair",
    categories: ["ram", "power-supplies", "pc-cases"],
  },
  kingston: { name: "Kingston", categories: ["ram", "ssds"] },
  logitech: {
    name: "Logitech",
    categories: ["mice", "keyboards", "headphones"],
  },
  amd: { name: "AMD", categories: ["cpu", "gpu"] },
  philips: { name: "Philips", categories: ["monitors", "tvs"] },
  motorola: { name: "Motorola", categories: ["smartphones"] },
  tp: { name: "TP-Link", categories: ["routers"] },
};

/**
 * Internal search function that hits the database.
 * Wrapped by unstable_cache for cross-user performance.
 */
const getInternalSearchResults = async (
  query: string,
  limit: number,
): Promise<SearchResults> => {
  const s = query.toLowerCase().trim();
  const topBrand = TOP_BRANDS[s];
  const isMultiWord = s.includes(" ");

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
    } else if (!isMultiWord && s.length > 2) {
      // 2. Dynamic Brand-Category Mapping (Only for single words to save reads)
      let brandCategoriesResult;
      try {
        brandCategoriesResult = await client.execute({
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
      } catch (e) {
        console.warn("Brand categories query failed:", e);
        brandCategoriesResult = { rows: [] };
      }

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

    // C. Products with Intelligent Grouping
    const seenFamilies = new Set<string>();
    const matchedProducts: SearchProduct[] = [];

    // Aim for at least 3-4 products even if categories are many
    const minProducts = 4;
    const maxTotalItems = Math.max(limit + 2, 10);

    for (const p of productResults) {
      if (
        matchedProducts.length >= minProducts &&
        matchedProducts.length + categorySuggestions.length >= maxTotalItems
      ) {
        break;
      }

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
  } catch (error: any) {
    console.error(
      `Search Action Error [query="${query}", cwd=${process.cwd()}]:`,
      error.message,
    );
    // Return empty results instead of throwing to maintain UI stability
    return { categories: [], products: [] };
  }
};

/**
 * LIVE Search Action (Bypass cache for diagnostics)
 */
export const performSearch = async (
  query: string,
  limit: number = 6,
): Promise<SearchResults> => {
  if (!query || query.length < 2) return { categories: [], products: [] };

  try {
    // Call internal search directly to isolate issues from unstable_cache
    return await getInternalSearchResults(query, limit);
  } catch (error: any) {
    console.error(`Perform Search Crash [query="${query}"]:`, error.message);
    return { categories: [], products: [] };
  }
};
