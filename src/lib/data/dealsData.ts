import {
  getChildCategories,
  type CategorySlug,
  allCategories,
} from "@/lib/categories";
import { getProductsByCategory, type Product } from "@/lib/product-registry";
import { DEFAULT_COUNTRY } from "@/lib/countries";

/**
 * Get all deal products across major categories.
 * "Deal" is determined by having a discount or being a price-per-unit leader.
 */
export async function getAllDeals(
  limit: number = 24,
  countryCode: string = DEFAULT_COUNTRY,
): Promise<Product[]> {
  // Focus on major categories to find the best deals
  const majorCategories: CategorySlug[] = [
    "elektroartikel",
    "pc-komponenten",
    "computer",
    "telekommunikation",
    "hifi-audio",
    "tv-sat",
    "gaming-elektrospielzeug",
    "haushaltselektronik",
  ];

  // Get all subcategories from these major parents
  const allSubCats = new Set<CategorySlug>();
  majorCategories.forEach((parent) => {
    const children = getChildCategories(parent);
    children.forEach((child) => allSubCats.add(child.slug));
  });

  // Fetch products from all these categories
  // We prioritize featured/popular categories via manual selection if this becomes too slow
  const productPromises = Array.from(allSubCats).map((slug) =>
    getProductsByCategory(slug, true),
  );

  const productArrays = await Promise.all(productPromises);
  const allProducts = productArrays.flat();

  // Filter products with valid prices
  const validProducts = allProducts.filter(
    (p) => p.prices[countryCode] !== undefined && p.prices[countryCode] > 0,
  );

  // Sort by savings/discount if we had that data, or pricePerUnit for relevant items
  // For now, we'll sort by a mix of factors to surface interesting items:
  // 1. Availability (more prices = better)
  // 2. Price (lower might be a "deal")
  // 3. Randomness (to keep it fresh)

  // Improved sorting logic:
  const sorted = validProducts.sort((a, b) => {
    // 1. Prioritize items with pricePerUnit (analytical deals)
    if (a.pricePerUnit && !b.pricePerUnit) return -1;
    if (!a.pricePerUnit && b.pricePerUnit) return 1;

    // 2. If both have unit prices, lower unit price wins
    if (a.pricePerUnit && b.pricePerUnit) {
      return a.pricePerUnit - b.pricePerUnit;
    }

    // 3. Fallback: Lower absolute price
    return (
      (a.prices[countryCode] || 999999) - (b.prices[countryCode] || 999999)
    );
  });

  // Remove duplicates based on slug
  const uniqueProducts = Array.from(
    new Map(sorted.map((item) => [item.slug, item])).values(),
  );

  return uniqueProducts.slice(0, limit);
}
