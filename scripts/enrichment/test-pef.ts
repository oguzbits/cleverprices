import { and, eq, sql } from "drizzle-orm";
import { db, products } from "../../src/db";
import { LocalIcecatDataSource } from "../../src/lib/data-sources/icecat-local";
import {
  calculateSiblingConsensus,
  getProductIdentity,
} from "../../src/lib/utils/product-identity";
import { sanitizeSpecs } from "../../src/lib/utils/specs-sanitizer";

async function enrichTarget(id: number) {
  const source = new LocalIcecatDataSource();
  const product = await db.query.products.findFirst({
    where: eq(products.id, id),
  });

  if (!product) {
    console.error("Product not found");
    return;
  }

  console.log(`🔍 Target: ${product.title} (ID: ${id})`);

  let icecatData = null;
  if (product.gtin) {
    icecatData = await source.fetchProductByGtin(product.gtin, "de");
  }

  if (!icecatData && product.mpn) {
    const icecatId = await source.findIdByMpn(product.mpn);
    if (icecatId) {
      icecatData = await source.fetchProduct(icecatId, "de");
    }
  }

  if (!icecatData || !icecatData.specifications) {
    console.error("❌ Not found on Icecat");
    return;
  }

  const identity = getProductIdentity(product);

  // Sibling Consensus
  const siblings = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.category, product.category || ""),
        sql`${products.title} LIKE ${"%" + identity.model + "%"}`,
      ),
    )
    .limit(20);

  const consensus = calculateSiblingConsensus(siblings);
  const specs = icecatData.specifications;

  const identityContext = {
    title: product.title || "",
    brand: product.brand || "",
    model: identity.model,
  };

  console.log(`🛡️ Applying PEF Guards...`);
  const sanitized = sanitizeSpecs(specs, identityContext, consensus);

  console.log(`✅ Enrichment Complete.`);
  console.log(`- Original Specs: ${Object.keys(specs).length}`);
  console.log(`- Sanitized Specs: ${Object.keys(sanitized).length}`);

  const droppedKeys = Object.keys(specs).filter((k) => !sanitized[k]);
  if (droppedKeys.length > 0) {
    console.log(`- Blocked Fields: ${droppedKeys.join(", ")}`);
    droppedKeys.forEach((k) => {
      console.log(`  - ${k}: "${specs[k]}"`);
    });
  }

  if (sanitized["Modell"]) {
    console.log(`- Modell Field: "${sanitized["Modell"]}"`);
  }

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

  console.log(`💾 Database updated.`);
}

const id = parseInt(process.argv[2]);
if (id) {
  enrichTarget(id).catch(console.error);
} else {
  console.error("No ID provided");
}
