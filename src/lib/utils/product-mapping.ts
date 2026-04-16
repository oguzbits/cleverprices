import { type Price as DbPrice, type Product as DbProduct } from "@/db/schema";
import { parseHistoryBlob } from "../history-compression";
import { type LitePrice, type Product } from "../product-definitions";
import { getFamilyIdentity } from "../product-families";
import { type SiblingConsensus, IDENTITY_CONFIG } from "./product-identity";
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

// Systemic enrichment guards now handle data anomalies at ingestion time.
// Hard-coded runtime repairs removed.

/**
 * mapDbProduct: Pure logic to transform DB records into Product interface.
 * Standardizes slugs and populates history.
 */
export function mapDbProduct(
  p: DbProduct,
  pricesList: LitePrice[] | DbPrice[],
  siblings: any[] = [],
  stripHeavyData: boolean = false,
  consensus?: SiblingConsensus,
): Product {
  const pricesObj: Record<string, number> = {};
  const pricesLastUpdatedObj: Record<string, string> = {};
  const avg90Obj: Record<string, number> = {};
  const listPriceObj: Record<string, number> = {};
  const unitPriceObj: Record<string, number> = {};
  const usedPricesObj: Record<string, number> = {};
  const warehousePricesObj: Record<string, number> = {};
  let historyData: { date: string; price: number }[] = [];

  if (pricesList) {
    pricesList.forEach((pr) => {
      const price = pr.price && pr.price > 0 ? pr.price : null;
      const usedPrice = pr.usedPrice && pr.usedPrice > 0 ? pr.usedPrice : null;
      const warehousePrice =
        "warehousePrice" in pr && pr.warehousePrice && pr.warehousePrice > 0
          ? pr.warehousePrice
          : null;

      if ((price || usedPrice || warehousePrice) && pr.country) {
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
        if (warehousePrice) {
          warehousePricesObj[pr.country] = warehousePrice;
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

  // [PERFORMANCE] Optimization: Two-tier specifications parsing.
  // We only parse the full JSON if we actually need it (non-lite mode).
  // Otherwise, we only extract identity-critical keys.

  let identitySpecs: Record<string, any> = {};
  let parsedSpecs: Record<string, any> = {};
  let parsedOfficialSpecs: Record<string, any> | undefined = undefined;

  if (stripHeavyData) {
    // Lite mode: skip full parsing, only extract identity keys from raw strings
    identitySpecs = {
      ...IDENTITY_CONFIG.getIdentitySpecs(p.specifications),
      ...IDENTITY_CONFIG.getIdentitySpecs(p.officialSpecifications),
    };
  } else {
    // Full mode: parse everything
    try {
      parsedSpecs = p.specifications ? JSON.parse(p.specifications) : {};
    } catch (e) {
      console.error(
        `[Data Error] Failed to parse specifications for ASIN ${p.asin}`,
      );
      parsedSpecs = {};
    }

    try {
      parsedOfficialSpecs = p.officialSpecifications
        ? JSON.parse(p.officialSpecifications)
        : undefined;
    } catch (e) {
      console.error(
        `[Data Error] Failed to parse officialSpecifications for ASIN ${p.asin}`,
      );
      parsedOfficialSpecs = undefined;
    }

    identitySpecs = {
      ...IDENTITY_CONFIG.getIdentitySpecs(parsedSpecs),
      ...IDENTITY_CONFIG.getIdentitySpecs(parsedOfficialSpecs || null),
    };
  }

  // --- TECH DATA REPAIR LAYER ---
  // We use identitySpecs for repairs to ensure slugs are deterministic even in "lite" mode.
  const rawSpecs = stripHeavyData ? identitySpecs : { ...parsedSpecs };

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

      // ANOMALY CHECK: Sometimes Amazon puts the Screen Size (15.6) into the Storage field.
      // If it's a common laptop size but the title says something else (like 512GB), rescue it.
      const commonLaptopSizes = [
        10.1, 11.6, 12.1, 12.5, 13.3, 14, 15.4, 15.6, 17.3,
      ];
      if (commonLaptopSizes.includes(targetCapacityGB)) {
        const titleMatch = (p.title || "").match(
          /\b(\d+)\s?(GB|TB)\s?(SSD|HDD|NVMe|Disk)\b/i,
        );
        if (titleMatch) {
          targetCapacityGB = parseCapacityToGB(titleMatch[1] + titleMatch[2]);
        }
      }
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
        const unit = targetCapacityGB >= 1024 ? "TB" : "GB";
        const val =
          targetCapacityGB >= 1024 ? targetCapacityGB / 1024 : targetCapacityGB;
        rawSpecs["Speicherkapazität"] = `${val} ${unit}`;

        // Also update variation attributes in memory so identity logic is correct
        if (attrStorage) {
          vMap["Storage"] = `${val} ${unit}`;
          p.variationAttributes = Object.entries(vMap)
            .map(([k, v]) => `${k}: ${v}`)
            .join("; ");
        }
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
  const releaseDate =
    rawSpecs["Release Date"] ||
    rawSpecs["Erscheinungsdatum"] ||
    rawSpecs["Markteinführung"] ||
    rawSpecs["Modelljahr"] ||
    rawSpecs["Model Year"];

  // CPU fallback
  if (
    p.category === "cpu" ||
    p.category === "prozessoren" ||
    p.category === "motherboards" ||
    p.category === "mainboards"
  ) {
    if (!socket) {
      const socketMatch = (p.title || "").match(
        /(AM[45]|LGA\s?(\d{4})|sTRX4|sWRX8|Socket\s?[A-Z0-9]+|TR4|FM[12]|LGA\s?115[0156])/i,
      );
      if (socketMatch) socket = socketMatch[0].toUpperCase().replace(/\s+/, "");
    }
    if (!cores && (p.category === "cpu" || p.category === "prozessoren")) {
      const coreMatch = (p.title || "").match(/(\d+)\s?-?\s?(Core|Kerne)/i);
      if (coreMatch) cores = parseInt(coreMatch[1]).toString();
    }
  }

  const item: Product = {
    id: p.id,
    slug: p.slug,
    asin: p.asin,
    title: p.title,
    rawTitle: p.title,
    category: p.category,
    image: p.imageUrl || "",
    imageUrl: p.imageUrl || "",
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
    specifications: rawSpecs, // Kept briefly for identity logic
    officialSpecifications: parsedOfficialSpecs,
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
    warehousePrices: warehousePricesObj,
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : undefined,
    releaseDate,
    specificationsSource: p.specificationsSource,
    enrichmentStatus: p.enrichmentStatus as any,
  };

  // Enforce canonical slug and standardized family title/subtitle using siblings consensus if available
  const {
    slug: canonicalSlug,
    title: familyTitle,
    modelTitle,
    variantSuffix,
    displaySubtitle,
  } = getFamilyIdentity(item, siblings || [], consensus);

  item.slug = canonicalSlug;
  item.title =
    displaySubtitle && !familyTitle.includes(displaySubtitle)
      ? `${familyTitle} ${displaySubtitle}`
      : familyTitle;
  item.subtitle = displaySubtitle;
  item.modelTitle = modelTitle;
  item.variantSuffix = variantSuffix;

  // Identity and titles are set. We strip huge blobs if requested to stay under cache limits.
  if (stripHeavyData) {
    item.specifications = {};
    delete (item as any).officialSpecifications;
    return item; // SKIP calculateProductMetrics for extreme speed in lists
  }

  return calculateProductMetrics(item) as Product;
}
