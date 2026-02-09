import { db } from "@/db";
import { products } from "@/db/schema";
import { generateProductSlug } from "@/lib/utils/slug";
import { eq } from "drizzle-orm";

async function regenerateSlugs() {
  console.log("Fetching all products...");
  const allProducts = await db.select().from(products);

  // Build Parent Lookup Map
  const productMap = new Map<string, typeof products.$inferSelect>();
  allProducts.forEach((p) => productMap.set(p.asin, p));

  console.log(`Found ${allProducts.length} products. Regenerating slugs...`);

  let updatedCount = 0;
  let skippedCount = 0;

  for (const product of allProducts) {
    let titleBase = product.title;

    // VARIANT URL LOGIC: Use Parent Title if available
    if (product.parentAsin) {
      const parent = productMap.get(product.parentAsin);
      if (parent) {
        titleBase = parent.title;
      }
    }

    const newSlug = generateProductSlug(
      titleBase,
      product.brand,
      product.asin,
      {
        storage:
          product.capacity && product.capacityUnit
            ? `${product.capacity}${product.capacityUnit}`
            : undefined,
      },
    );

    if (newSlug !== product.slug) {
      try {
        await db
          .update(products)
          .set({ slug: newSlug })
          .where(eq(products.id, product.id));

        console.log(`✅ Updated: ${product.slug} → ${newSlug}`);
        updatedCount++;
      } catch (error) {
        console.error(`❌ Failed to update ${product.asin}: ${error}`);
        skippedCount++;
      }
    } else {
      skippedCount++;
    }
  }

  console.log(
    `\n✨ Done! Updated: ${updatedCount}, Unchanged: ${skippedCount}`,
  );
}

regenerateSlugs().catch(console.error);
