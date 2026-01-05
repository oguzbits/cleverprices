/**
 * Offer Comparison Table
 *
 * Displays all price offers from different sources (Amazon, eBay, Newegg, etc.)
 * Similar to idealo.de's price comparison list.
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
    color: "bg-[#FF9900]/10 hover:bg-[#FF9900]/20",
  },
  "amazon-paapi": {
    name: "Amazon",
    logo: "/logos/amazon.svg",
    color: "bg-[#FF9900]/10 hover:bg-[#FF9900]/20",
  },
  keepa: {
    name: "Amazon (via Keepa)",
    logo: "/logos/amazon.svg",
    color: "bg-[#FF9900]/10 hover:bg-[#FF9900]/20",
  },
  ebay: {
    name: "eBay",
    logo: "/logos/ebay.svg",
    color: "bg-[#E53238]/10 hover:bg-[#E53238]/20",
  },
  newegg: {
    name: "Newegg",
    logo: "/logos/newegg.svg",
    color: "bg-[#F7931E]/10 hover:bg-[#F7931E]/20",
  },
  bhphoto: {
    name: "B&H Photo",
    logo: "/logos/bhphoto.svg",
    color: "bg-[#0066CC]/10 hover:bg-[#0066CC]/20",
  },
  walmart: {
    name: "Walmart",
    logo: "/logos/walmart.svg",
    color: "bg-[#0071CE]/10 hover:bg-[#0071CE]/20",
  },
  static: {
    name: "Amazon",
    logo: "/logos/amazon.svg",
    color: "bg-[#FF9900]/10 hover:bg-[#FF9900]/20",
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
    <div className="space-y-3">
      {sortedOffers.map((offer, index) => {
        const sourceConfig =
          SOURCE_CONFIG[offer.source] || SOURCE_CONFIG.static;
        const conditionConfig =
          CONDITION_CONFIG[offer.condition] || CONDITION_CONFIG.new;
        const isBestPrice = index === 0;

        return (
          <Card
            key={`${offer.source}-${offer.condition}-${index}`}
            className={cn(
              "group relative overflow-hidden transition-all",
              sourceConfig.color,
              isBestPrice && "ring-2 ring-emerald-500/50",
            )}
          >
            <div className="flex items-center gap-4 p-4">
              {/* Source Logo */}
              <div className="bg-background flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border p-2">
                {sourceConfig.logo ? (
                  <Image
                    src={sourceConfig.logo}
                    alt={sourceConfig.name}
                    width={48}
                    height={24}
                    className="h-6 w-auto object-contain dark:invert"
                  />
                ) : (
                  <span className="text-xs font-medium">
                    {sourceConfig.name}
                  </span>
                )}
              </div>

              {/* Seller Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{sourceConfig.name}</span>
                  {offer.seller && offer.seller !== "Amazon" && (
                    <span className="text-muted-foreground text-sm">
                      – {offer.seller}
                    </span>
                  )}
                  {isBestPrice && (
                    <Badge className="bg-emerald-500 text-white">
                      Best Price
                    </Badge>
                  )}
                </div>
                <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-3 text-sm">
                  {offer.freeShipping && (
                    <span className="flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      Free shipping
                    </span>
                  )}
                  {offer.availability === "in_stock" && (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-3.5 w-3.5" />
                      In Stock
                    </span>
                  )}
                </div>
              </div>

              {/* Condition */}
              <div className="hidden shrink-0 sm:block">
                <Badge variant="outline" className={conditionConfig.className}>
                  {conditionConfig.label}
                </Badge>
              </div>

              {/* Price */}
              <div className="shrink-0 text-right">
                <p className="text-foreground text-xl font-bold">
                  {formatCurrency(offer.price)}
                </p>
                {offer.listPrice && offer.listPrice > offer.price && (
                  <p className="text-muted-foreground text-sm line-through">
                    {formatCurrency(offer.listPrice)}
                  </p>
                )}
              </div>

              {/* Action Button */}
              <a
                href={offer.affiliateLink}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0"
              >
                <button
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:scale-[0.98]",
                    offer.source === "ebay"
                      ? "border border-[#E53238]/50 bg-[#E53238] text-white hover:bg-[#CC2D32]"
                      : "border border-[#FCD200]/50 bg-[#FFD814] text-black hover:bg-[#F7CA00]",
                  )}
                >
                  View Deal
                  <ExternalLink className="h-4 w-4" />
                </button>
              </a>
            </div>

            {/* Mobile condition */}
            <div className="border-t px-4 py-2 sm:hidden">
              <Badge variant="outline" className={conditionConfig.className}>
                {conditionConfig.label}
              </Badge>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
