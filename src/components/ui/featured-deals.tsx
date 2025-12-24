"use client";

import { getCountryByCode } from "@/lib/countries";
import { ArrowRight, HardDrive, TrendingDown } from "lucide-react";
import Link from "next/link";

interface Deal {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  parentSlug: string;
  originalPrice: number;
  bestUnitPrice: number;
  unitLabel: string;
  savings: number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  badge?: string;
  priceHistory: number[]; // Last 7 data points
  lastChecked: string;
}

const deals: Deal[] = [
  {
    id: "101",
    name: "SAMSUNG 990 PRO SSD 2TB NVMe M.2 PCIe Gen4",
    category: "Hard Drives & SSDs",
    categorySlug: "hard-drives",
    parentSlug: "electronics",
    originalPrice: 197.99,
    bestUnitPrice: 98.99,
    unitLabel: "TB",
    savings: 0,
    icon: HardDrive,
    iconColor: "from-muted/50 to-muted",
    badge: "Most Viewed",
    priceHistory: [160, 155, 158, 140, 120, 100, 94.99],
    lastChecked: "2 mins ago",
  },
  {
    id: "102",
    name: "Seagate Exos X18 18TB Enterprise HDD",
    category: "Hard Drives & SSDs",
    categorySlug: "hard-drives",
    parentSlug: "electronics",
    originalPrice: 319.99,
    bestUnitPrice: 17.77,
    unitLabel: "TB",
    savings: 94,
    icon: HardDrive,
    iconColor: "from-muted/50 to-muted",
    badge: "Best Value",
    priceHistory: [280, 275, 260, 255, 240, 250, 249.99], // Price history of the Unit Total, or per Unit? Let's assume Unit Total for graph usually.
    lastChecked: "Just now",
  },
  {
    id: "103",
    name: "WD_BLACK 2TB SN850X NVMe Internal Gaming SSD",
    category: "Hard Drives & SSDs",
    categorySlug: "hard-drives",
    parentSlug: "electronics",
    originalPrice: 176.9,
    bestUnitPrice: 88.45,
    unitLabel: "TB",
    savings: 0,
    icon: HardDrive,
    iconColor: "from-muted/50 to-muted",
    priceHistory: [180, 180, 180, 180, 180, 180, 180], // Flat line
    lastChecked: "1 hour ago",
  },
];

export function FeaturedDeals({ country = "us" }: { country?: string }) {
  // Get country configuration
  const countryConfig = getCountryByCode(country);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(countryConfig?.locale || "en-US", {
      style: "currency",
      currency: countryConfig?.currency || "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Show all 3 deals
  const getVisibleDeals = () => {
    return deals.slice(0, 3);
  };

  return (
    <section
      id="top-value-opportunities"
      className="container mx-auto scroll-mt-20 px-4 py-4 sm:scroll-mt-32 sm:py-10"
    >
      <div className="border-border mb-4 flex items-end justify-between border-b pb-2">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight">
          Top Value{" "}
          <span className="text-muted-foreground xs:inline hidden text-base font-normal">
            / Low Unit Price
          </span>
        </h2>
        <Link
          href={`/${country}/categories`}
          className="text-foreground flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold"
        >
          View All
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="border-border/50 w-full overflow-hidden rounded-lg border text-base">
        {/* Table Header */}
        <div className="text-muted-foreground bg-muted/20 border-border/50 grid grid-cols-[1.5rem_1fr_5rem_3.5rem] gap-2 border-b px-2 py-2 text-sm font-medium sm:grid-cols-[3rem_1fr_8rem_6rem_6rem] sm:gap-4 sm:px-3">
          <div className="text-center">#</div>
          <div>Product</div>
          <div className="hidden sm:block">Category</div>
          <div className="text-right">Unit Price</div>
          <div className="text-right">Trend</div>
        </div>

        {/* Table Body */}
        <div className="divide-border/50 divide-y">
          {getVisibleDeals().map((deal, idx) => (
            <Link
              key={`${deal.id}-${idx}`}
              className="hover:bg-muted/30 group text-foreground grid grid-cols-[1.5rem_1fr_5rem_3.5rem] items-center gap-2 px-2 py-3 no-underline transition-colors sm:grid-cols-[3rem_1fr_8rem_6rem_6rem] sm:gap-4 sm:px-3"
              href={`/${country}/${deal.parentSlug}/${deal.categorySlug}`}
            >
              {/* Rank */}
              <div className="text-muted-foreground group-hover:text-primary text-center font-mono text-sm font-medium sm:text-base">
                {idx + 1}
              </div>

              {/* Product */}
              <div className="flex min-w-0 items-center gap-2 overflow-hidden sm:gap-3">
                <div className="bg-muted text-muted-foreground xs:flex flex hidden h-6 w-6 shrink-0 items-center justify-center rounded">
                  <deal.icon className="h-3.5 w-3.5" />
                </div>
                <div className="group-hover:text-primary truncate text-base font-medium transition-colors">
                  {deal.name}
                  <div className="text-muted-foreground truncate text-sm font-normal sm:hidden">
                    {deal.category}
                  </div>
                </div>
                {idx === 0 && (
                  <span className="hidden h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500 sm:block" />
                )}
              </div>

              {/* Category (Desktop) */}
              <div className="text-muted-foreground hidden truncate text-sm sm:block">
                {deal.category}
              </div>

              {/* Price */}
              <div className="text-foreground text-right font-mono text-sm font-bold tracking-tight sm:text-base">
                {formatCurrency(deal.bestUnitPrice)}
                <span className="text-muted-foreground text-normal ml-0.5 block font-sans text-sm sm:inline">
                  /{deal.unitLabel}
                </span>
              </div>

              {/* Trend */}
              <div className="text-right text-sm">
                {deal.savings > 0 ? (
                  <span className="inline-flex items-center justify-end gap-0.5 font-medium text-emerald-600 sm:gap-1">
                    <span className="hidden sm:inline">Drop</span>
                    <TrendingDown className="h-3 w-3" />
                  </span>
                ) : (
                  <span className="text-muted-foreground">Stable</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
