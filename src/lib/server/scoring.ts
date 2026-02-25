import { Product } from "@/lib/product-definitions";

interface ProductScore {
  popularityScore: number;
  revenue: number;
  prestigeMultiplier: number;
  isPrestige: boolean;
  scoreBreakdown: {
    commercial: number;
    popularity: number;
    trust: number;
    prestige: number;
    freshness: number;
    penalty: number;
  };
}

const PRESTIGE_BRANDS = [
  "apple",
  "sony",
  "bose",
  "samsung",
  "sennheiser",
  "jbl",
  "nvidia",
  "asus",
  "msi",
  "lg",
  "microsoft",
  "google",
  "panasonic",
  "philips",
  "hp",
  "dell",
  "logitech",
  "western digital",
  "sandisk",
  "nintendo",
  "canon",
  "nikon",
  "playstation",
  "xbox",
  "lego",
  "beats",
  "teufel",
  "razer",
  "alienware",
  "bowers & wilkins",
  "sonos",
  "marshall",
  "bang & olufsen",
  "leica",
  "ringconn",
  "meta",
  "oculus",
];

const ESTABLISHED_BRANDS = [
  "xiaomi",
  "huawei",
  "lenovo",
  "acer",
  "gigabyte",
  "corsair",
  "kingston",
  "crucial",
  "lexar",
  "seagate",
  "intel",
  "amd",
  "tp-link",
  "garmin",
  "motorola",
  "nothing",
  "anker",
  "belkin",
  "wd",
  "pny",
  "patriot memory",
  "cherry",
  "be quiet!",
  "aoc",
  "toshiba",
  "iiyama",
  "benq",
  "dji",
  "oneplus",
  "vivo",
  "honor",
  "redmagic",
  "soundcore",
  "linsoul",
  "oppo",
  "cmf by nothing",
  "nothing phone",
  "motorola mobility",
  "elgato",
  "evga",
  "amazon",
  "xfx",
  "asrock",
  "zotac",
  "sapphire",
  "nzxt",
  "sabrent",
  "transcend",
  "verbatim",
  "brother",
  "palit",
  "gainward",
  "powercolor",
  "inno3d",
  "fractal design",
  "noctua",
  "thermalright",
  "silverstone",
  "lian li",
  "ekwb",
  "arctic",
  "deepcool",
  "seasonic",
  "fsp",
  "super flower",
  "synology",
  "qnap",
  "asustor",
  "ubiquiti",
  "mikrotik",
  "netgear",
  "linksys",
  "d-link",
  "avm",
  "fritz!",
];

const BUDGET_BRANDS = [
  "hisense",
  "tcl",
  "medion",
  "teclast",
  "chuwi",
  "blackview",
  "doogee",
  "oukitel",
  "ulefone",
  "umidigi",
  "alcatel",
  "cubot",
  "jumper",
  "jodabook",
  "acemagic",
  "ruzava",
  "pryloxen",
  "jlab",
  "notodd",
  "morostron",
  "fsjun",
  "baolubao",
  "iowodo",
  "btootos",
  "jumper laptop",
  "fookis",
  "generic",
  "unknown",
  "rulefiss",
  "poudi",
  "niuto",
  "llano",
  "kuura",
  "yowhick",
  "ordtop",
  "poounur",
  "intenso",
  "fanxiang",
  "kingspec",
  "timetec",
  "fikwot",
  "ssk",
  "integral",
  "netac",
  "movespeed",
  "pny",
  "patriot",
  "silicon power",
  "teamgroup",
  "adata",
  "hikvision",
  "dahua",
  "ezviz",
  "imou",
  "reolink",
  "annke",
  "zosi",
  "ebuyer",
  "scan",
  "overclockers",
  "caseking",
  "mindfactory",
  "alternate",
  "conrad",
  "otto",
  "ebay",
  "back market",
];

const CURRENT_YEAR = new Date().getFullYear();

const PRESTIGE_BRANDS_SET = new Set(PRESTIGE_BRANDS);
const ESTABLISHED_BRANDS_SET = new Set(ESTABLISHED_BRANDS);
const BUDGET_BRANDS_SET = new Set(BUDGET_BRANDS);

