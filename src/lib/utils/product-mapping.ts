import { type Price as DbPrice, type Product as DbProduct } from "@/db/schema";
import { parseHistoryBlob } from "../history-compression";
import { getFamilyIdentity } from "../product-families";
import { type LitePrice, type Product } from "../product-registry";
import { calculateProductMetrics } from "./products";
import { parseCapacityToGB, parseVariationAttributes } from "./variants";

/**
 * Parse historyJson blob into price history array
 * Format: { "2025-01-15": 4999, "2025-01-16": 5199, ... } (prices in cents)
 */
export function parseHistoryJson(
  historyJson: Buffer | string | null,
): { date: string; price: number }[] {
  const parsed = parseHistoryBlob(historyJson);
  return Object.entries(parsed)
    .map(([date, priceCents]) => ({
      date: new Date(date).toISOString(),
      price: priceCents / 100, // Convert cents to decimal
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * mapDbProduct: Pure logic to transform DB records into Product interface.
 * Standardizes slugs and populates history.
 */
export function mapDbProduct(
  p: DbProduct,
  pricesList: LitePrice[] | DbPrice[],
  siblings: any[] = [],
  stripHeavyData: boolean = false,
): Product {
  const pricesObj: Record<string, number> = {};
  const pricesLastUpdatedObj: Record<string, string> = {};
  const avg90Obj: Record<string, number> = {};
  const listPriceObj: Record<string, number> = {};
  const unitPriceObj: Record<string, number> = {};
  const usedPricesObj: Record<string, number> = {};
  let historyData: { date: string; price: number }[] = [];

  if (pricesList) {
    pricesList.forEach((pr) => {
      const price = pr.price && pr.price > 0 ? pr.price : null;
      const usedPrice = pr.usedPrice && pr.usedPrice > 0 ? pr.usedPrice : null;

      if ((price || usedPrice) && pr.country) {
        if (price) {
          pricesObj[pr.country] = price;
          if (pr.lastUpdated) {
            const ts = Number(pr.lastUpdated);
            const date = new Date(ts < 10000000000 ? ts * 1000 : ts);
            pricesLastUpdatedObj[pr.country] = date.toISOString();
          }
          if (pr.priceAvg90) avg90Obj[pr.country] = pr.priceAvg90;
          if (pr.listPrice) listPriceObj[pr.country] = pr.listPrice;
          if (pr.pricePerUnit) unitPriceObj[pr.country] = pr.pricePerUnit;
        }

        if (usedPrice) {
          usedPricesObj[pr.country] = usedPrice;
        }

        // Parse historyJson from first price record
        if (
          !stripHeavyData &&
          historyData.length === 0 &&
          "historyJson" in pr &&
          pr.historyJson
        ) {
          historyData = parseHistoryJson(pr.historyJson as any);
        }
      }
    });
  }

  // Pre-parse specifications for identity logic (CRITICAL: Needed even if stripHeavyData is true)
  const parsedSpecs = p.specifications ? JSON.parse(p.specifications) : {};
  const parsedOfficialSpecs = p.officialSpecifications
    ? JSON.parse(p.officialSpecifications)
    : undefined;

  // --- TECH DATA REPAIR LAYER ---
  // Fix corrupted/misaligned specifications from the DB
  let rawSpecs = { ...parsedSpecs };
  if (
    p.category === "smartphones" ||
    p.category === "tablets" ||
    p.category === "notebooks"
  ) {
    const vMap = parseVariationAttributes(p.variationAttributes || "");
    const attrStorage =
      vMap["Storage"] || vMap["Speicher"] || vMap["Speicherkapazität"];

    // 1. Repair Storage: Priority 1: variationAttributes, Priority 2: normalizedCapacity
    let targetCapacityGB = 0;
    if (attrStorage) {
      targetCapacityGB = parseCapacityToGB(attrStorage);
    } else if (p.normalizedCapacity && p.normalizedCapacity > 0) {
      targetCapacityGB = p.normalizedCapacity;
    }

    if (targetCapacityGB > 0) {
      const dbStorageVal =
        rawSpecs["Speicherkapazität"] ||
        rawSpecs["Storage"] ||
        rawSpecs["Hard Drive"];
      const dbStorageGB = dbStorageVal
        ? parseCapacityToGB(String(dbStorageVal))
        : 0;

      if (dbStorageGB !== targetCapacityGB) {
        // Correct the spec table to match the actual variation
        const unit = targetCapacityGB >= 1000 ? "TB" : "GB";
        const val =
          targetCapacityGB >= 1000 ? targetCapacityGB / 1000 : targetCapacityGB;
        rawSpecs["Speicherkapazität"] = `${val} ${unit}`;
      }
    }

    // 2. Repair Processor if it contains display info (Corrupted field in some iPads)
    const proc = String(
      rawSpecs["Prozessor"] || rawSpecs["Processor"] || "",
    ).toLowerCase();
    if (
      proc.includes("display") ||
      proc.includes("retina") ||
      proc.includes("screen") ||
      proc.includes("inch")
    ) {
      // Move display info to display field if missing
      if (!rawSpecs["Display"] && !rawSpecs["Bildschirm"]) {
        rawSpecs["Display"] = rawSpecs["Prozessor"];
      }

      // Try to find real processor in title or clear it.
      const procMatch = (p.title || "").match(
        /\b(M[1-9]|A\d+[A-Z]? Bionic|Snapdragon \d[ Gen \d]?|Core i\d|Ryzen \d)\b/i,
      );
      if (procMatch) {
        rawSpecs["Prozessor"] = procMatch[0];
      } else {
        delete rawSpecs["Prozessor"];
        delete rawSpecs["Processor"];
      }
    }
  }

  let socket = rawSpecs.Socket || rawSpecs["Socket-Typ"];
  let cores = rawSpecs.Cores || rawSpecs.Kerne;
  let releaseDate =
    rawSpecs["Release Date"] ||
    rawSpecs["Erscheinungsdatum"] ||
    rawSpecs["Markteinführung"] ||
    rawSpecs["Modelljahr"] ||
    rawSpecs["Model Year"];

  // CPU fallback
  if (p.category === "cpu" || p.category === "motherboards") {
    if (!socket) {
      const socketMatch = (p.title || "").match(
        /(AM[45]|LGA\s?(\d{4})|sTRX4|sWRX8|Socket\s?[A-Z0-9]+|TR4|FM[12]|LGA\s?115[0156])/i,
      );
      if (socketMatch) socket = socketMatch[0].toUpperCase().replace(/\s+/, "");
    }
    if (!cores && p.category === "cpu") {
      const coreMatch = (p.title || "").match(/(\d+)\s?-?\s?(Core|Kerne)/i);
      if (coreMatch) cores = parseInt(coreMatch[1]).toString();
    }
  }

  const item: Product = {
    id: p.id,
    slug: p.slug,
    asin: p.asin,
    title: p.title,
    category: p.category,
    image: p.imageUrl || "",
    affiliateUrl: stripHeavyData
      ? ""
      : `https://www.amazon.de/dp/${p.asin}?tag=cleverprices-21`,

    prices: pricesObj,
    pricesLastUpdated: stripHeavyData ? {} : pricesLastUpdatedObj,
    capacity: p.capacity || 0,
    capacityUnit: (p.capacityUnit as any) || "GB",
    normalizedCapacity: p.normalizedCapacity || 0,
    formFactor: stripHeavyData ? "" : p.formFactor || "",
    technology: p.technology || "",
    socket,
    cores,
    condition:
      p.title.includes("(Generalüberholt)") ||
      p.title.includes("erneuert") ||
      p.title.includes("Renewed")
        ? "Renewed"
        : (p.condition as any) === "Used"
          ? "Used"
          : "New",
    brand: p.brand || "Generic",
    manufacturer: stripHeavyData ? undefined : p.manufacturer || undefined,
    parentAsin: p.parentAsin || undefined,
    variationAttributes: p.variationAttributes || undefined,
    specifications: stripHeavyData ? {} : rawSpecs,
    officialSpecifications: parsedOfficialSpecs, // Passed to identify logic below
    officialTitle: p.officialTitle,
    features: [],
    priceHistory: stripHeavyData ? [] : historyData,
    rating: p.rating || 0,
    reviewCount: p.reviewCount || 0,
    energyLabel: stripHeavyData ? undefined : (p.energyLabel as any),
    salesRank: p.salesRank || undefined,
    monthlySold: p.monthlySold || 0,
    mpn: p.mpn || undefined,
    priceAvg90: avg90Obj,
    listPrice: listPriceObj,
    pricesPerUnit: unitPriceObj,
    usedPrices: usedPricesObj,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    releaseDate,
    specificationsSource: p.specificationsSource,
  };

  // Enforce canonical slug and standardized family title/subtitle using siblings consensus if available
  const {
    slug: canonicalSlug,
    title: familyTitle,
    variantSuffix,
  } = getFamilyIdentity(item, siblings);

  item.slug = canonicalSlug;
  // User SSOT: Title must be the FULL descriptive title (Family + Variant)
  // e.g. "Apple MacBook Air 13 M2" + "256GB Midnight"
  item.title = variantSuffix ? `${familyTitle} ${variantSuffix}` : familyTitle;
  item.subtitle = variantSuffix;

  // Identity and titles are set. We strip huge blobs if requested to stay under cache limits.
  if (stripHeavyData) {
    delete (item as any).officialSpecifications;
  }

  return calculateProductMetrics(item) as Product;
}
