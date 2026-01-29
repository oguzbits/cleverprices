import { type Price as DbPrice, type Product as DbProduct } from "@/db/schema";
import { parseHistoryBlob } from "../history-compression";
import { getFamilyIdentity } from "../product-families";
import { type LitePrice, type Product } from "../product-registry";
import { calculateProductMetrics } from "./products";

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
  _historyList: any[] = [], // Deprecated
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

  // Extract core specifications for filtering before stripping
  const rawSpecs = p.specifications ? JSON.parse(p.specifications) : {};
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
    officialSpecifications:
      !stripHeavyData && p.officialSpecifications
        ? JSON.parse(p.officialSpecifications)
        : undefined,
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
  };

  // Enforce canonical slug
  const { slug: canonicalSlug } = getFamilyIdentity(item);
  item.slug = canonicalSlug;

  return calculateProductMetrics(item) as Product;
}
