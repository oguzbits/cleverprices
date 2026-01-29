/**
 * Specifications Table
 *
 * Enhanced with "Icecat" Grouping Logic and Completeness Badges.
 */

"use client";

import { useDebugMode } from "@/hooks/use-debug-mode";
import { Product } from "@/lib/product-registry";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";

interface SpecificationsTableProps {
  product: Product;
}

export function SpecificationsTable({ product }: SpecificationsTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDebug = useDebugMode();

  // Parse Specs - PROPRIETARY LOGIC: Prioritize Official Manufacturer Data
  const { specs, isOfficial } = useMemo(() => {
    // If official specs exist, use them exclusively
    if (product.officialSpecifications) {
      return {
        specs:
          typeof product.officialSpecifications === "string"
            ? JSON.parse(product.officialSpecifications)
            : product.officialSpecifications,
        isOfficial: true,
      };
    }

    // Fallback to legacy/baseline specs
    if (!product.specifications) return { specs: {}, isOfficial: false };
    const parsed =
      typeof product.specifications === "string"
        ? JSON.parse(product.specifications)
        : product.specifications;

    return { specs: parsed || {}, isOfficial: false };
  }, [product.officialSpecifications, product.specifications]);

  // Translation Map
  const keyTranslations: Record<string, string> = {
    "release date": "Gelistet seit",
    model: "Modell",
    color: "Farbe",
    series: "Serie",
    manufacturer: "Hersteller",
    interface: "Schnittstelle",
    "form factor": "Bauform",
    dimensions: "Abmessungen",
    weight: "Gewicht",
    warranty: "Garantie",
    capacity: "Kapazität",
    "read speed": "Lesegeschwindigkeit",
    "write speed": "Schreibgeschwindigkeit",
    technology: "Technik",
    type: "Typ",
    socket: "Sockel",
    cores: "Kerne",
    threads: "Threads",
    "base clock": "Basistakt",
    "boost clock": "Boost-Takt",
    cache: "Cache",
    tdp: "TDP",
    graphics: "Grafik",
    resolution: "Auflösung",
    brightness: "Helligkeit",
    "contrast ratio": "Kontrastverhältnis",
    "response time": "Reaktionszeit",
    "refresh rate": "Bildwiederholfrequenz",
    "panel type": "Panel-Typ",
    "screen size": "Bildschirmdiagonale",
    "aspect ratio": "Seitenverhältnis",
    "display type": "Display-Typ",
    connections: "Anschlüsse",
    hdmi: "HDMI",
    displayport: "DisplayPort",
    curved: "Curved",
    chipset: "Grafikchipsatz",
    "gpu clock": "Chiptakt",
    "gpu boost clock": "Boost-Takt",
    "video memory": "Grafikspeicher",
    "memory type": "Speichertyp",
    "memory clock": "Speichertakt",
    "power consumption": "Stromverbrauch",
    cooling: "Kühlung",
    "memory speed": "Speichertakt",
    "cas latency": "CAS Latenz",
    voltage: "Spannung",
    modules: "Module",
    wattage: "Leistung",
    efficiency: "Effizienz",
    modular: "Modular",
    certification: "Zertifizierung",
    "rotational speed": "Umdrehungsgeschwindigkeit",
    "buffer size": "Cache-Größe",
    "pixel density": "Pixeldichte",
    "display resolution": "Auflösung",
    processor: "Prozessor",
    "chip name": "Chip",
  };

  // Grouping Logic
  const groups: Record<string, { label: string; value: any }[]> = {
    Allgemein: [],
    "Leistung & Hardware": [],
    "Display & Grafik": [],
    "Anschlüsse & Konnektivität": [],
    "Abmessungen & Energie": [],
    Sonstiges: [],
  };

  // 1. Determine variant tokens to exclude (Task: Neutral Specs)
  const variantTokens = new Set<string>();
  if (product.variationAttributes) {
    product.variationAttributes.split(";").forEach((pair) => {
      const value = pair.split(":")[1];
      if (value) {
        value
          .toLowerCase()
          .split(/[^a-z0-9]+/)
          .forEach((t) => {
            if (t.length > 2) variantTokens.add(t);
          });
      }
    });
  }

  // Add Core Specs first
  if (product.brand) releaseToBucket("Allgemein", "Marke", product.brand);
  if (product.condition)
    releaseToBucket(
      "Allgemein",
      "Zustand",
      product.condition === "New" ? "Neu" : product.condition,
    );

  // Distribute bucket specs
  const ignoredKeys = new Set([
    "Method",
    "Empfohlener Kundenpreis",
    "Datenblatt",
  ]);

  Object.entries(specs).forEach(([key, value]) => {
    if (
      !value ||
      value === "null" ||
      value === "undefined" ||
      ignoredKeys.has(key)
    )
      return;

    // --- NEUTRAL SPECS FILTER ---
    // If the value contains variant-specific info (like "256GB" or "Midnight"), skip it
    const valStr = String(value).toLowerCase();
    const hasVariantToken = Array.from(variantTokens).some((t) => {
      // Must be a whole-word match or specific capacity pattern
      const regex = new RegExp(`\\b${t}\\b`, "i");
      return regex.test(valStr);
    });
    if (hasVariantToken) return;

    // Localize Values (simple dictionary for common terms)
    let displayValue = value;
    if (value === "Yes") displayValue = "Ja";
    if (value === "No") displayValue = "Nein";

    const cleanKey = key.replace(/[‡*]/g, "").trim();
    const lowerKey = cleanKey.toLowerCase();
    const label = keyTranslations[lowerKey] || cleanKey;

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
      lowerKey.includes("leistung")
    ) {
      releaseToBucket("Leistung & Hardware", label, displayValue);
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
      // Default bucket if not 'General'
      if (!groups["Allgemein"].find((g) => g.label === label)) {
        releaseToBucket("Sonstiges", label, displayValue);
      }
    }
  });

  function releaseToBucket(bucket: string, label: string, value: any) {
    groups[bucket].push({ label, value });
  }

  // Flatten for display if not expanded (show top 8 mixed)
  const flatList = Object.values(groups).flat();
  const hasData = flatList.length > 0;

  // Data Health Check
  // @ts-ignore
  const isEnriched =
    product.enrichmentStatus === "processed" ||
    product.enrichmentStatus === "optimized" || // New Global Optimization Status
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
              const source = specs.Source || "";
              if (source === "Intel" && specs.Method === "Scraped") {
                return (
                  <div className="flex items-center gap-1.5 rounded-full border border-blue-600 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Intel Verified (Debug)
                  </div>
                );
              }
              if (source.includes("AMD")) {
                return (
                  <div className="flex items-center gap-1.5 rounded-full border border-red-600 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    AMD Verified (Debug)
                  </div>
                );
              }
              if (source.includes("Apple")) {
                return (
                  <div className="flex items-center gap-1.5 rounded-full border border-gray-400 bg-gray-50 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Apple Verified (Debug)
                  </div>
                );
              }
              return (
                <div className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Icecat / Other (Debug)
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

      <div className="w-full border-t border-[#ebebeb]">
        {!isExpanded ? (
          // Collapsed View (Simple List)
          <ul className="m-0 list-none p-0">
            {flatList.slice(0, 8).map((spec, index) => (
              <li
                key={index}
                className={cn(
                  "flex items-center px-[15px] py-[7px] text-[13px] leading-[1.4]",
                  index % 2 === 0 ? "bg-[#f5f5f5]" : "bg-white",
                )}
              >
                <div className="w-[45%] shrink-0 text-[#767676]">
                  {spec.label}
                </div>
                <div className="w-[55%] font-bold text-[#2d2d2d]">
                  {spec.value}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          // Expanded View (Grouped)
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
                        key={index}
                        className={cn(
                          "flex items-start px-[15px] py-[7px] text-[13px] leading-[1.4]",
                          index % 2 === 0 ? "bg-[#f5f5f5]" : "bg-white",
                        )}
                      >
                        <div className="w-[45%] shrink-0 pr-2 wrap-break-word text-[#767676]">
                          {spec.label}
                        </div>
                        <div className="w-[55%] font-medium wrap-break-word text-[#2d2d2d]">
                          {spec.value}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
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
                Alle Details anzeigen ({flatList.length}){" "}
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
