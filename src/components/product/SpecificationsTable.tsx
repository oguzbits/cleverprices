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

export interface SpecificationsTableProps {
  product: Product;
  selectedCondition?: "new" | "used" | "renewed";
  isHubMode?: boolean;
}

export function SpecificationsTable({
  product,
  selectedCondition,
  isHubMode,
}: SpecificationsTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDebug = useDebugMode();

  // Parse Specs - PROPRIETARY LOGIC: Prioritize Official Manufacturer Data
  const { specs, isOfficial, source } = useMemo(() => {
    // If official specs exist, use them exclusively
    let rawSpecs: Record<string, any> = {};
    let sourceLabel = "None";
    let isOfficialData = false;

    if (product.officialSpecifications) {
      const s =
        typeof product.officialSpecifications === "string"
          ? JSON.parse(product.officialSpecifications)
          : product.officialSpecifications;
      rawSpecs = s;
      isOfficialData = true;
      sourceLabel = product.specificationsSource || s.Source || "Unknown";
    } else if (product.specifications) {
      const parsed =
        typeof product.specifications === "string"
          ? JSON.parse(product.specifications)
          : product.specifications;
      rawSpecs = parsed || {};
      sourceLabel = "Legacy";
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

    const filtered: Record<string, any> = {};

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

      // 2. VARIANT DUPLICATION FILTERING (Standard View)
      // If this attribute is controlled by the Variant Selector, hide it from the static table
      // to avoid conflicts (e.g. "Spec says Black, Variant is White")
      if (!isHubMode) {
        if (isColorVariant && (lowerK === "color" || lowerK === "farbe"))
          return;
        // Only hide Storage/RAM if it's strictly just the capacity number.
        // Sometimes specs have "Storage Type: NVMe" which we want to keep.
        if (
          isStorageVariant &&
          (lowerK === "storage" ||
            lowerK === "kapazität" ||
            lowerK === "interner speicher")
        )
          return;
        if (isRamVariant && (lowerK === "ram" || lowerK === "arbeitsspeicher"))
          return;
      }

      filtered[k] = v;
    });

    return { specs: filtered, isOfficial: isOfficialData, source: sourceLabel };
  }, [
    product.officialSpecifications,
    product.specifications,
    isHubMode,
    product.variationAttributes,
  ]);

  // Translation Map
  const keyTranslations: Record<string, string> = {
    // ... existing translations ...
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
    description: "Beschreibung",
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
      try {
        displayValue = JSON.stringify(value);
      } catch (e) {
        displayValue = String(value);
      }
    }
    if (displayValue === "Yes") displayValue = "Ja";
    if (displayValue === "No") displayValue = "Nein";
    const cleanKey = key.replace(/[‡*]/g, "").trim();
    const lowerKey = cleanKey.toLowerCase();
    let label = keyTranslations[lowerKey] || cleanKey;

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

  function releaseToBucket(bucket: string, label: string, value: any) {
    groups[bucket].push({ label, value });
  }

  const flatList = Object.values(groups).flat();
  const hasData = flatList.length > 0;

  // @ts-ignore
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
              // Priority 1: Intel Source
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