/**
 * Advanced Metric-Driven Scoring Logic.
 *
 * Replaces fragile keyword-based sorting with logarithmic scaling of commercial
 * and trust signals to ensure high-quality items float to the top naturally.
 */
export function calculateDesirabilityScore(
  p: Product,
  price: number,
  title: string,
  context: "category" | "landing" = "category",
): ProductScore {
  const brand = (p.brand || "").toLowerCase();
  const monthlySold = p.monthlySold || 0;
  const reviewCount = p.reviewCount || 0;
  const rating = p.rating || 0;
  const salesRank = p.salesRank || 0;
  const titleLower = title.toLowerCase();

  // --- 1. BRAND AUTHORITY ---
  const isPrestige = PRESTIGE_BRANDS_SET.has(brand);
  const isEstablished = ESTABLISHED_BRANDS_SET.has(brand);
  const isBudget = BUDGET_BRANDS_SET.has(brand);
  const isNoName =
    !isPrestige &&
    !isEstablished &&
    !isBudget &&
    brand !== "generic" &&
    brand !== "unknown" &&
    brand !== "";

  // Brand Power Weight (1.0 to 10.0)
  const brandMultiplier = isPrestige
    ? context === "landing"
      ? 8.0
      : 4.0
    : isEstablished
      ? 1.5
      : 1.0;

  // --- 2. COMMERCIAL VALUE (Revenue x Velocity) ---
  // Use log scaling for price and volume to avoid cheap/expensive bias
  // Formula: log10(price) * log10(monthlySold + 1)
  const priceSignal = Math.log10(Math.max(1, price));
  const volumeSignal = Math.log10(monthlySold + 1);
  const commercialScore = priceSignal * volumeSignal * 5000;

  // --- 3. POPULARITY (Sales Rank Inverse Log) ---
  // High rank = Small number. Lower rank = Higher score.
  // 1 -> 1000, 1000 -> 500, 10000 -> 100, etc.
  let popularityScoreMetric = 0;
  if (salesRank > 0) {
    popularityScoreMetric = Math.max(0, 6 - Math.log10(salesRank)) * 500;
  }

  // --- 4. TRUST & QUALITY (Bayesian-lite) ---
  // We want high ratings AND high volume.
  // Rating 4.8 with 5 reviews < Rating 4.5 with 1000 reviews.
  const reviewSignal = Math.log10(reviewCount + 1);
  const trustScore = rating * reviewSignal * 100;

  // --- 5. FRESHNESS (Minimal keyword boost for latest generation) ---
  let freshnessScore = 0;
  if (titleLower.includes(String(CURRENT_YEAR))) freshnessScore = 1000;
  // Tech specific gen boost (still needed as database might lag on ranks for brand new items)
  if (
    titleLower.includes("iphone 16") ||
    titleLower.includes("s24") ||
    titleLower.includes("m4") ||
    titleLower.includes("rtx 40")
  ) {
    freshnessScore += 5000;
  }

  // --- 6. PENALTIES ---
  let penaltyScore = 0;
  // Condition Penalty
  const isSecondHand =
    p.condition === "Used" ||
    p.condition === "Renewed" ||
    titleLower.includes("generalüberholt") ||
    titleLower.includes("renewed");
  if (isSecondHand) penaltyScore -= 5000;

  // Brand Penalty (Aggressive on hub pages to ensure premium feel)
  if (isBudget) penaltyScore -= context === "landing" ? 30000 : 5000;
  if (isNoName && price < 200)
    penaltyScore -= context === "landing" ? 20000 : 10000;
  if (isNoName && price >= 200)
    penaltyScore -= context === "landing" ? 10000 : 0;

  // --- COMPOSITE CALCULATION ---
  const totalScore =
    commercialScore * brandMultiplier +
    popularityScoreMetric * brandMultiplier +
    trustScore +
    freshnessScore +
    penaltyScore;

  return {
    popularityScore: totalScore,
    revenue: commercialScore, // Simplified for metadata
    prestigeMultiplier: brandMultiplier,
    isPrestige,
    scoreBreakdown: {
      commercial: commercialScore,
      popularity: popularityScoreMetric,
      trust: trustScore,
      prestige: brandMultiplier,
      freshness: freshnessScore,
      penalty: penaltyScore,
    },
  };
}
