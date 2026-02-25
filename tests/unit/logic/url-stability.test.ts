import { expect, mock, test } from "bun:test";

// Mock next/cache before any other imports
mock.module("next/cache", () => ({
  cacheLife: () => {},
  cacheTag: () => {},
  revalidateTag: () => {},
  unstable_cache: (fn: any) => fn,
}));

import { dbReady } from "../../../src/db";
import { getAllProductSlugs } from "../../../src/lib/product-registry";
import { getPDPRenderData } from "../../../src/lib/server/cached-products";

test(
  "URL Stability: Sitemap URLs should not redirect on PDP",
  async () => {
    await dbReady;

    console.log(
      "🚀 Starting URL Stability & Redundancy Audit (Including Hubs)...",
    );

    // Fetch a sample from the sitemap generator
    const sitemapSample = await getAllProductSlugs(200);
    console.log(`Auditing ${sitemapSample.length} routes...`);

    let failures = 0;
    for (const entry of sitemapSample) {
      const slugFromSitemap = entry.slug;

      // Resolve via PDP logic
      const pdpResult = await getPDPRenderData(slugFromSitemap, "de");

      if (pdpResult && pdpResult.redirect) {
        console.error(`❌ DIVERGENCE DETECTED [ID: ${entry.id}]`);
        console.error(`   Sitemap URL: /p/${slugFromSitemap}`);
        console.error(`   PDP Redirects to: ${pdpResult.redirect}`);
        failures++;
      }
    }

    if (failures > 0) {
      console.error(`Total Divergences: ${failures}`);
    }
    expect(failures).toBe(0);
  },
  { timeout: 60000 },
);
