import { db } from "../../src/db";
import { products } from "../../src/db/schema";
import { allCategories } from "../../src/lib/categories";
import { SITE_URL } from "../../src/lib/site-config";

/**
 * CACHE WARMER SCRIPT
 *
 * This script simulates SSG (Static Site Generation) for the Vercel Free Plan.
 * It pings the most important URLs of the site to trigger Next.js 16 Component Caching.
 *
 * Since Next.js 16 with 'cacheComponents: true' saves the Rsc/HTML output
 * once rendered, running this script after a price update ensures that
 * users get SSG-level speeds (instant response from the Edge) on their first visit.
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

  // 1. Warm all Category Pages
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

  console.log(`🔥 Warming ${urlsToWarm.length} high-priority URLs...\n`);

  // Batch requests to avoid overloading the server/database
  // Using a larger batch for production warming
  const BATCH_SIZE = 10;
  for (let i = 0; i < urlsToWarm.length; i += BATCH_SIZE) {
    const batch = urlsToWarm.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((url) => warmUrl(url)));
  }

  console.log(
    "\n✨ Cache warming complete! Your site is now optimized for SSG-level speeds.",
  );
}

main().catch(console.error);
