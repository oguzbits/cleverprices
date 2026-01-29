import { and, eq, isNotNull, not } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { db, products } from "../../src/db";
import { FIELD_DEFINITIONS } from "./field-definitions";
import { SmartParser } from "./smart-parser";

async function runDryRun() {
  const parser = new SmartParser();
  const dbPath = process.env.DB_PATH || "data/cleverprices.db";
  console.log(`🧪 Starting Pass 1 Dry Run Analysis against: ${dbPath}\n`);

  // 1. Fetch products with high-quality specs
  const targets = await db
    .select()
    .from(products)
    .where(
      and(
        isNotNull(products.officialSpecifications),
        not(eq(products.officialSpecifications, "{}")),
        isNotNull(products.keepaFeatures),
      ),
    )
    .limit(500); // Analysis sample

  console.log(`📋 Analyzing ${targets.length} products...\n`);

  const stats = {
    totalFields: 0,
    capturedFields: 0,
    mismatches: 0,
    exactMatches: 0,
    mismatchLog: [] as any[],
    missLog: [] as any[],
  };

  for (const product of targets) {
    let rawText = "";
    if (product.keepaFeatures) {
      try {
        const kData = JSON.parse(product.keepaFeatures as string);
        rawText = parser.preprocessData(
          product.title,
          kData.description || "",
          kData.features || [],
        );
      } catch (e) {}
    }

    if (!rawText) continue;

    const groundTruth = JSON.parse(product.officialSpecifications as string);
    const fieldsToExtract = Object.keys(groundTruth);
    stats.totalFields += fieldsToExtract.length;

    // Run deterministic extraction only
    const pass1Result = (parser as any).deterministicExtract(
      rawText,
      product.title,
      fieldsToExtract,
    );

    for (const field of fieldsToExtract) {
      const def = FIELD_DEFINITIONS[field];
      const expectedRaw = groundTruth[field]?.toString();
      const actualRaw = pass1Result[field]?.toString();

      if (!actualRaw) {
        stats.missLog.push({
          id: product.id,
          title: product.title,
          category: product.category,
          field,
          expected: expectedRaw,
          text: rawText.slice(0, 200),
        });
        continue;
      }

      const expected = expectedRaw.toLowerCase().trim();
      const actual = actualRaw.toLowerCase().trim();

      stats.capturedFields++;

      // 1. Exact or include match
      let isMatch =
        actual === expected ||
        expected.includes(actual) ||
        actual.includes(expected);

      // 2. Fuzzy normalization (rx9060xt vs rx 9060 xt)
      if (!isMatch) {
        const norm = (s: string) => {
          let n = s.toLowerCase().replace(/[^a-z0-9]/g, "");
          // Remove common noise brands from tech fields
          if (
            def?.type === "enum" ||
            def?.type === "numeric" ||
            field === "GPU" ||
            field === "Prozessor"
          ) {
            n = n.replace(/geforce|nvidia|radeon|amd|intel|core|ryzen/g, "");
          }
          return n;
        };
        if (norm(actual) === norm(expected)) isMatch = true;
      }

      // 3. Boolean categorical match (e.g. "ja" vs "gamepad")
      if (!isMatch && def?.type === "boolean") {
        const negativeWords = ["nein", "no", "n", "false", "off"];
        const isExpectedPositive = !negativeWords.includes(expected);
        const isActualPositive =
          actual === "ja" || actual === "yes" || actual === "true";
        if (isExpectedPositive === isActualPositive) isMatch = true;
      }

      // 4. Numeric epsilon (105 vs 105,0)
      if (!isMatch && def?.type === "numeric") {
        const normNum = (s: string) => parseFloat(s.replace(",", "."));
        if (!isNaN(normNum(actual)) && normNum(actual) === normNum(expected))
          isMatch = true;
      }

      if (isMatch) {
        stats.exactMatches++;
      } else {
        stats.mismatches++;
        stats.mismatchLog.push({
          id: product.id,
          title: product.title,
          field,
          expected,
          actual,
          text: rawText.slice(0, 200),
        });
      }
    }
  }

  // 2. Report Results
  console.log("📊 DRY RUN RESULTS:");
  console.log(`------------------------------`);
  console.log(`Total Products:    ${targets.length}`);
  console.log(`Total Fields:      ${stats.totalFields}`);
  console.log(
    `Captured (Recall): ${stats.capturedFields} (${((stats.capturedFields / stats.totalFields) * 100).toFixed(1)}%)`,
  );
  console.log(
    `Accuracy (Prec):   ${((stats.exactMatches / stats.capturedFields) * 100).toFixed(1)}%`,
  );
  console.log(`Mismatches:        ${stats.mismatches}`);
  console.log(`------------------------------\n`);

  if (stats.mismatchLog.length > 0) {
    console.log("⚠️ TOP MISMATCHES (First 10):");
    stats.mismatchLog.slice(0, 10).forEach((m) => {
      console.log(
        `- [${m.field}] Expected: "${m.expected}", Actual: "${m.actual}" (ID: ${m.id})`,
      );
    });
    console.log("");
  }

  const missFrequency: Record<string, number> = {};
  stats.missLog.forEach((m) => {
    missFrequency[m.field] = (missFrequency[m.field] || 0) + 1;
  });

  const sortedMisses = Object.entries(missFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 15);

  console.log("🔍 TOP MISSING FIELDS (Pass 1 Gaps):");
  sortedMisses.forEach(([field, count]) => {
    console.log(`- ${field}: ${count} misses`);
  });

  // Save detailed logs for further analysis
  const logPath = path.join(
    process.cwd(),
    "scripts/enrichment/dry-run-report.json",
  );
  fs.writeFileSync(logPath, JSON.stringify({ stats, sortedMisses }, null, 2));
  console.log(`\n💾 Detailed report saved to: ${logPath}`);
}

runDryRun().catch(console.error);
