import { eq, like, or } from "drizzle-orm";
import { db } from "../../src/db";
import { products } from "../../src/db/schema";

async function main() {
  console.log("🧹 Starting Bad Model Cleanup...");

  // Fetch products that might have the issue
  // We look for 'Modell' in the JSON string
  const allProducts = await db
    .select()
    .from(products)
    .where(
      or(
        like(products.officialSpecifications, "%Modell%"),
        like(products.specifications, "%Modell%"),
      ),
    );

  console.log(`Checking ${allProducts.length} candidate products...`);

  let fixedCount = 0;
  const badModels = new Set([
    "handy",
    "smartphone",
    "tablet",
    "mobile phone",
    "cell phone",
    "mobiltelefon",
    "undefined",
    "other",
  ]);

  for (const product of allProducts) {
    let changed = false;
    let newOfficialSpecs: any = null;
    let newLegacySpecs: any = null;

    // Helper to fix a spec object
    const fixSpecs = (specs: any) => {
      if (!specs || typeof specs !== "object") return { specs, changed: false };

      let localChanged = false;
      const newSpecs = { ...specs };

      if (newSpecs["Modell"]) {
        const val = String(newSpecs["Modell"]).trim().toLowerCase();
        if (badModels.has(val)) {
          console.log(
            `   Product ${product.id}: Removing invalid "Modell": "${newSpecs["Modell"]}"`,
          );
          delete newSpecs["Modell"];
          localChanged = true;
        }
      }
      return { specs: newSpecs, changed: localChanged };
    };

    // 1. Fix Official Specs
    if (product.officialSpecifications) {
      try {
        const parsed =
          typeof product.officialSpecifications === "string"
            ? JSON.parse(product.officialSpecifications)
            : product.officialSpecifications;
        const res = fixSpecs(parsed);
        if (res.changed) {
          newOfficialSpecs = res.specs;
          changed = true;
        }
      } catch (e) {
        console.error(`Error parsing official specs for ${product.id}`, e);
      }
    }

    // 2. Fix Legacy Specs
    if (product.specifications) {
      try {
        const parsed =
          typeof product.specifications === "string"
            ? JSON.parse(product.specifications)
            : product.specifications;
        const res = fixSpecs(parsed);
        if (res.changed) {
          newLegacySpecs = res.specs;
          changed = true;
        }
      } catch (e) {
        console.error(`Error parsing legacy specs for ${product.id}`, e);
      }
    }

    if (changed) {
      await db
        .update(products)
        .set({
          officialSpecifications: newOfficialSpecs
            ? JSON.stringify(newOfficialSpecs)
            : product.officialSpecifications,
          specifications: newLegacySpecs
            ? JSON.stringify(newLegacySpecs)
            : product.specifications,
        })
        .where(eq(products.id, product.id));
      fixedCount++;
    }
  }

  console.log(`✅ Finished. Cleaned ${fixedCount} products.`);
  process.exit(0);
}

main().catch(console.error);
