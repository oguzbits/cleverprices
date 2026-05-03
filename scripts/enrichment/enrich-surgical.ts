import { eq } from "drizzle-orm";

import { db, products } from "../../src/db";
import { sanitizeSpecs } from "../../src/lib/utils/specs-sanitizer";
import { EbayEnricher } from "./ebay-enricher";
import { EBAY_FIELD_MAP, normalizeEbayValue } from "./ebay-mapper";

async function enrichOne(id: number) {
  const enricher = new EbayEnricher();
  const product = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .get();
  if (!product) return;

  console.log(`🎯 Targeted Enrichment for ID ${id}: ${product.title}`);

  try {
    const ebayData = await enricher.searchByGtin(
      product.gtin!,
      product.title,
      product.mpn,
    );
    if (!ebayData) {
      console.log("❌ Still no match for this specific ID.");
      return;
    }

    const rawSpecs: Record<string, string> = {};
    for (const aspect of (ebayData as any).localizedAspects || []) {
      const cpField = EBAY_FIELD_MAP[aspect.name];
      if (cpField) {
        rawSpecs[cpField] = normalizeEbayValue(aspect.name, aspect.value);
      }
    }

    const identityContext = {
      title: product.title || "",
      brand: product.brand || "",
      model: product.title, // Simple fallback for targeted enrichment
    };

    const sanitized = sanitizeSpecs(rawSpecs, identityContext);
    console.log("✅ Results:", sanitized);
  } catch (e: any) {
    console.error("❌ Error during manual enrichment:", e.message);
  }
}

enrichOne(3650);
