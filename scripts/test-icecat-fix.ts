import { like } from "drizzle-orm";
import { db, products } from "../src/db";
import { localIcecatDataSource as icecatDataSource } from "../src/lib/data-sources/icecat-local";

async function main() {
  console.log("🧪 Testing Icecat Fix for Apple MacBook Air M4...");

  // Fetch the specific product(s)
  const candidates = await db.query.products.findMany({
    where: like(products.title, "%MacBook Air%M4%"),
    limit: 5,
  });

  console.log(`Checking ${candidates.length} candidates...`);

  for (const product of candidates) {
    console.log(`\nProduct: ${product.title}`);

    // Reproduce the cleaned title logic
    const cleanTitle = product.title
      .replace(/\d+\s*(Zoll|cm|GB|TB|RAM|SSD)/gi, "")
      .replace(/[,()|\[\]]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 2)
      .slice(0, 6)
      .join(" ")
      .trim();

    console.log(`   Cleaned Title: "${cleanTitle}"`);

    if (cleanTitle.length > 8) {
      const icecatId = await icecatDataSource.findIdByTitle(cleanTitle);
      if (icecatId) {
        console.log(`   ✅ FOUND Icecat ID: ${icecatId}`);

        // Fetch the title of the matched ID to confirm it's not the old one
        // We can't easily fetch title from ID with the current DataSource exposure without fetchProduct
        // But fetchProduct is available.
        const p = await icecatDataSource.fetchProduct(icecatId, "de");
        if (p) {
          console.log(`   matched Product Title: ${p.title}`);
          if (p.title.includes("M4")) {
            console.log("   🎉 SUCCESS: Matched an M4 product!");
          } else if (
            p.specifications &&
            JSON.stringify(p.specifications).includes("M4")
          ) {
            console.log("   🎉 SUCCESS: Specs contain M4!");
          } else {
            console.log(
              "   ⚠️ WARNING: Matched product does not explicitly say M4 in title. Check manually.",
            );
          }
        }
      } else {
        console.log(`   ❌ No match found for cleaned title.`);
      }
    } else {
      console.log("   ❌ Title too short after cleaning.");
    }
  }
}

main().catch(console.error);
