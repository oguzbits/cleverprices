#!/usr/bin/env bun
/**
 * 🗺️ High-Performance Sitemap Validator
 * Optimized for Bun's faster fetch and parallel execution.
 */

const COLORS = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

const SOFT_404_MARKERS = [
  "Kategorie nicht gefunden",
  "Keine Ergebnisse",
  "No results found",
  "404 - Seite nicht gefunden",
];

const DEFAULT_SITEMAP = "http://localhost:3000/sitemap.xml";

// Dynamic configuration via CLI
const args = process.argv.slice(2);
const isFastMode = args.includes("--fast");
const isProd = args.includes("--prod");
const limitArg = args.find((a) => a.startsWith("--limit="))?.split("=")[1];
const limit = limitArg ? parseInt(limitArg) : Infinity;
const concurrencyArg = args
  .find((a) => a.startsWith("--concurrency="))
  ?.split("=")[1];
const CONCURRENCY = concurrencyArg ? parseInt(concurrencyArg) : 100;

async function validate() {
  const targetSitemap = isProd
    ? "https://cleverprices.com/sitemap.xml"
    : args.find((a) => !a.startsWith("--")) || DEFAULT_SITEMAP;

  console.log(
    `${COLORS.cyan}🔍 Starting Audit: ${COLORS.reset}${targetSitemap}`,
  );
  if (isFastMode)
    console.log(
      `${COLORS.magenta}⚡ Fast Mode Active: Skipping Soft-404 content analysis.${COLORS.reset}`,
    );
  console.log(
    `${COLORS.yellow}--------------------------------------------------${COLORS.reset}\n`,
  );

  let urls: string[] = [];

  try {
    if (targetSitemap.endsWith(".xml")) {
      const response = await fetch(targetSitemap);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch sitemap: ${response.status} ${response.statusText}`,
        );
      }
      const xml = await response.text();
      urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    } else {
      // Direct URL(s) mode
      urls = args.filter((a) => !a.startsWith("--"));
      if (urls.length === 0) urls = [targetSitemap];
    }

    // LOCAL TESTING BOOST: If we are testing localhost, but sitemap has production URLs, swap them
    const isLocalhost =
      urls.some((u) => u.includes("localhost")) ||
      targetSitemap.includes("localhost");
    if (isLocalhost) {
      console.log(
        `${COLORS.yellow}🔧 Localhost detected. Swapping production URLs for local testing...${COLORS.reset}`,
      );
      urls = urls.map((url) =>
        url.replace(/https?:\/\/cleverprices\.com/, "http://localhost:3000"),
      );
    }

    if (urls.length === 0) {
      console.log(`${COLORS.red}❌ No URLs found to audit!${COLORS.reset}`);
      return;
    }

    if (limit < urls.length) {
      console.log(
        `${COLORS.yellow}⚠️ Sampling limited to first ${limit} URLs.${COLORS.reset}`,
      );
      urls = urls.slice(0, limit);
    }

    console.log(
      `📡 Auditing ${COLORS.cyan}${urls.length}${COLORS.reset} URLs with concurrency ${CONCURRENCY}...\n`,
    );

    const results = {
      ok: 0,
      redirect: 0,
      notFound: 0,
      serverError: 0,
      soft404: 0,
      mismatch: 0,
      total: urls.length,
    };

    const details: string[] = [];
    let processed = 0;
    const startTime = Date.now();

    // Use a worker pool pattern for maximum throughput
    const queue = [...urls];
    const workers = Array(Math.min(CONCURRENCY, queue.length))
      .fill(null)
      .map(async () => {
        while (queue.length > 0) {
          const url = queue.shift();
          if (!url) break;

          const res = await auditUrl(url, isFastMode);
          processed++;

          if (res.status === 200) {
            if (res.isSoft404) {
              results.soft404++;
              details.push(`${COLORS.yellow}[SOFT 404]${COLORS.reset} ${url}`);
            } else {
              results.ok++;

              // Metadata Consistency Checks
              if (!isFastMode && res.metadata) {
                const { canonical, title, description } = res.metadata;

                // 1. Canonical Match Check
                let normalizedCanonical = canonical;
                if (isLocalhost) {
                  normalizedCanonical = canonical.replace(
                    /https?:\/\/cleverprices\.com/,
                    "http://localhost:3000",
                  );
                }

                if (normalizedCanonical !== url) {
                  results.mismatch++;
                  details.push(
                    `${COLORS.red}[CANONICAL MISMATCH]${COLORS.reset} ${url}\n   Expected: ${url}\n   Found:    ${canonical}`,
                  );
                }

                // 2. Missing Metadata Checks
                if (!title) {
                  details.push(
                    `${COLORS.yellow}[MISSING TITLE]${COLORS.reset} ${url}`,
                  );
                }
                if (!description) {
                  details.push(
                    `${COLORS.yellow}[MISSING DESCRIPTION]${COLORS.reset} ${url}`,
                  );
                }
              }
            }
          } else if (res.status >= 300 && res.status < 400) {
            results.redirect++;
            details.push(
              `${COLORS.yellow}[REDIRECT ${res.status}]${COLORS.reset} ${url} -> ${res.redirectTarget}`,
            );
          } else if (res.status === 404) {
            results.notFound++;
            details.push(`${COLORS.red}[404]${COLORS.reset} ${url}`);
          } else {
            results.serverError++;
            details.push(
              `${COLORS.red}[ERROR ${res.status}]${COLORS.reset} ${url}`,
            );
          }

          // Progress indicator every 10 URLs
          if (processed % 10 === 0 || processed === urls.length) {
            const rps = (processed / ((Date.now() - startTime) / 1000)).toFixed(
              1,
            );
            process.stdout.write(
              `\rProgress: ${processed}/${urls.length} (${Math.round(
                (processed / urls.length) * 100,
              )}%) | ${rps} URLs/sec`,
            );
          }
        }
      });

    await Promise.all(workers);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `\n\n${COLORS.green}✨ Audit complete in ${duration}s${COLORS.reset}\n`,
    );

    if (details.length > 0) {
      console.log("--- Audit Details ---");
      details.forEach((d) => console.log(d));
      console.log("----------------------\n");
    }

    console.log("--- Summary Report ---");
    console.log(`✅ OK (200):      ${results.ok}`);
    console.log(`🔀 Redirects:     ${results.redirect}`);
    console.log(`🚨 Soft 404s:     ${results.soft404}`);
    console.log(`❌ 404 Not Found: ${results.notFound}`);
    console.log(`🔥 Server Errors: ${results.serverError}`);
    console.log(`🔍 Mismatches:    ${results.mismatch}`);
    console.log("-----------------------");
    console.log(`Total URLs:       ${results.total}`);

    process.exit(
      results.notFound > 0 || results.serverError > 0 || results.mismatch > 0
        ? 1
        : 0,
    );
  } catch (error) {
    console.error(`${COLORS.red}💥 Fatal Error:${COLORS.reset}`, error);
    process.exit(1);
  }
}

async function auditUrl(url: string, fast: boolean, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 100 * attempt));

      const res = await fetch(url, {
        method: fast ? "HEAD" : "GET",
        redirect: "manual",
        headers: {
          "User-Agent": "CleverPrices-Sitemap-Audit/2.0",
        },
        signal: AbortSignal.timeout(10000),
      });

      const status = res.status;
      let redirectTarget = "";
      let isSoft404 = false;
      let metadata = {
        canonical: "",
        title: "",
        description: "",
      };

      if (status >= 300 && status < 400) {
        redirectTarget = res.headers.get("location") || "unknown";
      }

      if (!fast && status === 200) {
        const text = await res.text();
        isSoft404 = SOFT_404_MARKERS.some((marker) => text.includes(marker));

        // Extract metadata
        // Robust Extraction
        const canonicalMatch =
          text.match(
            /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
          ) ||
          text.match(
            /<link[^>]+href=["']([^"']+)["'][^>]*rel=["']canonical["']/i,
          );
        const titleMatch = text.match(/<title>([\s\S]*?)<\/title>/i);
        const descriptionMatch =
          text.match(
            /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
          ) ||
          text.match(
            /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i,
          );

        metadata = {
          canonical: canonicalMatch ? canonicalMatch[1] : "",
          title: titleMatch ? titleMatch[1].trim() : "",
          description: descriptionMatch ? descriptionMatch[1] : "",
        };
      }

      return { url, status, redirectTarget, isSoft404, metadata };
    } catch (e) {
      if (attempt === retries - 1) {
        return { url, status: 0, redirectTarget: "", isSoft404: false };
      }
    }
  }
  return { url, status: 0, redirectTarget: "", isSoft404: false };
}

validate();
