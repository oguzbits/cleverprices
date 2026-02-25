/**
 * User-agent detection utility for CleverPrices.
 * Used for "Workload Tiering" - deprioritizing crawlers to reserve
 * DB resources for real human users.
 */

const BOT_KEYWORDS = [
  "googlebot",
  "bingbot",
  "slurp",
  "duckduckbot",
  "baiduspider",
  "yandexbot",
  "sogou",
  "exabot",
  "facebot",
  "ia_archiver",
  "ahrefsbot",
  "mj12bot",
  "semrushbot",
  "dotbot",
  "rogerbot",
  "screaming frog",
  "headless",
  "puppeteer",
  "playwright",
];

/**
 * Checks if a user agent string belongs to a known bot or crawler.
 */
export function isBot(userAgent: string | null): boolean {
  if (!userAgent) return false;

  const ua = userAgent.toLowerCase();

  // Quick check for bot/crawler/spider keywords
  if (ua.includes("bot") || ua.includes("spider") || ua.includes("crawler")) {
    return true;
  }

  // Exhaustive keyword check
  return BOT_KEYWORDS.some((keyword) => ua.includes(keyword));
}
