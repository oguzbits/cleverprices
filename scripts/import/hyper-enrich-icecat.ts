import { eq, isNull, or } from "drizzle-orm";
import { db, products } from "../../src/db";
import { localIcecatDataSource as icecatDataSource } from "../../src/lib/data-sources/icecat-local";

/**
 * Hyper-Enrich Icecat
 * Performs a secondary scan using both GTIN and MPN to maximize spec coverage.
 */
async function hyperEnrich() {
  console.log("💎 CleverPrices Product Hyper-Enrichment (Icecat Edition)");
  console.log("-------------------------------------------------------");

  const candidates = await db.query.products.findMany({
    where: or(
      isNull(products.officialSpecifications),
      eq(products.enrichmentStatus, "pending"),
    ),
    limit: 10000,
  });

  if (candidates.length === 0) {
    console.log("✅ No candidates found for enrichment.");
    return;
  }

  console.log(
    `📋 Found ${candidates.length} products missing professional specs.`,
  );
  let hits = 0;

  for (const product of candidates) {
    console.log(`\n🔍 Checking: ${product.title.slice(0, 50)}...`);
    let icecatProduct = null;

    // 1. Try GTIN first (highest accuracy)
    if (product.gtin) {
      console.log(`   Trying GTIN: ${product.gtin}`);
      icecatProduct = await icecatDataSource.fetchProductByGtin(
        product.gtin,
        "de",
      );
    }

    // 2. Try MPN fallback
    const invalidMpns = ["1.0", "null", "n/a", "none", "unknown"];
    const isValidMpn = (m: string) =>
      m && m.length > 2 && !invalidMpns.includes(m.toLowerCase());

    if (!icecatProduct && product.mpn && isValidMpn(product.mpn)) {
      console.log(`   Trying MPN fallback: ${product.mpn}`);
      const icecatId = await icecatDataSource.findIdByMpn(product.mpn);
      if (icecatId) {
        icecatProduct = await icecatDataSource.fetchProduct(icecatId, "de");
      }
    }

    // 3. Try Smart MPN Matching (aggressive)
    if (!icecatProduct && product.mpn && product.mpn.length > 5) {
      // Many MPNs are like "100-000000910", but Icecat might have "000000910..."
      // Or "BX8071514900K" vs "8071514900K"

      // Try stripping known prefixes AND suffixes
      // e.g. 100-000000910WOF -> 000000910
      let cleanMpn = product.mpn
        .replace(/^(100-|BX|CM|YD)/i, "")
        .replace(/-/g, "");

      // Remove common suffixes like WOF, BOX, MPK, SBX
      cleanMpn = cleanMpn.replace(/(WOF|BOX|MPK|SBX|TRAY)$/i, "");

      // If it looks like a Ryzen MPN (numeric), keep only digits if mixed?
      // Let's rely on the suffix removal first.

      if (cleanMpn.length > 4) {
        console.log(`   Trying Smart MPN Match: "%${cleanMpn}%"`);
        // We need to find an ID where the MPN *contains* our clean sequence
        // This requires a LIKE query on the icecat index

        try {
          // Access the raw sqlite database for the index
          // We can't do this easily through the current abstraction unless we extend it or use raw `db` if mapped
          // But we are using `icecatDataSource` which is a class.
          // Let's rely on the `findIdByMpn` to support a 'loose' mode if we modified it,
          // OR just try variations.

          // Variation 1: Naked
          let id = await icecatDataSource.findIdByMpn(cleanMpn);

          // Variation 2: With generic prefix if stripped
          if (!id && !product.mpn.startsWith("100-")) {
            id = await icecatDataSource.findIdByMpn("100-" + cleanMpn);
          }

          if (id) {
            console.log(`   ✅ FOUND via Smart MPN: ${id}`);
            icecatProduct = await icecatDataSource.fetchProduct(id, "de");
          }
        } catch (e) {
          console.error("Smart MPN error:", e);
        }
      }
    }

    // 4. Try Fuzzy Title Match (Last Resort)
    if (!icecatProduct) {
      // Clean the title for better matching
      // Clean the title for better matching
      // 1. Remove specific dimensions usually followed by units, but preserve the rest
      const cleanTitle = product.title
        .replace(/\d+\s*(Zoll|cm|GB|TB|RAM|SSD)/gi, "")
        .replace(/[,()|\[\]]/g, " ")
        // 2. Split and filter
        .split(/\s+/)
        // ALLOW 2-char identifiers like "M4", "S9", "5G"
        // Reject 1-char, unless maybe it's "X"? Safe to reject 1-char for now.
        .filter((w) => w.length >= 2)
        .slice(0, 6) // INCREASED from 3 to 6: "Apple MacBook Air 13 M4 2024" needs more tokens
        .join(" ")
        .trim();

      if (cleanTitle.length > 8) {
        console.log(`   Trying Fuzzy Title Match: "${cleanTitle}"`);
        const icecatId = await icecatDataSource.findIdByTitle(cleanTitle);
        if (icecatId) {
          console.log(`   ✅ FOUND via Title: ${icecatId}`);
          icecatProduct = await icecatDataSource.fetchProduct(icecatId, "de");
        }
      }
    }

    if (icecatProduct) {
      console.log(`   ✅ SUCCESS: Found ${icecatProduct.title}`);

      const officialSpecs = JSON.stringify(icecatProduct.specifications);

      await db
        .update(products)
        .set({
          officialSpecifications: officialSpecs,
          officialTitle: icecatProduct.title,
          icecatId: Number(icecatProduct.id),
          enrichmentStatus: "processed",
          specificationsSource: "icecat",
          lastEnrichedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(products.id, product.id));

      hits++;
    } else {
      console.log(`   ❌ No official specs found.`);
      await db
        .update(products)
        .set({
          enrichmentStatus: "not_found",
          lastEnrichedAt: new Date(),
        })
        .where(eq(products.id, product.id));
    }
  }

  console.log("\n-------------------------------------------------------");
  console.log(
    `✨ Hyper-Enrichment Batch Complete. Hits: ${hits}/${candidates.length}`,
  );
}

hyperEnrich().catch(console.error);
