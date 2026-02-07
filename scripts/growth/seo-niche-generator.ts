import { and, eq, lte, sql } from "drizzle-orm";
import { db } from "../../src/db";
import { prices, products } from "../../src/db/schema";
import { CATEGORY_MANIFEST } from "../../src/lib/category-manifest";

/**
 * Categorical Niche SEO Generator
 *
 * Scans the database for high-intent segments:
 * 1. Price Brackets: "Best [Category] under [100, 300, 500, 1000] Euro"
 * 2. Brand Clusters: "Best [Brand] [Category]"
 */

interface NichePage {
  slug: string;
  title: string;
  category: string;
  filters: {
    maxPrice?: number;
    brand?: string;
    condition?: string;
  };
  productCount: number;
}

async function main() {
  console.log("🚀 [SEO Generator] Starting Niche Discovery...");

  const nicheManifest: NichePage[] = [];
  const categories = Object.keys(CATEGORY_MANIFEST);

  for (const cat of categories) {
    const config = CATEGORY_MANIFEST[cat as keyof typeof CATEGORY_MANIFEST];
    if (!config) continue;

    // --- 1. Price Brackets ---
    const priceBrackets = [100, 200, 300, 500, 1000, 1500, 2000];

    for (const limit of priceBrackets) {
      // Check if we have enough products in this price bracket
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .innerJoin(prices, eq(products.id, prices.productId))
        .where(
          and(
            eq(products.category, cat),
            lte(prices.price, limit),
            eq(prices.country, "de"),
          ),
        );

      const count = countResult[0]?.count || 0;

      if (count >= 10) {
        // Threshold for a "Good" niche page
        nicheManifest.push({
          slug: `best-${cat}-under-${limit}-euro`,
          title: `Die besten ${config.name} unter ${limit} Euro (2025)`,
          category: cat,
          filters: { maxPrice: limit },
          productCount: count,
        });
      }
    }

    // --- 2. Brand Clusters ---
    const brandsResult = await db
      .select({ brand: products.brand, count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.category, cat))
      .groupBy(products.brand)
      .having(sql`count(*) >= 12`); // Only brands with enough products

    for (const { brand, count } of brandsResult) {
      if (!brand) continue;

      const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]/g, "-");
      nicheManifest.push({
        slug: `best-${brandSlug}-${cat}`,
        title: `Beste ${brand} ${config.name}: Kaufberatung & Vergleich`,
        category: cat,
        filters: { brand },
        productCount: count,
      });
    }
  }

  // 3. Save to data directory
  const outputPath = "./data/niche-manifest.json";
  await Bun.write(outputPath, JSON.stringify(nicheManifest, null, 2));

  console.log(
    `\n✅ Success! Generated ${nicheManifest.length} Niche SEO Pages.`,
  );
  console.log(`📂 Manifest saved to: ${outputPath}\n`);
}

main().catch(console.error);
