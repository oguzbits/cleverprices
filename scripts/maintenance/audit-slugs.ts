import { db, dbReady } from "../src/db";
import { products } from "../src/db/schema";
import { getFamilyIdentity } from "../src/lib/product-families";

async function auditDatabaseSlugs() {
  await dbReady;

  console.log("🔍 Auditing Database for Slug Inconsistencies...");

  // 1. Fetch all products with their parentAsins
  const allProducts = await db
    .select({
      id: products.id,
      slug: products.slug,
      parentAsin: products.parentAsin,
      title: products.title,
      brand: products.brand,
      category: products.category,
      variationAttributes: products.variationAttributes,
    })
    .from(products);

  // 2. Index by parentAsin
  const families = new Map<string, any[]>();
  for (const p of allProducts) {
    if (p.parentAsin) {
      if (!families.has(p.parentAsin)) families.set(p.parentAsin, []);
      families.get(p.parentAsin)!.push(p);
    }
  }

  let inconsistencies = 0;

  // 3. Compare current DB slug with calculated Consensus Slug
  for (const p of allProducts) {
    const siblings = p.parentAsin ? families.get(p.parentAsin) || [] : [p];
    const { slug: canonical } = getFamilyIdentity(p as any, siblings);

    // canonical here includes the ID prefix, e.g. "200005495_-wave-2..."
    const slugText = canonical.split("_-")[1] || canonical;
    const dbSlugText = p.slug.split("_-")[1] || p.slug;

    if (slugText !== dbSlugText) {
      inconsistencies++;
      if (inconsistencies < 50) {
        console.log(
          `[Mismatch ID ${p.id}] DB: ${dbSlugText} vs Canonical: ${slugText}`,
        );
      }
    }
  }

  console.log(
    `\nFound ${inconsistencies} products with non-canonical slugs in DB.`,
  );
  process.exit(inconsistencies > 0 ? 1 : 0);
}

auditDatabaseSlugs().catch((e) => {
  console.error(e);
  process.exit(1);
});
