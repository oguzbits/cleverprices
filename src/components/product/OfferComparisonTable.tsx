/**
 * Offer Comparison Table
 *
 * Displays all price offers from different sources (Amazon, eBay, Newegg, etc.)
 */

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ProductOffer, DataSourceId } from "@/lib/data-sources";
import { cn } from "@/lib/utils";
import { ExternalLink, Truck, Shield, Star, Check } from "lucide-react";
import Image from "next/image";

interface OfferComparisonTableProps {
  offers: ProductOffer[];
  formatCurrency: (value: number) => string;
}

// Source configuration for display
const SOURCE_CONFIG: Record<
  DataSourceId,
  { name: string; logo?: string; color: string }
> = {
  amazon: {
    name: "Amazon",
    logo: "/logos/amazon.svg",
    color: "bg-[#FF9900]/10",
  },
  "amazon-paapi": {
    name: "Amazon",
    logo: "/logos/amazon.svg",
    color: "bg-[#FF9900]/10",
  },
  keepa: {
    name: "Amazon (via Keepa)",
    logo: "/logos/amazon.svg",
    color: "bg-[#FF9900]/10",
  },
  ebay: {
    name: "eBay",
    logo: "/logos/ebay.svg",
    color: "bg-[#E53238]/10",
  },
  newegg: {
    name: "Newegg",
    logo: "/logos/newegg.svg",
    color: "bg-[#F7931E]/10",
  },
  bhphoto: {
    name: "B&H Photo",
    logo: "/logos/bhphoto.svg",
    color: "bg-[#0066CC]/10",
  },
  walmart: {
    name: "Walmart",
    logo: "/logos/walmart.svg",
    color: "bg-[#0071CE]/10",
  },
  static: {
    name: "Amazon",
    logo: "/logos/amazon.svg",
    color: "bg-[#FF9900]/10",
  },
};

// Condition display
const CONDITION_CONFIG = {
  new: {
    label: "New",
    className:
      "bg-emerald-100/50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  renewed: {
    label: "Renewed",
    className: "bg-secondary text-secondary-foreground",
  },
  refurbished: {
    label: "Refurbished",
    className: "bg-secondary text-secondary-foreground",
  },
  used: {
    label: "Used",
    className:
      "bg-amber-100/50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300",
  },
};

export function OfferComparisonTable({
  offers,
  formatCurrency,
}: OfferComparisonTableProps) {
  // Sort offers by price (lowest first)
  const sortedOffers = [...offers].sort((a, b) => a.price - b.price);

  if (sortedOffers.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">
          No offers currently available. Check back later!
        </p>
      </Card>
    );
  }

  return (
    <div className="divide-y divide-zinc-200">
      {sortedOffers.map((offer, index) => {
        const sourceConfig =
          SOURCE_CONFIG[offer.source] || SOURCE_CONFIG.static;
        const conditionConfig =
          CONDITION_CONFIG[offer.condition] || CONDITION_CONFIG.new;
        const isBestPrice = index === 0;

        return (
          <div
            key={`${offer.source}-${offer.condition}-${index}`}
            className={cn(
              "group relative flex flex-col items-center gap-4 p-5 transition-all hover:bg-zinc-50/50 sm:flex-row",
              isBestPrice && "bg-orange-50/20",
            )}
          >
            {/* Merchant Branding Area */}
            <div className="flex w-full shrink-0 items-center justify-between gap-4 sm:w-auto sm:min-w-[180px] sm:justify-start">
              <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded-sm border border-zinc-100 bg-white p-2.5 shadow-sm">
                {sourceConfig.logo ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={sourceConfig.logo}
                      alt={sourceConfig.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
                    {sourceConfig.name}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end sm:hidden">
                <p className="text-lg leading-tight font-black text-zinc-900">
                  {formatCurrency(offer.price)}
                </p>
                <p className="text-[10px] font-bold text-zinc-400 uppercase">
                  inkl. Versand
                </p>
              </div>
            </div>

            {/* Price & Offer Detail Area */}
            <div className="hidden flex-1 flex-col items-center gap-4 sm:flex sm:flex-row">
              <div className="flex flex-1 flex-col">
                <div className="mb-0.5 flex items-center gap-2">
                  <h4 className="text-[13px] leading-tight font-bold text-zinc-800 transition-colors group-hover:text-[#f97316]">
                    {sourceConfig.name}{" "}
                    {offer.seller &&
                      offer.seller !== "Amazon" &&
                      `– ${offer.seller}`}
                  </h4>
                  {isBestPrice && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[9px] leading-none font-black tracking-widest text-blue-700 uppercase">
                      Bester Preis
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-[11px] text-zinc-500">
                  {offer.freeShipping ? (
                    <span className="flex items-center gap-1 font-bold text-zinc-400">
                      <Truck className="h-3 w-3" /> Gratis Versand
                    </span>
                  ) : (
                    <span>+ Versand</span>
                  )}
                  <span className="flex items-center gap-1 font-bold tracking-tighter text-emerald-600 uppercase">
                    <Check className="h-3 w-3 stroke-3" /> Auf Lager
                  </span>
                </div>
              </div>

              {/* Price Block */}
              <div className="flex min-w-[120px] flex-col items-end">
                <p className="text-xl leading-tight font-black text-zinc-900">
                  {formatCurrency(offer.price)}
                </p>
                {offer.listPrice && offer.listPrice > offer.price && (
                  <p className="text-[11px] font-medium text-zinc-400 line-through decoration-zinc-300">
                    {formatCurrency(offer.listPrice)}
                  </p>
                )}
              </div>
            </div>

            {/* Action Area */}
            <div className="flex w-full min-w-[150px] items-center justify-between gap-4 sm:w-auto sm:justify-end">
              {/* Merchant Rating Placeholder */}
              <div className="flex flex-col items-start sm:items-end">
                <div className="mb-0.5 flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className="h-2.5 w-2.5 fill-[#ff6000] text-[#ff6000]"
                    />
                  ))}
                </div>
                <span className="text-[10px] font-bold text-zinc-400">
                  Shop Rating
                </span>
              </div>

              <a
                href={offer.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 no-underline sm:flex-none"
              >
                <button
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-sm px-6 py-2.5 text-[13px] font-black tracking-wide uppercase transition-all active:scale-[0.98] sm:w-auto",
                    isBestPrice
                      ? "bg-[#65a30d] text-white hover:bg-[#4d7c0f]" // Professional green for CTA
                      : "bg-[#f97316] text-white hover:bg-[#ea580c]", // Orange theme
                  )}
                >
                  Zum Shop
                  <ExternalLink className="h-3.5 w-3.5 stroke-3" />
                </button>
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
