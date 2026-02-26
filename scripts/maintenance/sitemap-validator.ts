#!/usr/bin/env bun
/**
 * 🗺️ Sitemap Validator
 * Crawls sitemap.xml to verify status codes, redirects, and soft 404s.
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

const DEFAULT_SITEMAP = "https://cleverprices.com/sitemap.xml";
const CONCURRENCY = 10;

async function validate() {
  const targetSitemap = process.argv[2] || DEFAULT_SITEMAP;

  console.log(
    `${COLORS.cyan}🔍 Starting Sitemap Validation: ${COLORS.reset}${targetSitemap}`,
  );
  console.log(
    `${COLORS.yellow}--------------------------------------------------${COLORS.reset}\n`,
  );

  try {
    const response = await fetch(targetSitemap);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch sitemap: ${response.status} ${response.statusText}`,
      );
    }

    const xml = await response.text();
    // Simple regex to extract <loc> contents
    const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

    if (urls.length === 0) {
      console.log(`${COLORS.red}❌ No URLs found in sitemap!${COLORS.reset}`);
      return;
    }

    console.log(
      `📡 Found ${COLORS.cyan}${urls.length}${COLORS.reset} URLs. Auditing with concurrency ${CONCURRENCY}...\n`,
    );

    const results = {
      ok: 0,
      redirect: 0,
      notFound: 0,
      serverError: 0,
      soft404: 0,
      total: urls.length,
    };

    const details: string[] = [];

    // Process in chunks
    for (let i = 0; i < urls.length; i += CONCURRENCY) {
      const chunk = urls.slice(i, i + CONCURRENCY);
      const promises = chunk.map((url) => auditUrl(url));
      const chunkResults = await Promise.all(promises);

      for (const res of chunkResults) {
        if (res.status === 200) {
          if (res.isSoft404) {
            results.soft404++;
            details.push(
              `${COLORS.magenta}[SOFT 404]${COLORS.reset} ${res.url}`,
            );
          } else {
            results.ok++;
          }
        } else if (res.status >= 300 && res.status < 400) {
          results.redirect++;
          details.push(
            `${COLORS.yellow}[REDIRECT ${res.status}]${COLORS.reset} ${res.url} -> ${res.redirectTarget}`,
          );
        } else if (res.status === 404) {
          results.notFound++;
          details.push(`${COLORS.red}[404]${COLORS.reset} ${res.url}`);
        } else {
          results.serverError++;
          details.push(
            `${COLORS.red}[ERROR ${res.status}]${COLORS.reset} ${res.url}`,
          );
        }

        // Real-time progress
        const processed =
          results.ok +
          results.redirect +
          results.notFound +
          results.serverError +
          results.soft404;
        process.stdout.write(
          `\rProgress: ${processed}/${results.total} (${Math.round((processed / results.total) * 100)}%)`,
        );
      }
    }

    console.log(
      "\n\n" + `${COLORS.yellow}--- Audit Details ---${COLORS.reset}`,
    );
    details.forEach((d) => console.log(d));

    console.log("\n" + `${COLORS.cyan}--- Summary Report ---${COLORS.reset}`);
    console.log(
      `✅ OK (200):      ${COLORS.green}${results.ok}${COLORS.reset}`,
    );
    console.log(
      `🔀 Redirects:     ${COLORS.yellow}${results.redirect}${COLORS.reset}`,
    );
    console.log(
      `🚨 Soft 404s:     ${COLORS.magenta}${results.soft404}${COLORS.reset}`,
    );
    console.log(
      `❌ 404 Not Found: ${COLORS.red}${results.notFound}${COLORS.reset}`,
    );
    console.log(
      `🔥 Server Errors: ${COLORS.red}${results.serverError}${COLORS.reset}`,
    );
    console.log(`-----------------------`);
    console.log(`Total URLs:       ${results.total}`);

    if (
      results.notFound > 0 ||
      results.soft404 > 0 ||
      results.serverError > 0
    ) {
      console.log(
        `\n${COLORS.red}🚨 Critical issues found! Please review the details above.${COLORS.reset}\n`,
      );
      process.exit(1);
    } else {
      console.log(
        `\n${COLORS.green}✨ All URLs in sitemap are healthy!${COLORS.reset}\n`,
      );
    }
  } catch (err: any) {
    console.error(
      `${COLORS.red}Error executing audit: ${err.message}${COLORS.reset}`,
    );
    process.exit(1);
  }
}

async function auditUrl(url: string) {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "manual", // Don't follow automatically so we can see 301s
      headers: {
        "User-Agent": "CleverPrices-Sitemap-Audit/1.0",
      },
    });

    const status = res.status;
    let redirectTarget = "";
    let isSoft404 = false;

    if (status >= 300 && status < 400) {
      redirectTarget = res.headers.get("location") || "unknown";
    }

    if (status === 200) {
      const text = await res.text();
      isSoft404 = SOFT_404_MARKERS.some((marker) => text.includes(marker));
    }

    return { url, status, redirectTarget, isSoft404 };
  } catch (e) {
    return { url, status: 0, redirectTarget: "", isSoft404: false };
  }
}

validate();
