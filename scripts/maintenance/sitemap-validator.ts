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

// LOCAL SAFETY: Default to 2 concurrency for local to prevent OOM/Next.js freeze
const CONCURRENCY = concurrencyArg ? parseInt(concurrencyArg) : isProd ? 3 : 2;

const delayArg = args.find((a) => a.startsWith("--delay="))?.split("=")[1];
// DEFAULT DELAY: 200ms for prod, 100ms for local to be gentler on the server
const DEFAULT_DELAY = isProd ? 200 : 100;
const DELAY = delayArg ? parseInt(delayArg) : DEFAULT_DELAY;
const TIMEOUT = isProd ? 15000 : 30000;

/**
 * ⌛ WAIT FOR SERVER
 * Ensures the target port is actually listening before we flood it with 1800+ requests.
 */
async function waitForServer(url: string, maxWaitMs = 120000) {
  const start = Date.now();
  console.log(`${COLORS.cyan}⌛ Waiting for server at ${url} to be ready...${COLORS.reset}`);
  
  while (Date.now() - start < maxWaitMs) {
    try {
      const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status < 500) {
        console.log(`${COLORS.green}✅ Server is UP!${COLORS.reset}\n`);
        return true;
      }
    } catch (e) {
      // Just wait
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`Timeout waiting for server at ${url} after ${maxWaitMs}ms`);
}

