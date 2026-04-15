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
  
  const isPurge = process.argv.includes("--purge");
  const adminSecret = process.env.ADMIN_SECRET;

  if (isPurge) {
    console.log("🧹 Purge requested. Calling Admin Purge API...");
    try {
      const purgeUrl = `${SITE_URL}/api/admin/purge-cache`;
      const response = await fetch(purgeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminSecret || ""}`
        },
        body: JSON.stringify({})
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Cache purged:`, data.purgedTags);
      } else {
        const errData = await response.json().catch(() => ({}));
        console.error(`❌ Purge failed [${response.status}]:`, errData.error || "Unknown error");
      }
    } catch (e) {
      console.error("💥 Error calling purge API:", e);
    }
  }

  console.log(`Target: ${SITE_URL}\n`);

  const urlsToWarm: string[] = [
    SITE_URL,
    `${SITE_URL}/`,
    `${SITE_URL}/deals`,
    `${SITE_URL}/categories`,
  ];

  const isFull = process.argv.includes("--full");
  const isLite = process.argv.includes("--lite") && !isFull;

  // 0. targeted Warming (via arguments)
  const targetedSlugs = process.argv
    .slice(2)
    .filter((arg) => !arg.startsWith("--"));

  if (targetedSlugs.length > 0) {
    console.log(`🎯 Targeted Warming: ${targetedSlugs.length} slugs...`);
    targetedSlugs.forEach((slug) => {
      // Clean slug: remove leading / if present
      const cleanSlug = slug.startsWith("/") ? slug.substring(1) : slug;
      urlsToWarm.push(`${SITE_URL}/${cleanSlug}`);
      if (!cleanSlug.startsWith("p/")) {
        urlsToWarm.push(`${SITE_URL}/p/${cleanSlug}`);
      }
    });
  } else if (isFull) {
    // 1. Full Sitemap Warming
    console.log("🗺️  Full Mode: Crawling sitemap.xml for all URLs...");
    try {
      const sitemapResp = await fetch(`${SITE_URL}/sitemap.xml`);
      if (sitemapResp.ok) {
        const xml = await sitemapResp.text();
        const locs = xml.match(/<loc>(.*?)<\/loc>/g) || [];
        locs.forEach((loc) => {
          const url = loc.replace(/<\/?loc>/g, "");
          urlsToWarm.push(url);
        });
        console.log(`✅ Discovered ${locs.length} URLs from sitemap.`);
      }
    } catch (e) {
      console.error(
        "❌ Failed to fetch sitemap, falling back to basic warming.",
      );
    }
  } else {
    // 2. Standard Category/Product Warming
    console.log("📂 Collecting Categories...");
    Object.values(allCategories)
      .filter((c) => !c.hidden)
      .forEach((cat) => {
        urlsToWarm.push(`${SITE_URL}/${cat.slug}`);
      });

    // Warm Top 500 Products (if not lite)
    let topProducts: { slug: string; id: number }[] = [];

    if (!isLite) {
      console.log("🏷️ Collecting Top Products...");
      topProducts = await db
        .select({
          slug: products.slug,
          id: products.id,
        })
        .from(products)
        .orderBy(products.salesRank)
        .limit(500);
    } else {
      console.log("⚡ Lite Mode: Skipping 500 product pages.");
    }

    topProducts.forEach((p) => {
      const prefix = p.id ? `${200000000 + p.id}_-` : "";
      const slug = p.slug.includes("_-") ? p.slug : `${prefix}${p.slug}`;
      urlsToWarm.push(`${SITE_URL}/p/${slug}`);
    });

    // Warm Category Hubs
    urlsToWarm.push(`${SITE_URL}/pc-komponenten`);
    urlsToWarm.push(`${SITE_URL}/computer`);
    urlsToWarm.push(`${SITE_URL}/telekommunikation`);
    urlsToWarm.push(`${SITE_URL}/hifi-audio`);
  }

  // Remove duplicates and normalize URLs
  const uniqueUrls = Array.from(
    new Set(urlsToWarm.map((u) => u.trim())),
  ).filter((u) => u.startsWith("http"));

  console.log(`🔥 Warming ${uniqueUrls.length} high-priority URLs...\n`);

  // Batch requests to avoid overloading the server/database
  const BATCH_SIZE = targetedSlugs.length > 0 ? 10 : 4;
  const BATCH_DELAY_MS = targetedSlugs.length > 0 ? 50 : 200;

  for (let i = 0; i < uniqueUrls.length; i += BATCH_SIZE) {
    // Check Server Health before batch
    const load1 = os.loadavg()[0];
    const cpus = os.cpus().length;
    const LOAD_THRESHOLD = cpus * 1.5; // Allow more load during warming since it's the goal

    if (load1 > LOAD_THRESHOLD) {
      console.log(
        `🛰️ Server Load High (${load1.toFixed(2)} / ${cpus} CPUs). Pausing for 5s...`,
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
      i -= BATCH_SIZE;
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
