import { eq } from "drizzle-orm";
import { db, products } from "../../src/db";
import { LocalIcecatDataSource } from "../../src/lib/data-sources/icecat-local";
import { sanitizeSpecs } from "../../src/lib/utils/specs-sanitizer";

async function forceiPhone() {
  const source = new LocalIcecatDataSource();
  const ids = [3650, 3867, 3869, 3870, 3871, 2958, 2960, 2961, 2963];

  for (const id of ids) {
    const product = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .get();
    if (!product) continue;

    console.log(`\n🚀 Forcing Icecat for ID ${id}: ${product.title}`);
    const icecatData = await source.fetchProductByGtin(product.gtin!, "de");

    if (icecatData && icecatData.specifications) {
      const identityContext = {
        title: product.title || "",
        brand: "Apple",
        model: product.title.replace(/iPhone\s*/i, "").trim(),
      };
      const sanitized = sanitizeSpecs(
        icecatData.specifications,
        identityContext,
      );
      console.log(`✅ Success! Found ${Object.keys(sanitized).length} fields.`);

      await db
        .update(products)
        .set({
          officialTitle: icecatData.title || product.officialTitle,
          officialSpecifications: JSON.stringify(sanitized),
          enrichmentStatus: "processed",
          specificationsSource: "icecat",
          lastEnrichedAt: new Date(),
        })
        .where(eq(products.id, id));
    } else {
      console.log("❌ Still not found on Icecat.");
    }
  }
}

forceiPhone();