export async function validateSitemap() {
  const targetSitemap = isProd
    ? "https://cleverprices.com/sitemap.xml"
    : args.find((a) => !a.startsWith("--")) || DEFAULT_SITEMAP;

  const isLocalhost = targetSitemap.includes("localhost") || args.some(a => a.includes("localhost")) || !isProd;
  const siteUrl = isLocalhost ? "http://localhost:3000" : "https://cleverprices.com";

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

  // 1. Wait for server (critical for usability when running build/start)
  if (isLocalhost) {
    try {
      await waitForServer(siteUrl);
    } catch (e: any) {
      console.error(`${COLORS.red}❌ ${e.message}${COLORS.reset}`);
      process.exit(1);
    }
  }

  let urls: string[] = [];

  try {
    if (targetSitemap.endsWith(".xml")) {
      console.log(`${COLORS.cyan}📡 Loading sitemap...${COLORS.reset} (Dev servers can take up to 2m)`);
      const response = await fetch(targetSitemap, {
        signal: AbortSignal.timeout(120000), // 120s for initial sitemap generation
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch sitemap: ${response.status} ${response.statusText}`,
        );
      }
      const xml = await response.text();
      urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    }
 else {
      // Direct URL(s) mode
      urls = args.filter((a) => !a.startsWith("--"));
      if (urls.length === 0) urls = [targetSitemap];
    }

    // ⏯️ RESUME LOGIC
    const resumeIndexArg = args.find(a => a.startsWith("--resume="))?.split("=")[1];
    const resumeIndex = resumeIndexArg ? parseInt(resumeIndexArg) : 0;

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
      timeout: 0,
      soft404: 0,
      mismatch: 0,
      total: urls.length,
    };

    const details: string[] = [];
    let processed = 0;
    const startTime = Date.now();

    const totalUrlsCount = urls.length;
    const initialQueue = urls.slice(resumeIndex);
    const queue = [...initialQueue];
    let currentIndex = 0;
    let consecutiveErrors = 0;

    console.log(
      `📡 Auditing ${COLORS.cyan}${queue.length}${COLORS.reset} URLs (from index ${resumeIndex}) with concurrency ${CONCURRENCY}...\n`
    );

    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async (_, i) => {
      while (true) {
        const urlIndex = currentIndex++;
        if (urlIndex >= queue.length) break;

        const url = queue[urlIndex];
        const displayIndex = resumeIndex + urlIndex + 1;

        // Long-running watch to detect hangs
        const taskTimer = setTimeout(() => {
          console.log(`\n${COLORS.yellow}⚠️ Still waiting for URL ${displayIndex}/${totalUrlsCount}: ${url}${COLORS.reset}`);
        }, 30000); // 30s before warning

        // Safety: Stop if too many consecutive connection errors
        if (consecutiveErrors > 10) {
          console.error(`\n${COLORS.red}🛑 SEVERE: 10+ consecutive connection errors. Is the server down? Terminating.${COLORS.reset}`);
          process.exit(1);
        }

        try {
          const res = await auditUrl(url, isFastMode);
          clearTimeout(taskTimer);

          if (DELAY > 0) await new Promise(r => setTimeout(r, DELAY));
          processed++;

          if (res.status === 200) {
            consecutiveErrors = 0;
            if (res.isSoft404) {
              results.soft404++;
              details.push(`${COLORS.yellow}[SOFT 404]${COLORS.reset} ${url}`);
            } else {
              results.ok++;
              if (!isFastMode && res.metadata) {
                if (res.metadata.canonical) {
                  try {
                    const canonicalPath = decodeURIComponent(new URL(res.metadata.canonical).pathname).trim().replace(/\/$/, "");
                    const urlPath = decodeURIComponent(new URL(url).pathname).trim().replace(/\/$/, "");
                    if (canonicalPath !== urlPath) {
                      results.mismatch++;
                      // 🔍 DETAILED BYTE-BY-BYTE DIAGNOSIS
                      const diagnosis = `      Byte Comparison:
      Exp: ${Array.from(urlPath).map(c => c.charCodeAt(0)).join(" ")}
      Got: ${Array.from(canonicalPath).map(c => c.charCodeAt(0)).join(" ")}`;
                      
                      details.push(
                        `${COLORS.red}[CANONICAL MISMATCH]${COLORS.reset} ${url}\n` +
                        `   Index:         ${displayIndex}\n` +
                        `   Expected Path: ${JSON.stringify(urlPath)}\n` +
                        `   Found Path:    ${JSON.stringify(canonicalPath)}\n` +
                        `   Raw Canonical: ${JSON.stringify(res.metadata.canonical)}\n` +
                        diagnosis
                      );
                    }

                  } catch (e) {
                    results.mismatch++;
                    details.push(`${COLORS.red}[CANONICAL PARSE ERROR]${COLORS.reset} ${url}`);
                  }
                }
              }
            }
          } else if (res.status >= 300 && res.status < 400) {
            results.redirect++;
            details.push(`${COLORS.yellow}[REDIRECT ${res.status}]${COLORS.reset} ${url}`);
          } else if (res.status === 404) {
            results.notFound++;
            details.push(`${COLORS.red}[404]${COLORS.reset} ${url}`);
          } else {
            results.serverError++;
            consecutiveErrors++;
            details.push(`${COLORS.red}[ERROR ${res.status}]${COLORS.reset} ${url}`);
          }
        } catch (err: any) {
          clearTimeout(taskTimer);
          results.timeout++;
          consecutiveErrors++;
          details.push(`${COLORS.magenta}[RUNTIME ERROR]${COLORS.reset} ${url}: ${err?.message || "Unknown error"}`);
        }


        // Periodic Progress Reporting
        if (processed % 10 === 0 || processed === queue.length) {
          const rps = (processed / ((Date.now() - startTime) / 1000)).toFixed(1);
          const percent = Math.round((processed / queue.length) * 100);
          process.stdout.write(
            `\rProgress: ${processed}/${queue.length} (${percent}%) | ${rps} URLs/sec | Current: ${displayIndex}/${urls.length}`
          );
        }
      }
    });

    // 🚀 WATCHDOG: Force exit if no progress for 5 minutes (Hub pages can be slow on local)
    let lastProcessed = 0;
    const watchdog = setInterval(() => {
      if (processed === lastProcessed && processed < queue.length) {
        console.error(`\n${COLORS.red}🛑 WATCHDOG: No progress for 300s! Stalling at ${processed}/${queue.length}. Terminating.${COLORS.reset}`);
        process.exit(1);
      }
      lastProcessed = processed;
    }, 300000);

    await Promise.all(workers);
    clearInterval(watchdog);

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
    console.log(`⏳ Timeouts:      ${results.timeout}`);
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
      if (attempt > 0) {
        // Longer delay for retries to allow server to breathe
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }

      const res = await fetch(url, {
        method: fast ? "HEAD" : "GET",
        redirect: "manual",
        headers: {
          "User-Agent": "CleverPrices-Sitemap-Audit/2.0",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          // Hint to Next.js to not postpone content if possible
          "x-next-audit": "true",
        },
        signal: AbortSignal.timeout(fast ? 5000 : TIMEOUT), // Use configured timeout
      });

      const status = res.status;

      if ((status === 404 || status >= 500) && attempt < retries - 1) {
        if (status >= 500) {
          console.log(
            `${COLORS.red}[${status}]${COLORS.reset} Server Error. Retrying...`,
          );
        } else if (status === 404) {
          console.log(
            `${COLORS.yellow}[404]${COLORS.reset} Suspected transient mismatch. Retrying...`,
          );
        }
        // Exponential backoff
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
        continue;
      }

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
          description: descriptionMatch
            ? (descriptionMatch[1] || "").substring(0, 100)
            : "",
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

validateSitemap();
