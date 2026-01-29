import { and, desc, eq, isNotNull, isNull, like, not, or } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { db, products } from "../../src/db";
import { DeviceEnricherBase } from "./device-enricher-base";
import { SmartParser } from "./smart-parser";

class AIEnricher extends DeviceEnricherBase {
  private parser: SmartParser;
  private templates: Record<string, string[]> = {};
  private categoryExamples: Record<string, any> = {};

  constructor() {
    super();
    this.parser = new SmartParser();
    this.loadTemplates();
  }

  private loadTemplates() {
    try {
      const templatePath = path.join(
        process.cwd(),
        "scripts/enrichment/category-templates.json",
      );
      if (fs.existsSync(templatePath)) {
        this.templates = JSON.parse(fs.readFileSync(templatePath, "utf-8"));
        console.log(
          `📋 Loaded ${Object.keys(this.templates).length} category schemas.`,
        );
      }
    } catch (e) {
      console.warn("⚠️ Failed to load category templates:", e);
    }
  }

  async run(limit = 10) {
    const isRerun = process.env.RERUN_AI === "true";
    console.log(
      `🤖 AI Enricher: Initializing... (Mode: ${isRerun ? "RE-ENRICH COMPLETED" : "NEW PENDING"})`,
    );

    const conditions = isRerun
      ? and(
          isNull(products.icecatId), // Critical: Never touch Icecat
          isNotNull(products.officialSpecifications), // Must have specs already
          not(eq(products.officialSpecifications, "{}")), // Not empty
          not(like(products.brand, "%Intel%")), // Preserved High Quality Data
          // Loop Prevention: Explicitly exclude already optimized items
          not(eq(products.enrichmentStatus, "optimized")),
        )
      : and(
          isNull(products.officialSpecifications),
          isNull(products.icecatId),
          or(
            eq(products.enrichmentStatus, "pending"),
            eq(products.enrichmentStatus, "not_found"),
            isNull(products.enrichmentStatus),
          ),
        );

    const targets = await db
      .select()
      .from(products)
      .where(conditions)
      .limit(limit)
      .orderBy(desc(products.id));

    console.log(
      `📋 Found ${targets.length} target products for ${isRerun ? "RE-ENRICHMENT" : "AI enrichment"}.`,
    );
    if (targets.length === 0) return;

    await this.initBrowser();

    // Sliding Window Concurrency: 3 active tasks at all times
    const concurrency = 1;
    const activeTasks: Promise<void>[] = [];
    let completedCount = 0;

    for (const product of targets) {
      if (activeTasks.length >= concurrency) {
        await Promise.race(activeTasks);
      }

      const task = this.enrichProduct(product).finally(() => {
        completedCount++;
        activeTasks.splice(activeTasks.indexOf(task), 1);
      });
      activeTasks.push(task);
    }

    await Promise.all(activeTasks);
    console.log(
      `\n🎉 Enrichment Batch Complete: ${completedCount}/${targets.length} processed.`,
    );

    await this.closeBrowser();
  }

  private async enrichProduct(product: any) {
    const startTime = performance.now();
    try {
      console.log(
        `🔍 Processing: ${idShort(product.title)} (ID: ${product.id})`,
      );

      // 1. Variant Optimization (Siblings)
      let siblingExample = await this.findSiblingExample(product);

      // 2. Pre-process Data
      let rawText = "";
      if (product.keepaFeatures) {
        try {
          const kData = JSON.parse(product.keepaFeatures as string);
          rawText = this.parser.preprocessData(
            product.title,
            kData.description || "",
            kData.features || [],
          );
        } catch (e) {}
      }

      if (!rawText) {
        await db
          .update(products)
          .set({
            enrichmentStatus: "needs_external_data",
            lastEnrichedAt: new Date(),
          })
          .where(eq(products.id, product.id));
        return;
      }

      // 3. Category Gold Standard
      if (!this.categoryExamples[product.category]) {
        await this.loadCategoryExample(product.category);
      }

      const example = siblingExample || this.categoryExamples[product.category];
      const categorySchema = this.templates[product.category] || [];

      // 4. AI Parse (Pass 1 + Pass 2)
      let specs = await this.parser.parseProductPage(
        rawText,
        product.title,
        categorySchema,
        example,
        !!siblingExample,
      );

      // SAFEGUARD: Anti-Regression Check
      if (
        product.officialSpecifications &&
        typeof product.officialSpecifications === "string"
      ) {
        try {
          const existingSpecs = JSON.parse(product.officialSpecifications);
          const existingCount = Object.keys(existingSpecs).length;
          const newCount = specs ? Object.keys(specs).length : 0;

          if (newCount < existingCount) {
            console.warn(
              `🛡️ Safeguard: Skipped ID ${product.id} (Anti-Regression). Existing: ${existingCount} > New: ${newCount} specs.`,
            );
            // Log as "skipped" but effectively distinct from failure
            const duration = ((performance.now() - startTime) / 1000).toFixed(
              1,
            );
            console.log(
              `⏭️ Skipped ID: ${product.id} (⏱️ ${duration}s) - Better data exists`,
            );
            this.logStat(
              product.id,
              product.title,
              duration,
              "SKIPPED_REGRESSION",
            );
            return;
          }
        } catch (e) {
          /* ignore parse error on legacy data */
        }
      }

      if (specs && Object.keys(specs).length > 0) {
        await this.saveProduct(product.id, product.title, specs, startTime);
      } else {
        await this.handleFailure(product.id, product.title, startTime);
      }
    } catch (error: any) {
      console.error(`❌ Error ID: ${product.id}`, error.message);
      await this.handleError(
        product.id,
        product.title,
        startTime,
        error.message,
      );
    }
  }

