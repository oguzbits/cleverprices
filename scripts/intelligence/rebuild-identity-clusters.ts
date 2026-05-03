import { inArray } from "drizzle-orm";

import { db } from "../../src/db";
import { products } from "../../src/db/schema";
import {
  clusterProducts,
  getCanonicalRepresentative,
} from "../../src/lib/intelligence/identity-engine";

/**
 * Maintenance Script: Rebuild Identity Clusters
 *
 * Scans the entire catalog, generates semantic hashes, and groups products
 * by assigning a stable `canonicalId`.
 *
 * Usage: DB_PATH=data/cleverprices.db bun scripts/intelligence/rebuild-identity-clusters.ts
 */

async function main() {
  console.log("🚀 [Identity Resolution] Starting Cluster Scan...");

  // 1. Fetch products needing evaluation
  // Optimization: For huge DBs we would batch, but for ~10-20k products, in-memory is fine.
  const allProducts = await db.select().from(products);
  console.log(
    `📋 [Identity Resolution] Analyzing ${allProducts.length} products...`,
  );

  // 2. Cluster them using the Intelligence Engine
  const clusters = clusterProducts(allProducts as any);
  console.log(
    `✨ [Identity Resolution] Discovered ${clusters.size} Semantic Clusters.`,
  );

  // 3. Bulk Update Canonical IDs
  let totalUpdated = 0;
  let skipped = 0;

  const entries = Array.from(clusters.entries());

  for (const [hash, members] of entries) {
    if (members.length === 0) continue;

    // Identify the "Winner" (Master Product) for this cluster
    const canonical = getCanonicalRepresentative(members as any);
    const canonicalId = canonical.id;

    // Filter products that need an update (already have canonicalId? skip)
    const needsUpdate = members.filter((p) => p.canonicalId !== canonicalId);

    if (needsUpdate.length > 0) {
      const ids = needsUpdate.map((p) => p.id);

      // Update in chunks to keep SQLite happy
      const chunkSize = 50;
      for (let i = 0; i < ids.length; i += chunkSize) {
        const chunk = ids.slice(i, i + chunkSize);
        await db
          .update(products)
          .set({ canonicalId })
          .where(inArray(products.id, chunk as number[]));
      }
      totalUpdated += ids.length;
    } else {
      skipped += members.length;
    }
  }

  console.log("\n--- Audit Summary ---");
  console.log(`✅ Updated: ${totalUpdated} products`);
  console.log(`⏭️  Already Canonical: ${skipped} products`);
  console.log(`📦 Final Clusters: ${clusters.size}`);
  console.log("----------------------\n");
}

main().catch((err) => {
  console.error("❌ Fatal Error during Identity Resolution:", err);
  process.exit(1);
});
