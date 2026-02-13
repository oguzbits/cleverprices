import { and, like } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { db, products } from "../src/db/index";

async function main() {
  console.log("🔍 Diagnosing Intel Enrichment Failure...");

  // Load Map
  const mapPath = path.join(process.cwd(), "data", "intel-url-map.json");
  const urlMap = JSON.parse(fs.readFileSync(mapPath, "utf-8"));
  console.log(`Loaded map with ${Object.keys(urlMap).length} entries.`);

  // Fetch some failed Intel products
  const failed = await db.query.products.findMany({
    where: and(
      like(products.title, "%Intel%"),
      // isNull(products.specificationsSource), // Assuming they are null or not 'intel'
    ),
    limit: 20,
    orderBy: products.id,
  });

  console.log(
    `\nChecking ${failed.length} sample products found with '%Intel%'...`,
  );

  for (const p of failed) {
    console.log(`\n--------------------------------------------------`);
    console.log(`ID: ${p.id}`);
    console.log(`Title: "${p.title}"`);
    console.log(`Status: ${p.enrichmentStatus}`);
    console.log(`Source: ${p.specificationsSource}`);

    // Replicate Extraction Logic
    let model: string | null = null;
    const patterns = [
      /(i[3579]-\d{4,5}[A-Z]{0,2})/i, // i7-14700K
      /(Ultra\s+[3579]\s+\d{3}[A-Z]{0,2})/i, // Ultra 7 155H
      /(Core\s+[3579]\s+\d{3,4}[A-Z]{0,2})/i, // Core 7 150U
      /\b(\d{4,5}[KFS]{1,2})\b/, // 14700K (alone)
    ];

    for (const reg of patterns) {
      const match = p.title.match(reg);
      if (match) {
        model = match[1] || match[0];
        console.log(`   [Match Rule] ${reg}`);
        break;
      }
    }

    if (!model) {
      // Fallback
      const skuMatch = p.title.match(/\b(\d{3,5}[A-Z]{0,2})\b/);
      if (skuMatch) {
        model = skuMatch[1];
        console.log(`   [Match Fallback] SKU only`);
      }
    }

    if (model) {
      // Standardize
      let processedModel = model.replace(/\s+/g, " ").trim();
      if (/^i[3579]\s+\d/.test(processedModel))
        processedModel = processedModel.replace(" ", "-");

      console.log(`   Extracted Model: "${processedModel}"`);

      // Check Map
      const directMatch = urlMap[processedModel];
      if (directMatch) {
        console.log(`   ✅ Exact Match in URL Map: YES`);
      } else {
        // Fuzzy match
        let found = false;
        for (const key of Object.keys(urlMap)) {
          if (processedModel.includes(key) || key.includes(processedModel)) {
            console.log(`   ✅ Fuzzy Match in URL Map: YES (Key: ${key})`);
            found = true;
            break;
          }
        }
        if (!found) console.log(`   ❌ Match in URL Map: NO`);
      }
    } else {
      console.log(`   ❌ Could not extract ANY model number.`);
    }
  }
}

main().catch(console.error);