  private async findSiblingExample(product: any) {
    const conditions = [];
    if (product.parentAsin)
      conditions.push(eq(products.parentAsin, product.parentAsin));
    if (product.gtin) conditions.push(eq(products.gtin, product.gtin));
    if (conditions.length === 0) return undefined;

    const sibling = await db.query.products.findFirst({
      where: and(
        or(...conditions),
        eq(products.category, product.category),
        isNotNull(products.officialSpecifications),
        not(eq(products.officialSpecifications, "{}")),
        not(eq(products.id, product.id)),
      ),
    });

    if (sibling && sibling.officialSpecifications) {
      return {
        title: sibling.title,
        specs:
          typeof sibling.officialSpecifications === "string"
            ? JSON.parse(sibling.officialSpecifications)
            : sibling.officialSpecifications,
      };
    }
    return undefined;
  }

  private async loadCategoryExample(category: string) {
    // QUALITY STRATEGY: Find the "densest" Icecat product for this category
    const candidates = await db.query.products.findMany({
      where: and(
        eq(products.category, category),
        isNotNull(products.officialSpecifications),
        isNotNull(products.icecatId),
        not(eq(products.officialSpecifications, "{}")),
      ),
      columns: { title: true, officialSpecifications: true },
      limit: 10,
    });

    let bestCandidate = null;
    let maxFields = 0;

    for (const c of candidates) {
      try {
        const specs =
          typeof c.officialSpecifications === "string"
            ? JSON.parse(c.officialSpecifications)
            : c.officialSpecifications;

        const count = Object.keys(specs).length;
        if (count > maxFields) {
          maxFields = count;
          bestCandidate = { title: c.title, specs };
        }
      } catch (e) {
        continue;
      }
    }

    // Minimum bar: Ensure the "Gold Standard" has at least 8 fields
    if (bestCandidate && maxFields >= 8) {
      this.categoryExamples[category] = bestCandidate;
      console.log(
        `🎓 Loaded Best Gold Standard for '${category}': "${idShort(
          bestCandidate.title,
        )}" (${maxFields} fields)`,
      );
    } else {
      console.warn(
        `⚠️ No high-quality Gold Standard found for '${category}' (Best: ${maxFields} fields). Skipping reference.`,
      );
      this.categoryExamples[category] = null;
    }
  }

  private async saveProduct(
    id: number | string,
    title: string,
    specs: any,
    startTime: number,
  ) {
    await db
      .update(products)
      .set({
        officialSpecifications: JSON.stringify(specs),
        enrichmentStatus: "optimized", // Mark as fully optimized to prevent re-processing
        specificationsSource: "keepa_ai",
        lastEnrichedAt: new Date(),
      })
      .where(eq(products.id, Number(id)));

    const duration = ((performance.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Finished ID: ${id} (⏱️ ${duration}s)`);
    this.logStat(id, title, duration, "SUCCESS");
  }

  private async handleFailure(
    id: number | string,
    title: string,
    startTime: number,
  ) {
    await db
      .update(products)
      .set({ enrichmentStatus: "ai_failed", lastEnrichedAt: new Date() })
      .where(eq(products.id, Number(id)));
    const duration = ((performance.now() - startTime) / 1000).toFixed(1);
    this.logStat(id, title, duration, "FAILED");
  }

  private async handleError(
    id: number | string,
    title: string,
    startTime: number,
    errorMessage: string = "UNKNOWN_ERROR",
  ) {
    await db
      .update(products)
      .set({ enrichmentStatus: "error", lastEnrichedAt: new Date() })
      .where(eq(products.id, Number(id)));
    const duration = ((performance.now() - startTime) / 1000).toFixed(1);
    this.logStat(id, title, duration, `ERROR: ${errorMessage}`);
  }

  private logStat(id: any, title: string, duration: string, status: string) {
    const logDir = path.join(process.cwd(), "logs");
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const csvLine = `${new Date().toISOString()},${id},"${title.replace(/"/g, '""')}",${duration},${status}\n`;
    fs.appendFileSync(path.join(logDir, "enrichment_performance.csv"), csvLine);
  }
}

function idShort(t: string) {
  return t.length > 40 ? t.substring(0, 37) + "..." : t;
}

import { fileURLToPath } from "url";
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const enricher = new AIEnricher();
  const limit = process.env.BATCH_SIZE ? parseInt(process.env.BATCH_SIZE) : 50;
  enricher.run(limit).catch(console.error);
}
