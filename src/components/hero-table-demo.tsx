"use client";

import { useState, useEffect, startTransition } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Search, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  hardDriveProducts,
  batteryProducts,
  powerSupplyProducts,
  categoryConfig,
  categories,
  type HardDriveProduct,
  type BatteryProduct,
  type PowerSupplyProduct,
} from "@/lib/data/demo-products";

export function HeroTableDemo() {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // React Compiler automatically memoizes these - no need for useMemo
  const currentCategory = categories[currentCategoryIndex];
  const config = categoryConfig[currentCategory];

  // Rotation logic - pauses on hover/focus for accessibility
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setFadeOut(true);
      setTimeout(() => {
        // Use startTransition for non-urgent state updates
        startTransition(() => {
          setCurrentCategoryIndex((prev) => (prev + 1) % categories.length);
        });
        setFadeOut(false);
      }, 300); // Half of transition duration
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered]);

  // React Compiler automatically memoizes this - no need for useMemo
  const products =
    currentCategory === "harddrives"
      ? hardDriveProducts
      : currentCategory === "batteries"
      ? batteryProducts
      : powerSupplyProducts;

  return (
    <div
      className="relative w-full max-w-5xl mx-auto perspective-1000"
      role="region"
      aria-label="Interactive product comparison demo"
      aria-live="polite"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
    >
      {/* Background Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/10 rounded-full blur-[120px] -z-10"
        aria-hidden="true"
      />

      <Card className="border-border/40 bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden ring-1 ring-border/50 rounded-3xl">
        {/* Top Bar (Browser/App Header) */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-muted/40">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <div className="flex gap-1.5 shrink-0">
              <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
              <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
              <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
            </div>
            <div className="h-4 w-px bg-border shrink-0" />
            <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0 flex-1">
              <Search className="w-3 h-3 shrink-0" />
              <span className="truncate">{config.url}</span>
            </div>
          </div>

          {/* Value Proposition Badge */}
          <Badge className="bg-primary/20 text-primary border-primary/30 text-sm animate-pulse shrink-0">
            <Sparkles className="w-3 h-3 mr-1" />
            Sorted by Unit Price
          </Badge>
        </div>

        <div
          className={cn(
            "flex h-[350px] sm:h-[450px] transition-opacity duration-300",
            fadeOut && "opacity-50"
          )}
          style={{ willChange: fadeOut ? "opacity" : "auto" }}
        >
          {/* Sidebar */}
          <div className="w-28 sm:w-40 border-r border-border bg-muted/20 p-2 sm:p-4 hidden sm:block">
            <div className="space-y-6">
              <div>
                <div className="text-sm font-semibold text-foreground mb-3">
                  {config.filters.filter1.title}
                </div>
                <div className="space-y-2">
                  {config.filters.filter1.options.map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-[3px] bg-primary/80"
                        aria-hidden="true"
                      />
                      <span className="text-sm text-muted-foreground">
                        {option}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-foreground mb-3">
                  {config.filters.filter2.title}
                </div>
                <div className="space-y-2">
                  {config.filters.filter2.options.map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-[3px] border border-muted-foreground/30"
                        aria-hidden="true"
                      />
                      <span className="text-sm text-muted-foreground">
                        {option}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-foreground mb-3">
                  {config.filters.filter3.title}
                </div>
                <div className="space-y-2">
                  {config.filters.filter3.options.map((option) => (
                    <div key={option} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-[3px] border border-muted-foreground/30"
                        aria-hidden="true"
                      />
                      <span className="text-sm text-muted-foreground">
                        {option}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0 bg-muted/40">
            {/* Page Header */}
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">
                  {config.title}
                </h2>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-hidden">
              <div className="w-full min-w-[600px]">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-border text-[11px] sm:text-sm font-semibold text-muted-foreground bg-muted/50">
                  <div className="col-span-3 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {config.unitLabel}
                  </div>
                  <div className="col-span-5 sm:col-span-4">Product</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2">
                    {currentCategory === "harddrives" && "Capacity"}
                    {currentCategory === "batteries" && "Pack"}
                    {currentCategory === "powersupplies" && "Watts"}
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-border">
                  {products.map((product: any, idx) => (
                    <div
                      key={product.id}
                      className={cn(
                        "grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs sm:text-sm transition-all hover:bg-muted/50",
                        idx === 0 &&
                          "bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-200/50 dark:ring-blue-800/50"
                      )}
                    >
                      <div className="col-span-3 font-mono font-bold text-foreground flex items-center gap-2">
                        {config.currency}
                        {currentCategory === "harddrives"
                          ? (product as HardDriveProduct).pricePerUnit.toFixed(3)
                          : currentCategory === "batteries"
                          ? (product as BatteryProduct).pricePerUnit.toFixed(2)
                          : (product as PowerSupplyProduct).pricePerUnit.toFixed(3)}
                        {idx === 0 && (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border-0 h-4 px-1.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider">
                            Top
                          </Badge>
                        )}
                      </div>
                      <div className="col-span-5 sm:col-span-4">
                        <span className="text-primary font-medium truncate block">
                          {product.name}
                        </span>
                      </div>
                      <div className="col-span-2 font-mono text-muted-foreground">
                        {config.currency}
                        {product.price.toFixed(2)}
                      </div>
                      <div className="col-span-2 font-mono text-muted-foreground text-[11px] sm:text-sm">
                        {currentCategory === "harddrives" &&
                          `${(product as HardDriveProduct).capacity}${(product as HardDriveProduct).capacityUnit}`}
                        {currentCategory === "batteries" &&
                          `${(product as BatteryProduct).packSize}p`}
                        {currentCategory === "powersupplies" &&
                          `${(product as PowerSupplyProduct).wattage}W`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Integrated Insight Bar - Replaces the obstructive floating box */}
            <div className="mt-auto px-4 py-3 border-t border-border bg-primary/3 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 rounded-full text-xs font-bold text-primary shrink-0 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3" />
                  Insight
                </div>
                <p className="text-foreground/80 font-medium truncate">
                  {config.insightText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
