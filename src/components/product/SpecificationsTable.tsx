/**
 * Specifications Table
 *
 * Enhanced with "Icecat" Grouping Logic and Completeness Badges.
 */

"use client";

import { useDebugMode } from "@/hooks/use-debug-mode";
import { translateSpecKey } from "@/lib/constants/spec-translations";
import { Product } from "@/lib/product-definitions";
import { cn } from "@/lib/utils";
import { getProductIdentity } from "@/lib/utils/product-identity";
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface SpecificationsTableProps {
  product: Product;
  selectedCondition?: "new" | "used" | "renewed";
  isHubMode?: boolean;
}

const parseLegacySpecs = (
  standardSpecs: string,
  specificationsSource?: string,
) => {
  try {
    return {
      rawSpecs: JSON.parse(standardSpecs) || {},
      sourceLabel: specificationsSource || "Legacy",
    };
  } catch (e) {
    console.warn("Failed to parse specifications string", e);
    return { rawSpecs: {}, sourceLabel: specificationsSource || "Legacy" };
  }
};

function safeStringify(value: unknown): string {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// Replaced by translateSpecKey function

export function SpecificationsTable({
  product,
  selectedCondition,
  isHubMode,
}: SpecificationsTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDebug = useDebugMode();

  // Parse Specs - Use the REPAIRED specs from product-mapping.ts
  // The mapping logic already handles storage repair, so we should use those values
  let rawSpecs: Record<string, unknown> = {};
  let sourceLabel = "None";
  let isOfficialData = false;

  // Priority 1: Use official specifications if available (Icecat/Clean data)
  // Priority 2: Use the repaired specifications object
  const officialSpecs = product.officialSpecifications;
  const standardSpecs = product.specifications;

  if (officialSpecs && typeof officialSpecs === "object") {
    rawSpecs = officialSpecs;
    sourceLabel = product.specificationsSource || "Official";
    isOfficialData = true;
  } else if (standardSpecs && typeof standardSpecs === "object") {
    rawSpecs = standardSpecs;
    sourceLabel = product.specificationsSource || "Repaired";
    // Check if this came from official sources
    isOfficialData = !!product.officialSpecifications;
  } else if (standardSpecs && typeof standardSpecs === "string") {
    // Fallback: parse if it's a string (shouldn't happen with proper mapping)
    const parsed = parseLegacySpecs(
      standardSpecs,
      product.specificationsSource || undefined,
    );
    rawSpecs = parsed.rawSpecs;
    sourceLabel = parsed.sourceLabel;
  } else if (product.enrichmentStatus === "untrusted_source") {
    sourceLabel = "Untrusted";
    rawSpecs = {}; // Wipe polluted data from UI
  }

  // LIST OF ATTRIBUTES TO ALWAYS HIDE IF THEY ARE VARIANTS
  // (e.g. if we have a Color selector, don't show Color in specs table)
  const variantKeys = (product.variationAttributes || "").toLowerCase();
  const isColorVariant =
    variantKeys.includes("color") || variantKeys.includes("farbe");
  const isStorageVariant =
    variantKeys.includes("storage") ||
    variantKeys.includes("kapazität") ||
    variantKeys.includes("speicher");
  const isRamVariant =
    variantKeys.includes("ram") ||
    variantKeys.includes("arbeitsspeicher") ||
    variantKeys.includes("memory");

  const filtered: Record<string, unknown> = {};

  // HUB MODE FILTERING LIST
  const hubUnwanted = [
    "color",
    "farbe",
    "mpn",
    "ean",
    "herstellernummer",
    "teilenummer",
    "part number",
    "part-number",
    "artikelnummer",
    "sku",
    "kapazität",
    "storage",
    "speicher",
    "interner speicher",
    "ram",
    "memory",
    "arbeitsspeicher",
    "konnektivität",
    "connectivity",
    "mobilfunk",
    "neu ab",
    "gebraucht ab",
    "preis",
    "größe", // Size usually varies
    "size",
  ];

  Object.entries(rawSpecs).forEach(([k, v]) => {
    const lowerK = k.toLowerCase();

    // 1. HUB MODE: Aggressive Filtering
    if (isHubMode) {
      if (hubUnwanted.some((u) => lowerK.includes(u))) return;
    }

    // 2. VARIANT DUPLICATION FILTERING
    // In Hub Mode: Hide variant attributes (color, storage, RAM) since they're shown in variant selectors
    // In Standard View: Keep them! They're part of the product's specs and should be displayed.
    // The repair logic in product-mapping.ts ensures they show the correct values.
    if (isHubMode) {
      // Only filter in hub mode where we have variant selectors
      if (isColorVariant && (lowerK === "color" || lowerK === "farbe")) return;
      if (
        isStorageVariant &&
        (lowerK === "storage" ||
          lowerK === "kapazität" ||
          lowerK === "speicherkapazität" ||
          lowerK === "interner speicher")
      )
        return;
      if (isRamVariant && (lowerK === "ram" || lowerK === "arbeitsspeicher"))
        return;
    }

    filtered[k] = v;
  });

  const { specs, isOfficial, source } = {
    specs: filtered,
    isOfficial: isOfficialData,
    source: sourceLabel,
  };

  // Groups and items distribution logic
  const groups: Record<string, { label: string; value: unknown }[]> = {
    Allgemein: [],
    "Leistung & Hardware": [],
    "Display & Grafik": [],
    "Anschlüsse & Konnektivität": [],
    "Abmessungen & Energie": [],
    Sonstiges: [],
  };

  const releaseToBucket = (bucket: string, label: string, value: unknown) => {
    groups[bucket].push({ label, value });
  };

  // Add Core Specs first
  if (product.brand) releaseToBucket("Allgemein", "Marke", product.brand);

  // DYNAMIC CONDITION: Show only if not Hub Mode, or show generic
  if (!isHubMode) {
    const conditionLabel = selectedCondition
      ? selectedCondition === "new"
        ? "Neu"
        : selectedCondition === "renewed"
          ? "Generalüberholt (Wie Neu)"
          : "Gebraucht"
      : product.condition === "New"
        ? "Neu"
        : product.condition;
    releaseToBucket("Allgemein", "Zustand", conditionLabel);
  }

  // Distribute bucket specs
  const ignoredKeys = new Set([
    "Method",
    "Empfohlener Kundenpreis",
    "Datenblatt",
    "Source",
  ]);

  Object.entries(specs).forEach(([key, value]) => {
    if (
      !value ||
      value === "null" ||
      value === "undefined" ||
      ignoredKeys.has(key)
    )
      return;

    // Localize Values
    let displayValue = value;
    if (typeof value === "object") {
      displayValue = safeStringify(value);
    }
    if (displayValue === "Yes") displayValue = "Ja";
    if (displayValue === "No") displayValue = "Nein";
    const cleanKey = key.replace(/[‡*]/g, "").trim();
    const lowerKey = cleanKey.toLowerCase();
    const label = translateSpecKey(cleanKey);

    // DATA CLEANUP: If the key is "Modell" and the value is truncated (e.g. "Pixel 9" instead of "Pixel 9a"),
    // or if it's missing the brand, we can use the cleaned identity to improve the UI.
    if (lowerKey === "model" || lowerKey === "modell") {
      const identity = getProductIdentity(product);
      displayValue = identity.fullModel;
    }

    if (
      lowerKey.includes("processor") ||
      lowerKey.includes("cpu") ||
      lowerKey.includes("ram") ||
      lowerKey.includes("memory") ||
      lowerKey.includes("speed") ||
      lowerKey.includes("clock") ||
      lowerKey.includes("prozessor") ||
      lowerKey.includes("speicher") ||
      lowerKey.includes("takt") ||
      lowerKey.includes("leistung") ||
      lowerKey.includes("read") ||
      lowerKey.includes("write") ||
      lowerKey.includes("lese") ||
      lowerKey.includes("schreib") ||
      lowerKey.includes("geschwindigkeit")
    ) {
      if (
        lowerKey.includes("operating") ||
        lowerKey.includes("betriebssystem")
      ) {
        // Exception: OS should be in Allgemein
        releaseToBucket("Allgemein", "Betriebssystem", displayValue);
      } else {
        releaseToBucket("Leistung & Hardware", label, displayValue);
      }
    } else if (
      lowerKey.includes("operating") ||
      lowerKey.includes("system") || // Careful, might catch 'system bus'
      lowerKey.includes("software") ||
      lowerKey.includes("betriebssystem")
    ) {
      releaseToBucket("Allgemein", "Betriebssystem", displayValue);
    } else if (
      lowerKey.includes("display") ||
      lowerKey.includes("screen") ||
      lowerKey.includes("graphics") ||
      lowerKey.includes("gpu") ||
      lowerKey.includes("resolution") ||
      lowerKey.includes("panel") ||
      lowerKey.includes("density") ||
      lowerKey.includes("brightness") ||
      lowerKey.includes("nits") ||
      lowerKey.includes("size") ||
      lowerKey.includes("grafik") ||
      lowerKey.includes("auflösung") ||
      lowerKey.includes("bildschirm") ||
      lowerKey.includes("monitor") ||
      lowerKey.includes("zoll")
    ) {
      releaseToBucket("Display & Grafik", label, displayValue);
    } else if (
      lowerKey.includes("wifi") ||
      lowerKey.includes("bluetooth") ||
      lowerKey.includes("usb") ||
      lowerKey.includes("hdmi") ||
      lowerKey.includes("connection") ||
      lowerKey.includes("interface") ||
      lowerKey.includes("wlan") ||
      lowerKey.includes("anschluss") ||
      lowerKey.includes("schnittstelle") ||
      lowerKey.includes("konnektivität")
    ) {
      releaseToBucket("Anschlüsse & Konnektivität", label, displayValue);
    } else if (
      lowerKey.includes("weight") ||
      lowerKey.includes("dimension") ||
      lowerKey.includes("height") ||
      lowerKey.includes("width") ||
      lowerKey.includes("depth") ||
      lowerKey.includes("power") ||
      lowerKey.includes("battery") ||
      lowerKey.includes("voltage") ||
      lowerKey.includes("gewicht") ||
      lowerKey.includes("abmessung") ||
      lowerKey.includes("breite") ||
      lowerKey.includes("höhe") ||
      lowerKey.includes("tiefe") ||
      lowerKey.includes("energie") ||
      lowerKey.includes("strom") ||
      lowerKey.includes("verbrauch") ||
      lowerKey.includes("akku") ||
      lowerKey.includes("batterie")
    ) {
      releaseToBucket("Abmessungen & Energie", label, displayValue);
    } else {
      if (!groups["Allgemein"].find((g) => g.label === label)) {
        releaseToBucket("Sonstiges", label, displayValue);
      }
    }
  });

  const flatList = Object.values(groups).flat();
  const hasData = flatList.length > 0;

  const isEnriched =
    product.enrichmentStatus === "processed" ||
    product.enrichmentStatus === "optimized" ||
    flatList.length > 15;
  const completeness = Math.min(100, (flatList.length / 20) * 100);

  if (!hasData) return null;

  return (
    <div className="mt-8 w-full">
      {/* Header with Health Badge */}
      <div className="mb-4 flex items-center justify-between px-[15px]">
        <h3 className="text-lg font-bold text-[#2d2d2d]">Technische Daten</h3>
        {isDebug &&
          (isOfficial ? (
            // DEBUG MODE: Show granular source info
            (() => {
              // Priority 0: Untrusted / Blocked
              if (source === "Untrusted") {
                return (
                  <div className="flex items-center gap-1.5 rounded-full border border-red-600 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Untrusted Source (Blocked)
                  </div>
                );
              }
              if (source === "Intel" && specs.Method === "Scraped") {
                return (
                  <div className="flex items-center gap-1.5 rounded-full border border-blue-600 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Intel Verified (Debug)
                  </div>
                );
              }
              // Priority 2: AMD Source
              if (source.includes("AMD")) {
                return (
                  <div className="flex items-center gap-1.5 rounded-full border border-red-600 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    AMD Verified (Debug)
                  </div>
                );
              }
              // Priority 3: Apple Source
              if (source.toLowerCase().includes("apple")) {
                return (
                  <div className="flex items-center gap-1.5 rounded-full border border-gray-400 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Apple Verified (Debug)
                  </div>
                );
              }
              // Priority 4: eBay Source (New!)
              if (source.toLowerCase().includes("ebay") || source === "eBay") {
                return (
                  <div className="flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    eBay Verified (Debug)
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {source} / Other (Debug)
                </div>
              );
            })()
          ) : isEnriched ? (
            <div className="flex items-center gap-1.5 rounded-full border border-green-100 bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
              <CheckCircle className="h-3.5 w-3.5" />
              Verifiziert (Debug)
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-full border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" />
              Basis-Daten ({Math.round(completeness)}%) (Debug)
            </div>
          ))}
      </div>

      <div className="relative w-full border-t border-[#ebebeb]">
        <div
          className={cn(
            "overflow-hidden transition-all duration-500 ease-in-out",
            !isExpanded && flatList.length > 8
              ? "max-h-[360px]"
              : "max-h-[5000px]",
          )}
        >
          <div className="space-y-6 pt-4 pb-4">
            {Object.entries(groups).map(([groupName, items]) => {
              if (items.length === 0) return null;
              return (
                <div
                  key={groupName}
                  className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
                >
                  <h4 className="mb-2 px-[15px] text-sm font-bold text-gray-900">
                    {groupName}
                  </h4>
                  <ul className="m-0 list-none p-0">
                    {items.map((spec, index) => (
                      <li
                        key={spec.label}
                        className={cn(
                          "flex items-start px-[15px] py-[7px] text-[13px] leading-[1.4]",
                          index % 2 === 0 ? "bg-[#f5f5f5]" : "bg-white",
                        )}
                      >
                        <div className="w-[45%] shrink-0 pr-2 wrap-break-word text-[#767676]">
                          {spec.label}
                        </div>
                        <div className="w-[55%] font-medium wrap-break-word text-[#2d2d2d]">
                          {String(spec.value)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gradient Mask */}
        {!isExpanded && hasData && flatList.length > 8 && (
          <div className="pointer-events-none absolute bottom-0 left-0 h-[120px] w-full bg-linear-to-t from-white via-white/80 to-transparent" />
        )}
      </div>

      {flatList.length > 8 && (
        <div className="mt-2 flex justify-end">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 rounded-[2px] border border-[#0066cc] bg-white px-4 py-2 text-[13px] font-bold text-[#0066cc] transition-colors hover:bg-[#f0f7ff]"
          >
            {isExpanded ? (
              <>
                Weniger Details anzeigen <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Alle Details anzeigen <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
