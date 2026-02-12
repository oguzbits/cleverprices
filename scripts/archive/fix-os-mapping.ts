import { eq, like, or } from "drizzle-orm";
import { db } from "../../src/db";
import { products } from "../../src/db/schema";

async function main() {
  console.log("🔧 Starting OS Mapping Fix...");

  // Fetch products that might have the issue
  // We look for 'Prozessorfamilie' in the JSON string
  const allProducts = await db
    .select()
    .from(products)
    .where(
      or(
        like(products.officialSpecifications, "%Prozessorfamilie%"),
        like(products.specifications, "%Prozessorfamilie%"),
      ),
    );

  console.log(`Checking ${allProducts.length} candidate products...`);

  let fixedCount = 0;
  const osKeywords = [
    "ios",
    "android",
    "ipados",
    "watchos",
    "tvos",
    "windows",
    "macos",
    "linux",
    "chrome os",
    "fire os",
  ];

  for (const product of allProducts) {
    let changed = false;
    let newOfficialSpecs: any = null;
    let newLegacySpecs: any = null;

    // Helper to fix a spec object
    const fixSpecs = (specs: any) => {
      if (!specs || typeof specs !== "object") return { specs, changed: false };

      let localChanged = false;
      const newSpecs = { ...specs };

      // Check exact key match
      if (newSpecs["Prozessorfamilie"]) {
        const val = String(newSpecs["Prozessorfamilie"]).toLowerCase();
        const isOs = osKeywords.some((kw) => val.includes(kw));
        // Additional check: Does it look like a processor? "Core i5", "Ryzen", "Snapdragon", "A15"
        // If it's a phone and says "A15", it IS a processor.
        // If it says "iOS 15", it is OS.

        if (isOs) {
          console.log(
            `   Product ${product.id}: Moving "Prozessorfamilie": "${newSpecs["Prozessorfamilie"]}" -> "Betriebssystem"`,
          );
          newSpecs["Betriebssystem"] = newSpecs["Prozessorfamilie"];
          delete newSpecs["Prozessorfamilie"];
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
          newOfficialSpecs = res.specs; // Drizzle handles JSON/string automatically depending on driver, but usually string for TEXT fields
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

  console.log(`✅ Finished. Fixed ${fixedCount} products.`);
  process.exit(0);
}

main().catch(console.error);
