import os from "os";
import { db } from "../../src/db";
import { products } from "../../src/db/schema";
import { allCategories } from "../../src/lib/categories";
import { SITE_URL } from "../../src/lib/site-config";

/**
 * CACHE WARMER SCRIPT
 *
 * This script simulates SSG (Static Site Generation) for the production site.
 * It pings the most important URLs of the site to trigger Next.js 16 Component Caching.
 *
 * Since Next.js 16 with 'cacheComponents: true' saves the Rsc/HTML output
 * once rendered, running this script after a price update ensures that
 * users get instant response from the server on their first visit.
 */

async function warmUrl(url: string) {
  try {
    const start = Date.now();
    const response = await fetch(url, {
      headers: {
        "User-Agent": "CleverPrices/CacheWarmer (NextJS-16-Optimization)",
      },
    });
    const duration = Date.now() - start;

    if (response.ok) {
      console.log(`✅ [${duration}ms] ${url}`);
    } else {
      console.log(`❌ [${response.status}] ${url}`);
    }
  } catch (error) {
    console.error(`💥 Error warming ${url}:`, error);
  }
}

async function main() {
  console.log("🚀 Starting Cache Warmer (Hybrid SSG Mode)");
  console.log(`Target: ${SITE_URL}\n`);

  const urlsToWarm: string[] = [
    SITE_URL,
    `${SITE_URL}/deals`,
    `${SITE_URL}/categories`,
  ];

  // 0. Targeted Warming (via arguments)
  // Bun passes: [bun_bin, script_path, ...args]
  const targetedSlugs = process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith("--"));

  if (targetedSlugs.length > 0) {
    console.log(`🎯 Targeted Warming: ${targetedSlugs.length} slugs...`);
    targetedSlugs.forEach((slug) => {
      urlsToWarm.push(`${SITE_URL}/${slug}`);
      urlsToWarm.push(`${SITE_URL}/p/${slug}`); // Try both if unknown
    });
  } else {
    // 1. Warm all Category Pages (Regular Full Warm)
    console.log("📂 Collecting Categories...");
    Object.values(allCategories)
      .filter((c) => !c.hidden)
      .forEach((cat) => {
        urlsToWarm.push(`${SITE_URL}/${cat.slug}`);
      });

    // 2. Warm Top 500 Products (by Sales Rank / Recency) - SKIPPED IN LITE MODE
    const isLite = process.argv.includes("--lite");

    let topProducts: { slug: string }[] = [];

    if (!isLite) {
      console.log("🏷️ Collecting Top Products...");
      topProducts = await db
        .select({
          slug: products.slug,
        })
        .from(products)
        .orderBy(products.salesRank)
        .limit(500);
    } else {
      console.log("⚡ Lite Mode: Skipping 500 product pages to save time.");
    }

    topProducts.forEach((p) => {
      urlsToWarm.push(`${SITE_URL}/p/${p.slug}`);
    });

    // 3. Warm Category Hubs
    urlsToWarm.push(`${SITE_URL}/pc-komponenten`);
    urlsToWarm.push(`${SITE_URL}/computer`);
    urlsToWarm.push(`${SITE_URL}/telekommunikation`);
  }

  // Remove duplicates
  const uniqueUrls = Array.from(new Set(urlsToWarm));

  console.log(`🔥 Warming ${uniqueUrls.length} high-priority URLs...\n`);

  // Batch requests to avoid overloading the server/database
  const BATCH_SIZE = targetedSlugs.length > 0 ? 5 : 2; // Speed up targeted warming
  const BATCH_DELAY_MS = targetedSlugs.length > 0 ? 100 : 500;

  for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
    // Check Server Health before batch
    const load1 = os.loadavg()[0];
    const cpus = os.cpus().length;
    const LOAD_THRESHOLD = cpus * 0.95; // Slightly more aggressive than the worker since this is optimization

    if (load1 > LOAD_THRESHOLD) {
      console.log(
        `🛰️ Server Load High (${load1.toFixed(2)} / ${cpus} CPUs). Warmer is pausing for 10s to prioritize real traffic...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 10000));
      i -= BATCH_SIZE; // Retrying same batch
      continue;
    }

    const batch = uniqueUrls.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((url) => warmUrl(url)));

    if (i + BATCH_SIZE < uniqueUrls.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  console.log(
    "\n✨ Cache warming complete! Your site is now optimized for SSG-level speeds.",
  );
}

main().catch(console.error);
