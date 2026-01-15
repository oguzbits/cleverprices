/**
 * Specifications Table
 *
 * Replicates the Idealo-style product datasheet table with zebra striping,
 * group headers, and a collapsible "Show all" functionality.
 */

"use client";

import { Product } from "@/lib/product-registry";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SpecificationsTableProps {
  product: Product;
}

export function SpecificationsTable({ product }: SpecificationsTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Generate core specs
  const coreSpecs = [
    { label: "Marke", value: product.brand },
    { label: "Bauform", value: product.formFactor },
    { label: "Technik", value: product.technology },
    {
      label: "Speicherkapazität",
      value: product.capacity
        ? `${product.capacity} ${product.capacityUnit}`
        : undefined,
    },
    {
      label: "Zustand",
      value: product.condition === "New" ? "Neu" : product.condition,
    },
  ].filter((s) => s.value);

  // 2. Map additional specs from the specifications bucket
  const bucketSpecs = product.specifications
    ? Object.entries(product.specifications).map(([key, value]) => {
        let displayValue = String(value);
        let displayLabel = key;

        // Translation mapping for common keys
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
        };

        const lowerKey = key.toLowerCase();
        if (keyTranslations[lowerKey]) {
          displayLabel = keyTranslations[lowerKey];
        }

        // Format dates if the key suggests it's a date and value is valid
        const dateKeys = [
          "gelistet seit",
          "erscheinungs",
          "release date",
          "veröffentlichung",
        ];
        if (
          dateKeys.some((dk) => lowerKey.includes(dk)) &&
          displayValue &&
          displayValue !== "null"
        ) {
          const date = new Date(displayValue);
          if (!isNaN(date.getTime())) {
            displayValue = date.toLocaleString("de-DE", {
              month: "long",
              year: "numeric",
            });
          }
        }

        return {
          label: displayLabel,
          value: displayValue,
        };
      })
    : [];

  // 3. Combine and deduplicate
  const allSpecs = [...coreSpecs];
  bucketSpecs.forEach((b) => {
    if (
      !allSpecs.some((c) => c.label.toLowerCase() === b.label.toLowerCase()) &&
      b.value &&
      b.value !== "undefined" &&
      b.value !== "null"
    ) {
      allSpecs.push(b);
    }
  });

  // 4. Grouping logic (Simplified for Idealo look)
  // We'll show the first 6 items, then group the rest or hide them
  const initialCount = 8;
  const displayedSpecs = isExpanded
    ? allSpecs
    : allSpecs.slice(0, initialCount);
  const hasMore = allSpecs.length > initialCount;

  return (
    <div className="w-full">
      <div className="w-full border-t border-[#ebebeb]">
        <ul className="m-0 list-none p-0">
          {displayedSpecs.map((spec, index) => (
            <li
              key={spec.label}
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
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-end">
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
