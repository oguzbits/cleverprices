import { and, eq, inArray, isNotNull } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { db } from "../../src/db";
import { products } from "../../src/db/schema";
import { SmartParser } from "./smart-parser";

async function scavengeKeepaData() {
  console.log("🚀 STARTING KEEPA SCAVENGER (Phase 9 - Elite Precision)");

  const parser = new SmartParser();

  const templatePath = path.join(
    process.cwd(),
    "scripts/enrichment/category-templates.json",
  );
  if (!fs.existsSync(templatePath)) {
    console.error(
      "❌ Category templates not found. Run analyze-category-schemas.ts first.",
    );
    return;
  }

  const templates: Record<string, string[]> = JSON.parse(
    fs.readFileSync(templatePath, "utf-8"),
  );
  console.log(
    `📋 Loaded templates for ${Object.keys(templates).length} categories.`,
  );

  const targets = await db
    .select({
      id: products.id,
      title: products.title,
      asin: products.asin,
      category: products.category,
      keepaFeatures: products.keepaFeatures,
      specifications: products.specifications,
    })
    .from(products)
    .where(
      and(
        inArray(products.enrichmentStatus, [
          "not_found",
          "pending",
          "scavenged",
        ]),
        isNotNull(products.keepaFeatures),
      ),
    );

  console.log(`🔍 Found ${targets.length} targets for scavenging.`);

  let totalScavenged = 0;

  for (const target of targets) {
    if (!target.keepaFeatures) continue;

    const catTemplate = templates[target.category];
    if (!catTemplate) continue;

    const metadata = JSON.parse(target.keepaFeatures as string);
    const rawText = [metadata.description, ...(metadata.features || [])].join(
      " | ",
    );

    const currentSpecs = target.specifications
      ? JSON.parse(target.specifications as string)
      : {};

    // Use SmartParser for Deterministic Extraction
    const newSpecs = parser.deterministicExtract(
      target.title,
      rawText,
      catTemplate,
      undefined,
      target.category,
    );

    // Merge only if we found something new or better
    let foundAny = false;
    const finalSpecs = { ...currentSpecs };

    for (const [key, val] of Object.entries(newSpecs)) {
      if (val && val !== "null" && val !== currentSpecs[key]) {
        finalSpecs[key] = val;
        foundAny = true;
      }
    }

    if (foundAny) {
      await db
        .update(products)
        .set({
          specifications: JSON.stringify(finalSpecs),
          enrichmentStatus: "scavenged",
          lastEnrichedAt: new Date(),
        })
        .where(eq(products.id, target.id));

      totalScavenged++;
      if (totalScavenged % 100 === 0) {
        process.stdout.write(`\r   ✅ Scavenged ${totalScavenged} products...`);
      }
    }
  }

  console.log(
    `\n\n🎉 SCAVENGING COMPLETE. Total products enriched: ${totalScavenged}`,
  );
}

scavengeKeepaData().catch(console.error);
